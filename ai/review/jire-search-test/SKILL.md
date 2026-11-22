---
name: jira-search-test
description: Search Jira for failing test issues in the Deephaven (DH) project. Use when looking up failing tests by name, searching for test exceptions, finding issues with nightly-failure labels, or investigating CI test failures. Triggers on mentions of test failures, flaky tests, nightly failures, or test names. Extends jira-search with test-specific search dimensions.
---

## Overview

This skill extends **jira-search** with test-specific search dimensions, augmenting the error text search in the general skill. It adds:
- **Test name search** — find tickets by test class or method name
- **Nightly-failure label search** — find tickets tagged with CI nightly failures
- **Cross-test matching** — detect shared root causes across different tests

For auth, error text parsing, error text search, cross-ticket matching, LCS ranking, duplicate detection, and result presentation, follow the **jira-search** skill. The additional searches below are run in parallel with jira-search's Step 1 and their results are merged into the same ranking pipeline.

## Input Parsing — Test Name (Atomic Terms)

In addition to error text parsing from jira-search:

- If user provides a path with slashes, take everything after the last slash
- Strip file extensions (`.java`, `.groovy`, `.py`, etc.)
- Example: `io/deephaven/enterprise/FooTest.java` → `FooTest`
- If user gives a fully qualified class: `io.deephaven.enterprise.FooTest.testBar` → use as-is but also try `testBar` and `FooTest` as separate queries

**Extracted test names are atomic terms** — they are searched as-is by this skill and are **not subject to multi-token splitting** (see jira-search "Atomic terms" section). Any remaining text after test name extraction goes through normal multi-token splitting in jira-search.

## Additional Search Dimensions

Run **all** of the following in parallel with jira-search's Step 1 (error text search).

### Test name search

```
mcp0_search(query="<basename>")
mcp0_searchJiraIssuesUsingJql(cloudId=..., jql='project = DH AND text ~ "<basename>" ORDER BY created ASC')
```

If the user provided a fully qualified class, also search the short name variants.

### Nightly-failure label search

Always include when the context involves CI or nightly failures:

```
mcp0_searchJiraIssuesUsingJql(cloudId=..., jql='project = DH AND labels = "nightly-failure" ORDER BY created ASC')
```

### Cross-test matching

For tickets that matched on **error text** (from jira-search), check whether they reference a **different test name** than the user's input.

- If the same error appears in a ticket about a different test → this is a **cross-test match** and indicates a shared root cause
- Cross-test matches get a 1.5× bonus in LCS ranking (same as the cross-ticket bonus in jira-search, but specifically applied when the differing context is a different test)
- **Cross-test matches take precedence** in ranking — they are more important than a test-name-only match because they reveal the error affects multiple tests

### Combine with jira-search results

Merge and deduplicate results from all searches (test name, nightly-failure label, and error text from jira-search). Tag each result with which search(es) matched.

## Additional Ranking Rules

These apply on top of jira-search's LCS ranking (Step 2):

- **Exact test name matches are always kept** regardless of LCS length — a ticket whose summary contains the exact test name is never discarded by LCS thresholds
- When narrowing the shortlist (Step 3), also consider file extensions in the match as a tiebreaker
- Nightly-failure label matches break ties when LCS scores are equal

## Validation Tests

Re-run these after skill changes to confirm correctness. Compare primary result and table structure against expected output.

> **Data freshness**: Results verified mid-February 2026. When re-running months later, new tickets or aged-out data may shift results — add a date filter (e.g., `created <= "2026-02-15"`) to JQL searches if tests fail due to data drift.

### Test 1: Test name + Java exception
- **Input**: `removeFilteredPartitionedChecker` + `ControllerException: Stream closed unexpectedly`
- **Expected primary**: DH-21121 — "Flaky test: testRemoveFilteredPartition PQ"
- **Expected cross-test**: DH-21002 — "Flaky controller scenario: Stream closed unexpectedly" (→ link to DH-21121)
- **Expected skip**: DH-19177 — already linked to DH-21121
- **Notes**: Tests test name search + error text search, cross-test matching, and duplicate detection.

### Test 2: Test name only (high noise)
- **Input**: `InputTables`
- **Expected primary**: DH-21119 — "Flaky test: InputTablesCorePlus.groovy PQ"
- **Expected linking**: DH-18682 — "Flaky InputTables test cases" (❌ Shipped, → link to DH-21119)
- **Notes**: Short generic term (11 chars). Tests test name search only, resolved/unresolved separation.

### Test 3: Nightly failure with generic term
- **Input**: `timeout` (in context of nightly CI failure)
- **Expected primary**: DH-20381 — "Frequent PQ timeouts..." (has `nightly-failure` label)
- **Expected**: Many results, all tied at LCS 7 chars. Nightly-failure label breaks the tie.
- **Notes**: Tests behavior with generic input + label search.