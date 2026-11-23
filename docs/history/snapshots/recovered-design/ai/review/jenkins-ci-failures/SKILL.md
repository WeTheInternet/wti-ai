---
name: jenkins-ci-failures
description: Fetch failing tests from a Jenkins Multibranch Pipeline build using Jenkins MCP Server tools, with safe read-only behavior and clear, structured output.
---

# Skill: Jenkins CI failures (Multibranch Pipeline)

## Purpose
Retrieve the failing tests for a Jenkins Multibranch Pipeline job (branch build or PR build) and present them in a compact, actionable table. Prefer structured test reports when available; otherwise fall back to safe, bounded log inference. Provide links only for artifacts.

## Applicable when
- A user reports CI failures on Jenkins and wants failing test names, locations, and a quick summary.
- The Jenkins job is a Multibranch Pipeline (e.g., `repo/main`, `repo/PR-123`, `repo/feature/foo`).

## Not applicable when
- The user requests actions that change Jenkins state (trigger/stop builds, replay, configuration changes).
- Credentials or access policies are missing and cannot be fixed by the operator.

## Allowed tools (allowlist)
Only the following MCP tools may be used:
- `getStatus`
- `whoAmI`
- `getJobs`
- `getJob`
- `getBuild`
- `searchBuildLog`
- `getBuildLog`
- `getBuildChangeSets`
- `getQueueItem`

## Explicitly disallowed actions
The assistant must not:
- Create/modify/delete Jenkins jobs, pipelines, folders, credentials, views, or nodes.
- Trigger builds, rebuild, replay, abort/stop builds, or approve input steps.
- Download artifact contents or source code; only list artifact metadata and links.
- Write files, update repositories, or change infrastructure based on Jenkins output.

## Preconditions
- Jenkins MCP Server plugin is configured with a base URL and allowlists.
- Caller has read-only access to the relevant job(s) and builds.

## Tool introspection
Before attempting any log inference, check if a dedicated test-report tool exists (e.g., `getTestReport`).
- If a test-report tool exists and works for the selected build, prefer it.
- If it does not exist or returns no usable data, use the log-inference workflow below.

## Authentication and access check (must be first)
1. Call `getStatus`.
   - If unauthenticated/expired/invalid, stop and request the operator to re-authenticate.
2. Call `whoAmI`.
   - Confirm principal and server identity.
   - If the server is not the expected environment, stop.

## Inputs to collect from the user
Ask for the minimum information needed; infer safely when possible.
- Jenkins job identifier (preferred): full multibranch path (folder(s) + multibranch job name).
- Branch/PR identifier (one of):
  - branch name (e.g., `main`, `release/1.2`)
  - PR number (e.g., `123`)
  - build URL (if provided, use it as authoritative if MCP supports deriving job/build)
- Build selection:
  - specific build number (if known)
  - otherwise: “latest failed” (default), or “latest completed” when failure status is unclear.

## Job selection and resolution logic
Use job listing sparingly.
1. If the user provides an exact job path, call `getJob` directly.
2. Otherwise call `getJobs` with a narrow prefix/filter if supported.

Resolution rules:
- If user provides PR number: prefer a PR job (commonly `PR-<n>`), but rely on actual job names from Jenkins.
- If user provides a branch name: match exactly; if multiple matches exist (e.g., similarly named branches), ask a clarifying question.
- If neither is provided:
  - Prefer the default branch if Jenkins exposes it; otherwise ask.

Stop conditions:
- If job lookup yields 0 matches, stop and ask for:
  - full multibranch job path
  - exact branch/PR name
- If resolution yields >1 plausible candidate, stop and ask the user to choose.
- If `getJobs` returns a huge list, stop and ask the user for a narrower folder/job prefix.

## Build selection
1. Use `getJob` to obtain build references for the selected job.
2. Select build using priority:
   1) Explicit build number from the user
   2) Latest build with result in {`FAILURE`, `UNSTABLE`} (prefer `FAILURE`)
   3) Latest completed build (result not null)

Stop conditions:
- No builds returned: stop and report that no builds exist or access is denied.
- Selected build is still running (`building=true`):
  - If a completed build exists, use the latest completed build.
  - Otherwise stop and tell the user the build is in progress.

## Data retrieval steps
After selecting the build:
1. Call `getBuild`.
   - Capture: build URL, number, timestamp, duration, result, branch/PR name, and any change summary (if present).
2. Try structured test report (if tool exists per Tool introspection).
   - If present and includes failures, use it as primary source.
3. Log inference workflow (only if needed):
   - Use `searchBuildLog` first for common failure patterns and test summaries.
   - Only if needed, fetch bounded snippets with `getBuildLog`.

Common patterns to search for:
- JUnit/Gradle/Maven: `<<< FAILURE!`, `There were failing tests`, `Tests run:`, `FAILURE:`
- Pytest: `short test summary info`, `FAILED`, `E   AssertionError`
- Jest: `FAIL`, `●`
- Go test: `--- FAIL:`, `panic:`

## Output format
Always produce:
1) Build summary
- Job: `<full job path>`
- Branch/PR: `<resolved branch>`
- Build: `#<number>`
- Result: `<result>`
- URL: `<build url>`
- Duration: `<duration>`
- When: `<timestamp>`

2) Failing tests table
Return a Markdown table with columns:
| Test | Suite/Class | File/Location | Error (first line) | Source | Evidence |

Guidance:
- `Test`: test case name if available; otherwise best identifier from log inference.
- `Suite/Class`: test class or suite if available.
- `File/Location`: file path + line when present; otherwise blank.
- `Error (first line)`: first non-empty line of failure message.
- `Source`: `testReport` or `log`.
- `Evidence`: link to build URL or a short quoted log line identifier (no large paste).

3) Notes
- If parsing was best-effort, state clearly what was and was not available.
- Include a “Next suggested step” only as a suggestion (e.g., “open the build URL and inspect full log”), without performing actions.

## Safety, performance, and rate limits
- Maximum network calls per request: 10.
- Read-only by default. The tool `triggerBuild` must not be used unless the user explicitly requests a new run.
- Prefer `searchBuildLog` over `getBuildLog`.
- Log retrieval bounds:
  - Never fetch full logs.
  - Cap `getBuildLog` to small ranges/bytes (start with the minimum that can contain relevant context).
  - If more scope is needed, ask the user before expanding.
- `getJobs` bounds:
  - Avoid unfiltered job enumeration.
  - If the job list is large, ask the user for a narrower path/prefix.
- Redaction:
  - Do not repeat secrets, tokens, or credentials if they appear in logs.
  - If sensitive patterns are detected, redact with `***` and note that redaction occurred.

## Error handling
- 401/403: report missing access; stop.
- 404: confirm job path and branch/PR name; stop.
- 5xx/timeouts: retry once; if still failing, stop and report.

## Validation tests (scenarios; do not execute)
1. PR build with test-report tool available
   - Given: multibranch job `org/repo`, PR `123`, latest build is `FAILURE`.
   - When: tool resolves to PR branch and fetches test report.
   - Then: output includes build summary and a failing tests table sourced from `testReport` with at least one failure.

2. Branch build without test-report tool, log inference works
   - Given: branch `main`, latest failed build has no test report tool available (or it returns no data).
   - When: tool uses `searchBuildLog` and then bounded `getBuildLog` snippets to find `<<< FAILURE!` patterns.
   - Then: output marks `Source=log` and includes extracted test identifiers and first-line errors.

3. Ambiguous branch/job selection
   - Given: user provides branch `release` but multiple candidates exist.
   - When: assistant attempts to resolve.
   - Then: assistant stops and asks user to choose, without fetching builds/logs.

4. Huge job list
   - Given: `getJobs` would return a very large list.
   - When: assistant attempts discovery.
   - Then: assistant stops and requests a narrower folder/job prefix.

5. Build still running
   - Given: latest build is building with no result.
   - When: assistant selects builds.
   - Then: assistant uses latest completed build if present; otherwise stops and indicates build in progress.

6. Permission denied
   - Given: status is valid but `getBuild` returns 403.
   - When: assistant attempts retrieval.
   - Then: assistant stops and reports missing read permissions and suggests contacting DevOps.
