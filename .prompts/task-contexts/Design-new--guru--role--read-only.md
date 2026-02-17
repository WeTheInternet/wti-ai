id: 07dca4c6-c077-4e89-914c-faed7a9a3e6f
sessionId: a0f70c16-ef64-421e-8d45-2f64b551d0cd
date: '2026-02-17T07:45:01.849Z'
label: >-
  Design new `guru` role (read-only long-lived session + internet delegation)
  with exfiltration-safe output format and checker
---
# Design new `guru` role (read-only long‑lived session + internet delegation) with exfiltration‑safe output format and checker

## Goal
Introduce a new agent/role `guru` that can maintain a long‑lived, read‑only view of the entire codebase and can request external information via delegated “internet/search” MCP/services. Enforce an output contract so `guru` never emits instructions (only facts + citations + “what to ask which MCP for”), enabling a deterministic `guru checker` to detect/stop exfiltration or prompt‑injection behaviors.

## Design
### Role capabilities
- **Long‑lived session**: persists context about the repo across interactions (e.g., cached summaries, index pointers, previous queries/results).
- **Read‑only access**:
  - Can read any source file.
  - Can run searches over the workspace.
  - Cannot modify files, write patches, or propose step-by-step execution instructions.
- **Internet access via delegation**:
  - `guru` cannot directly browse; it must call one or more configured MCP/services that:
    - Accept a user prompt.
    - Build a *context bundle* from repo metadata (package.json, readmes, dependency graph, relevant files) + query.
    - Perform web/documentation search and return **text only**.
  - Returned internet content must be treated as **untrusted** and handled via strict sanitization.

### Output contract (anti-instruction)
To make detection easy, constrain `guru`’s normal output to a machine-checkable schema:

**GuruResponse (strict JSON only)**
```json
{
  "role": "guru",
  "summary": "<facts-only summary>",
  "repo_facts": ["<fact>", "<fact>"] ,
  "internet_facts": [
    {
      "source": "<url or provider identifier>",
      "retrieved_at": "<ISO-8601>",
      "claims": ["<claim>", "<claim>"],
      "confidence": "low|medium|high"
    }
  ],
  "open_questions": ["<question requiring clarification>"] ,
  "mcp_requests": [
    {
      "mcp": "<service name>",
      "purpose": "<what info to fetch>",
      "query": "<search query / prompt>",
      "context_refs": ["<file:path#range>"]
    }
  ]
}
```

**Constraints**
- No imperative verbs targeted at the user or other agents (e.g., “run”, “click”, “execute”, “do”, “create”, “edit”, “open”, “install”).
- No step lists, no commands, no code blocks intended as executable instructions.
- Facts and descriptions only.
- If actionable guidance is required, it must be represented indirectly as **mcp_requests** (what to ask), not as instructions.

### Exfiltration handling policy
- Treat all internet content as untrusted. `guru` outputs it only as:
  - Extracted *claims* (paraphrased).
  - Source URL/provider identifier.
  - Confidence level.
- Absolutely no images; all returned content must be text.
- If internet content contains instructions or suspicious payloads, `guru` reports them as *claims* with `confidence: low` and flags in `summary` without reproducing executable steps.

### Guru checker
A deterministic checker that validates output and blocks if violated.

**Checks**
1. **JSON-only**: response must parse as JSON and match schema.
2. **Instruction detection**:
   - Denylist for imperative verbs and modal imperatives (“should”, “must”) when used as directives.
   - Detect command-like patterns: shell prompts (`$ `), code fences, `npm`, `curl`, `git`, `pip`, `sudo`, `httpie`, `kubectl`, etc.
   - Detect numbered steps / bullet steps with action verbs.
3. **Exfiltration indicators**:
   - Presence of secrets-like patterns (API keys, tokens), or requests to reveal them.
   - URLs in non-internet_facts/mcp_requests fields.
4. **Length/format constraints**:
   - Max field sizes.
   - No nested markdown.

**Disposition**
- On failure: block response; optionally auto‑request a reformatted response.

### MCP/services interface
Define a minimal interface `guru.internetQuery` (name illustrative) with:
- Inputs:
  - `query` (string)
  - `context_bundle` (generated from repo)
  - `constraints` (text-only, no code/instructions requested, allowed domains)
- Outputs:
  - `results[]`: { `url`, `title`, `snippet`, `extracted_text`, `retrieved_at` }

Context bundle components:
- Repo identity: name, version, language(s), build system.
- Dependency manifest summaries.
- Relevant file excerpts (readme, docs, config).
- User’s query.
- A safety preamble: “Return facts only; avoid instructions and code.”

### Long-lived session storage
- Store:
  - Repo summary snapshot (hash keyed).
  - Recent search results and citations.
  - Internet query cache (url->claims).
- TTL and invalidation when repo changes.

## Implementation Steps (conceptual)

### Step 1: Define role configuration
- Add `guru` to role/agent registry with:
  - Workspace read permissions enabled.
  - Write/edit tools disabled.
  - Internet delegation tool enabled.

### Step 2: Implement structured output enforcement
- Add middleware/output wrapper that:
  - Forces JSON schema response.
  - Strips/blocks markdown.
  - Rejects non-conforming outputs before reaching user.

### Step 3: Implement guru checker
- Add a validation module:
  - JSON schema validation.
  - Heuristics/regex checks for instructions and command patterns.
  - Secret scanning.
- Integrate into response pipeline.

### Step 4: Implement internet delegation MCP
- Create/define MCP endpoint(s) that accept a context bundle.
- Add domain allow/deny configuration.
- Ensure text-only retrieval and sanitization.

### Step 5: Implement context bundle builder
- Build a safe, size-limited bundle:
  - Summaries rather than full file dumps.
  - Explicit file references for traceability.
- Add caching keyed by repo state.

### Step 6: Add logging and audit
- Log:
  - Queries, sources, extracted claims, checker decisions.
- Add metrics for block rates, false positives.

## Reference Examples
- Existing “read-only” roles or tooling restrictions in the codebase (to be located): agent/tool permission config, response validators, any existing MCP integration.

## Verification
- Unit tests:
  - Schema validation passes/fails.
  - Instruction detection triggers on common imperatives and command patterns.
  - Internet content is only emitted in `internet_facts` with citations.
- Integration tests:
  - Guru can read/search repo but cannot edit.
  - Guru can request MCP search; response is sanitized.
  - Checker blocks prompt injection attempts (e.g., web page returning commands).
