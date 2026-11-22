---
name: jira-search
description: Search Jira issues in the Deephaven (DH) project. Use for any general Jira issue search — exceptions, build errors, error messages, feature requests, or bug reports. Triggers on mentions of Jira, ticket lookup, error searching, or issue search. For test-specific searches (failing tests, nightly failures, test names), prefer the jira-search-test skill instead.
---

## Security & Allowed MCP Tools

### Allowed tools (read-only)

This skill uses **only** these `mcp0` tools. Do not call any other `mcp0_*` tools.

| Tool | Purpose | Why needed |
|---|---|---|
| `mcp0_getAccessibleAtlassianResources` | Auth check + extract `cloudId` | Required before any JQL search |
| `mcp0_search` | Rovo Search (keyword/AI search) | Primary search — broad coverage across Jira + Confluence |
| `mcp0_searchJiraIssuesUsingJql` | JQL Search (structured query) | Primary search — precise project/label/resolution filtering |
| `mcp0_getJiraIssue` | Get issue details | Inspect issue links, comments, description for LCS/dedup |
| `mcp0_getJiraIssueRemoteIssueLinks` | Get issue links | Check if tickets are already linked (duplicate detection) |

### Explicitly disallowed tools

**Never call these tools from this skill or any skill that extends it:**

- `mcp0_transitionJiraIssue` — **writes** to Jira (changes issue status)
- Any tool not in the allowed list above — this includes `mcp0_lookupJiraAccountId`, `mcp0_getVisibleJiraProjects`, `mcp0_getTransitionsForJiraIssue`, `mcp0_getJiraIssueTypeMetaWithFields`, `mcp0_getJiraProjectIssueTypesMetadata`, `mcp0_atlassianUserInfo`, `mcp0_fetch`

These tools are either write-capable, unnecessary for search, or expose information beyond what this skill needs.

## Prerequisites

### Step 0: Auth check

Before any search, verify the MCP auth token is valid:
1. Call `mcp0_getAccessibleAtlassianResources` (no params)
2. If the call **succeeds**: extract `cloudId` from response — use it in all subsequent calls
3. If the call returns **401 Unauthorized** or an auth error:
   - Tell the user: "Atlassian MCP auth has expired. To fix: **Reload Window** (`Cmd+Shift+P` → `Developer: Reload Window`), then complete the OAuth prompt in the browser. Do NOT reload again after auth."
   - **Stop** — do not proceed with searches until the user confirms auth is restored

### Degraded mode: if one search tool fails mid-search

Both search tools use the same OAuth token (see below), so if auth works, both should work. However, if one tool returns an **API error** (not auth — e.g., 500, timeout, rate limit) while the other succeeds:

- **Continue** with the working tool's results
- **Warn the user**: "⚠️ Searching with [Rovo/JQL] only — [JQL/Rovo] returned an error: `<error>`. Results may be incomplete."
- Do NOT retry the failed tool in the same search run — present what you have

### How auth works (OAuth 2.1 via mcp-remote)

All `mcp0_*` tools share a **single OAuth 2.1 token** managed by `mcp-remote`. Rovo Search and JQL Search use the exact same token — if one works, both work.

**Token lifecycle:**

1. **First authorization**: Browser opens for OAuth consent. You authorize once. An **access token** (~55 min) and **refresh token** (weeks/months) are stored in `~/.mcp-auth/`.
2. **Normal operation**: `mcp-remote` silently refreshes the access token using the refresh token. No browser popup needed. Searches proceeding without a browser prompt is expected behavior.
3. **Refresh token expiry**: The browser prompt only reappears when the refresh token itself expires (typically weeks/months after initial auth).

**Known issue — multiple browser popups on reload**: When Windsurf reloads, it may spawn multiple `mcp-remote` processes simultaneously. Each independently attempts token refresh, and race conditions on the lock file (`~/.mcp-auth/.../lock.json`) can cause several to fall back to full OAuth flows — opening multiple browser tabs. This is a `mcp-remote` infrastructure issue, not a skill or auth failure. Completing auth in any one of the tabs is sufficient; the others can be closed.

**Security note**: The OAuth token grants access to **all** `mcp0_*` tools, including write tools like `mcp0_transitionJiraIssue`. The "Allowed tools" section above is a **skill-level restriction** — it constrains what this skill is permitted to call, not what the token permits. The token itself is as secure as your Atlassian account.

## Input Parsing — Error Text

Errors are NOT always Java exceptions. They may come from shell scripts, Gradle, Python, CI systems, etc.
- **Java**: extract exception class (`java.lang.NullPointerException`) and message (`Something failed`) separately
- **Shell/Gradle/CI**: extract the most specific error message available (e.g., `FAILED: task ':Foo:compileJava'`, `Permission denied`, `No such file or directory`). Only fall back to generic messages like `exit code 1` if nothing more specific is found in the output
- **Python**: extract the exception line from traceback (e.g., `RuntimeError: connection refused`)
- Search each extracted piece **separately** to get a superset of hits
- Truncate at line breaks — do not include stack frames in search text

## Multi-Token Splitting

When the search input contains **multiple whitespace-separated tokens** (e.g., `dispatcher worker timeout`), split it into overlapping search terms at three granularities:

1. **Full phrase** — search the entire input as-is → `dispatcher worker timeout` (weight: **1.0×**)
2. **Adjacent pairs** — every consecutive pair of tokens → `dispatcher worker`, `worker timeout` (weight: **0.7×**)
3. **Individual tokens** — each token separately → `dispatcher`, `worker`, `timeout` (weight: **0.4×**)

Search **all** of these in parallel using the same two tools (Rovo + JQL). A ticket's final token-split score is the **sum** of its weighted matches across all granularities — a ticket matching 2 of 3 individual tokens scores higher than one matching only 1.

This token-split score is combined with the LCS score in Step 2.

**Single-token and exact-phrase inputs** (e.g., `timeout`, `jar: command not found`) skip splitting and are searched as-is.

### Atomic terms (specialized skill override)

Specialized skills (e.g., jira-search-test) may extract **atomic terms** during input parsing — terms that must be searched as-is and **not split into tokens**. For example, a test name like `FooTest` is atomic.

The flow is:
1. Specialized skill parses input → extracts atomic terms (searched as-is by the specialized skill)
2. Remaining text goes through multi-token splitting as described above
3. Both atomic term results and token-split results feed into the same ranking pipeline

## Search Procedure

### Step 1: Cast a wide net (~10 results) to avoid missing any less obvious tickets.

**Query escalation**: Start with the most specific search terms. Only broaden if the specific query returns fewer than 3 results. For example, search `"jar: command not found"` before falling back to `"command not found"`.

**Specialized skills** (e.g., jira-search-test) contribute additional search dimensions that run in parallel with the searches below. Their results are merged and deduplicated into the same candidate pool before ranking.

For each search term (full phrase, adjacent pairs, and individual tokens from multi-token splitting), search in parallel:

```
mcp0_search(query="<term>")
mcp0_searchJiraIssuesUsingJql(cloudId=..., jql='project = DH AND text ~ "<term>" ORDER BY created ASC')
```

Combine and deduplicate results. Tag each result with which query and granularity level matched.

**Project filter**: `mcp0_search` (Rovo) returns results across all Jira projects. **Discard any results not in project DH.** The JQL queries are already scoped to `project = DH`.

**Explicit comment search (text~ can miss comments):**

For each candidate ticket, also inspect comments directly — especially code blocks. `text ~` is unreliable for content inside code blocks and comments. This catches CI logs and stack traces pasted into comments.

### Step 1b: Cross-ticket matching

For tickets that matched on any search criteria, check whether they reference a **different context** (different component, feature, or area) than the user's input.

- If the same error appears in a ticket about a different area → this is a **cross-ticket match** and indicates a shared root cause
- **Cross-ticket matches take precedence** in ranking — they are more important than a single-context match because they reveal the error affects multiple areas

### Step 1c: Suggest error variants

After identifying the primary result, check if its description or acceptance criteria mentions **other error variants** (e.g., the ticket for `jar: command not found` also mentions `jps`, `javac`, `java`). If so, list them as suggested follow-up searches — do NOT auto-search. Present like:

> **Variants noted in DH-XXXX**: `jps: command not found`, `javac: command not found` — search these separately if needed.

### Step 2: Rank by longest common substring (LCS)

Compare each ticket's summary, description, and comments against the user's search input.
- Compute LCS between search input and each ticket's text (summary + description + comments)
- **LCS weighting**: matches in summary count full weight; description 0.8×; comments 0.5×
- **Token-split score**: if multi-token splitting was used, add the accumulated token-split score (full phrase 1.0×, pairs 0.7×, singles 0.4×) to the LCS score for final ranking
- **Cross-ticket bonus**: tickets matching the error text but referencing a different context get a 1.5× bonus — shared root cause is high-value
- **Discard threshold**:
  - For Java exceptions: discard tickets with LCS < 15 characters
  - For non-Java errors (shell, Gradle, Python, CI): **no minimum LCS** — short error messages like `exit code 1` are valid
  - Specialized skills may define additional keep rules (e.g., exact matches on domain-specific terms are always kept regardless of LCS length)
- Sort remaining by weighted LCS score descending

### Step 3: Narrow to shortlist

**Target:** 1 best match, then 2. Only include the next 3-4 if their LCS match against the **search input** is within 80% of the top result's LCS length (e.g., if the top result matched 22 chars of the search input, keep others that matched at least 18 chars of the search input).

**If >10 remain:** apply stricter criteria iteratively:
1. Require longer LCS threshold (20, 25, ...)
2. Require match in summary (not just description)
3. Stop as soon as ≤2 remain; include up to 5 only if scores are tightly clustered

### Step 4: Select primary result

From the shortlist, the **best match** (highest weighted LCS score) among unresolved tickets is the primary result. If multiple tickets are tied on score, use **oldest creation date** as tiebreaker (unresolved only).

The remaining shortlist tickets are presented as candidates to link to the primary result.

### Step 5: Check for closed duplicates

```
mcp0_searchJiraIssuesUsingJql(
    cloudId=...,
    jql='project = DH AND text ~ "<term>" AND resolution != Unresolved ORDER BY created ASC'
)
```

For each closed match:
1. Call `mcp0_getJiraIssue` to check its issue links
2. If already linked to the primary result → skip
3. If NOT linked → inform user: "DH-XXX (closed) appears related — consider linking to DH-YYY"

Only flag closed tickets that have a meaningful LCS match against both the search input AND the primary result's summary (≥15 chars for Java exceptions; use judgment for shorter non-Java errors).

## Duplicate Detection

When the shortlist contains multiple unresolved tickets:
- Compare summaries pairwise using LCS
- If two tickets share LCS ≥ 15 chars in either summary and description → flag as potential duplicates
- Ignore pairs already connected by a Jira "duplicate" link
- Suggest linking the newer ticket as duplicate of the older one

## Result Presentation

Present **all** candidates and results in a single table. Use status, assignee, and created date internally for ranking, but do not include them as columns. Example:

| Key | Summary | Unresolved | LCS match (chars, where) | Suggest linking |
|---|---|---|---|---|
| [DH-21595](https://deephaven.atlassian.net/browse/DH-21595) | jar not mapped after mirror update | ✅ Under Consideration | `jar: command not found` (20, description) | **Primary result** |
| [DH-20100](https://deephaven.atlassian.net/browse/DH-20100) | Build failure: command not found in CI | ✅ Open | `command not found` (17, summary, cross-ticket) | → link to DH-21595 |

Column definitions:
- **Key**: Jira key with clickable link to `https://deephaven.atlassian.net/browse/<key>`
- **Unresolved**: ✅ + status name if unresolved, ❌ + status name if resolved/closed
- **LCS match**: matching substring, char count, and location in parens — e.g. `jar: command not found` (20, description)
- **Suggest linking**: one of: `Primary result`, `→ link to DH-XXXX`, `Already linked to DH-XXXX — skip`, `Potential duplicate of DH-XXXX`

## Validation Tests

Re-run these after skill changes to confirm correctness. Compare primary result and table structure against expected output.

> **Data freshness**: Results verified mid-February 2026. When re-running months later, new tickets or aged-out data may shift results — add a date filter (e.g., `created <= "2026-02-15"`) to JQL searches if tests fail due to data drift.

### Test 1: Specific error message
- **Input**: `jar: command not found`
- **Expected primary**: DH-21595 — "jar not mapped after mirror update"
- **Expected LCS**: `jar: command not found` (20, description) or similar exact match
- **Notes**: Single strong result. Error text search only.

### Test 2: Shell error message (non-Java)
- **Input**: `List only files in the specified resource directory`
- **Expected primary**: DH-21595 — "jar not mapped after mirror update"
- **Expected LCS**: exact match (51, description)
- **Notes**: Long specific error string. Single strong result. Tests non-Java error parsing.

### Test 3: Very generic term
- **Input**: `timeout`
- **Expected**: Many results, all tied at LCS 7 chars. Ranking falls back to oldest creation date among unresolved tickets (per Step 4).
- **Notes**: Tests behavior with generic input. Single token — no splitting. Skill should note the ambiguity and suggest a more specific query.

### Test 4: Multi-token search (token splitting)
- **Input**: `dispatcher worker timeout`
- **Expected searches**: full phrase `dispatcher worker timeout`, pairs `dispatcher worker` + `worker timeout`, singles `dispatcher` + `worker` + `timeout` (12 parallel searches: 6 terms × Rovo + JQL)
- **Expected primary**: DH-21505 — "Worker unable to post status to dispatcher in timely manner" (✅ Under Consideration, all 6 granularities matched, token-split 3.6)
- **Expected related**: DH-14681 — "Make worker dispatcher-response timeout configurable" (❌ Shipped, same `DispatcherClient.init` code path, → link to DH-21505)
- **Expected related**: DH-16808 — "PresenceWatcher timeouts involved in failed worker starts from Dispatcher in a bad state" (❌ Will not implement, all 3 tokens in summary, different root cause)
- **Notes**: Tests multi-token splitting, parallel search at all granularities, and combined scoring. The full phrase search may return few results, but individual tokens surface related tickets that mention subsets of the problem.