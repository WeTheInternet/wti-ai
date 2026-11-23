# Jenkins MCP: DevOps/SRE setup for CI failure review skill

## Overview
This skill relies on the Jenkins “MCP Server” plugin to read build metadata and logs from Jenkins.

Why MCP (instead of scraping/build URL pastes):
- Centralized access control and auditability
- Consistent tool contract
- Built-in allowlists to constrain scope (base URL + job prefixes)
- Easier redaction and rate limiting at the integration boundary

## Security model
- Read-only by design.
- The MCP server enforces:
  - Jenkins base URL allowlist
  - Job/folder prefix allowlist
  - Tool-level allowlist
- The assistant is expected to use only the read-only tool surface defined below.

### Identity and authorization
Use a dedicated Jenkins service account (or API token) scoped to read-only access.

Recommended:
- A dedicated user `mcp-readonly` with an API token.
- Permissions granted via Matrix-based security (or equivalent RBAC plugin).

## Required Jenkins permissions (read-only)
Minimum required permissions (plugin names vary by Jenkins distribution):
- Overall: `Read`
- Job:
  - `Read`
  - `Discover` (to enumerate multibranch child jobs)
- Build:
  - `Read`
- View (optional): `Read` (only if views are used for job discovery)

Do not grant:
- `Job/Build`
- `Job/Configure`
- `Run/Update`
- `Overall/Administer`

## Plugin endpoints / transports
The Jenkins “MCP Server” plugin exposes the following transports:

- Streamable HTTP:
  - `https://<jenkins-url>/mcp-server/mcp`
- SSE:
  - `https://<jenkins-url>/mcp-server/sse`
  - `https://<jenkins-url>/mcp-server/message`
- Stateless:
  - `https://<jenkins-url>/mcp-server/stateless`

## Authentication
- Basic Auth using `username:apiToken`.
- Some deployments also require an `Origin` header; set it to an allowed value for your environment.

## Secrets handling
- Store Jenkins `username` and `apiToken` in a secret store.
- Never pass tokens through chat or client-side configuration.
- Rotate tokens on a schedule and on incident response events.

Token storage guidance:
- Local developer: OS keychain or encrypted local secrets file with strict permissions.
- Hosted MCP: managed secret store (KMS-backed) with access policies limited to the MCP runtime.

## GKE / Helm deployment notes
- Store Jenkins `username` and `apiToken` in a Kubernetes Secret.
- Do not require Jenkins Credentials unless your Jenkins “MCP Server” plugin configuration specifically needs it.

Example (conceptual):
- Secret keys:
  - `JENKINS_USERNAME`
  - `JENKINS_API_TOKEN`

Mount as environment variables or files for the MCP client/sidecar that connects to the Jenkins MCP Server endpoints.

## Ingress and network security
Recommended posture is internal-only exposure.

- Exposure:
  - Prefer internal LB / private Ingress.
  - If internet exposure is required, protect with IAP/OIDC and strict allowlists.
- TLS:
  - Require HTTPS end-to-end.
  - Ensure correct trust chain (consider private CA where applicable).
- Auth hardening:
  - If using IAP/OIDC, keep Basic Auth for Jenkins itself; do not expose tokens to browsers.
  - Consider restricting allowed `Origin` values if used.
- Network controls:
  - Kubernetes NetworkPolicies to restrict access to Jenkins and to the MCP endpoints.
  - Egress policies so only Jenkins base URL is reachable.

## Allowlists
### Base URL allowlist
Configure the integration with an explicit list of allowed Jenkins base URLs, e.g.:
- `https://jenkins.company.example/`

### Job prefix allowlist
Constrain readable jobs to specific folder/job prefixes, e.g.:
- `team-a/`
- `org/repo/`
- `platform/ci/`

Notes:
- Prefer the narrowest feasible prefixes.
- Multibranch pipelines create child jobs under the multibranch container; allowlist must cover the container path.

## Tool contract (MCP)
Tools provided by the Jenkins “MCP Server” plugin:

- `getStatus`
- `whoAmI`
- `getJobs`
- `getJob`
- `getBuild`
- `searchBuildLog`
- `getBuildLog`
- `getBuildChangeSets`
- `getQueueItem`
- `triggerBuild`

Guidance:
- Keep the assistant read-only; `triggerBuild` should be disallowed unless the user explicitly requests a new run.

## Jenkins endpoints used (reference)
These are accessed via the Jenkins MCP Server plugin endpoints listed above.

## Redaction guidance
The MCP layer should apply redaction before returning log output to the assistant.

Recommended redaction patterns:
- Tokens/keys:
  - `(?i)(api[_-]?key|token|secret|password)\s*[:=]\s*\S+`
  - `(?i)authorization:\s*bearer\s+\S+`

Behavior:
- Replace sensitive values with `***`.
- Preserve enough context to debug (key name, not value).

## Rate limiting and caching
Recommended defaults:
- Hard cap: <= 10 Jenkins API calls per user request.
- Log size cap: enforce small bounded retrieval; avoid full logs.
- Timeouts: 10–20s per call; one retry for transient 5xx.

If hosted, implement per-tenant and per-user rate limits.

## Validation
Use the following checklist to validate connectivity and permissions:
- [ ] `whoAmI` returns the expected principal
- [ ] `getStatus` indicates the server is reachable and authenticated
- [ ] `getJobs` returns a small, expected subset (or use a narrow prefix)
- [ ] `getBuild` works for a known job/build
- [ ] `searchBuildLog` returns results for a known failing build without fetching full logs

## Non-goals / explicitly not supported
- Triggering builds, rebuilding, replaying, or scheduling jobs (unless explicitly requested by the user)
- Stopping/aborting builds
- Changing Jenkins job configuration, pipeline definitions, credentials, agents, or folder structure
- Downloading artifact contents beyond links/metadata
- Writing back to repositories or opening PRs based on Jenkins output
