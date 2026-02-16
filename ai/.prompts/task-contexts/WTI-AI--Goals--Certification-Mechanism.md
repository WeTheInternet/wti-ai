id: 537db78c-e5af-4e4a-a99f-258eac279db9
sessionId: bc45c0bf-d7b5-4f4b-8582-3d8e0fe7b37d
date: '2026-02-16T14:59:16.488Z'
label: >-
  WTI-AI: Goals, Certification Mechanism, and Short-Term Plan (Infra-first,
  Theia-native)
---
# WTI-AI — Goals, Certification Mechanism, and Short-Term Plan

## Goal
Stand up a practical, Theia-native workflow for planning and executing work with agent assistance, while building the minimum public infrastructure needed to host and validate the stack (Envoy Gateway + cert-manager + hello-world services + MCP). Convert the current repo from “GPT import” into a staged, reviewable, certifiable program of work.

## Design

### 1) Separate *ultimate vision* from *near-term execution*
Your long-term vision (multi-agent “channels”, resumable context, role-based bots, auditability, auto-run with pause) is valid—but it’s also easy to overbuild.

**Near-term principle:** ship a *single vertical slice* that proves:
1) you can define goals → produce a plan → gate execution → verify results, and
2) infrastructure can host Theia + agent-adjacent services safely.

The multi-channel/multi-team system becomes a *workflow layer* on top of this, not a prerequisite.

### 2) Harsh critique / key risks to manage
- **Mixed tracks:** infra + orchestration + Theia extension + protocols. You need explicit sequencing so you don’t perpetually context-switch.
- **Premature federation:** an external “agent service” is attractive, but building it too early risks duplicating Theia orchestrator capabilities without stable requirements.
- **Public MCP assumption:** you can host MCP publicly, but don’t assume you must do so immediately. Many validations can be done with internal calls first; public exposure is specifically needed only for 3rd-party tool callers (e.g., ChatGPT Connectors). Keep this as a milestone gate.
- **Protocol sprawl:** “Theia compatible + OpenAI compatible + ACP compatible” is a recipe for thrash unless you pick a canonical internal representation and write adapters.

### 3) Recommended architecture stance (for now)
- **Use Theia’s native AI features for planning + skills** now (fast learning loop).
- **Infra team milestone** delivers public HTTPS endpoints and deployment patterns.
- **Defer external orchestrator service** until:
  - you have at least one stable plan format,
  - you have a working approval loop UI/UX (even if crude), and
  - you’ve proven which pieces Theia gives you “for free”.

### 4) Canonical data formats (interoperability strategy)
- **Canonical internal:** JSON (because Theia + OpenAI tool ecosystems assume it; best LLM compatibility).
- **Human-authored configs:** YAML acceptable (e.g., repos.yaml), but anything passed through LLM/tooling should be JSON.
- **Future ACP compatibility:** treat ACP as an adapter target—don’t pick it as your internal source of truth until it’s demonstrably stable in Theia + IntelliJ ecosystems.

---

## High-Level Goals Document (Draft)

### Product vision (V1 → Vn)
1) **Single-user agentic workflow in Theia** where you can ask: “pick next task and construct a work plan,” then execute it with gated steps.
2) **Agent teams / channels**: named work contexts (like Slack channels) containing role-based agents; you can audit decisions and control autonomy.
3) **Resumable context** with explicit “reset/dump context” controls and review checkpoints.
4) **Tooling plane via MCP** with least privilege and progressive hardening.

### Non-goals (near term)
- Multi-user auth, RBAC, and enterprise-grade audit trails.
- Full federation across IDEs.
- Autonomous code changes without human approval.

> Note: **Multi-repo agent teams are a medium-term goal**, but explicitly *out of the immediate work plan* until the single-repo + infra + Theia-native planning loop is stable.

### Foundational principles
- **Everything starts as unreviewed.** Promotion requires explicit certification.
- **Execution is gated.** Plans and patches require approval.
- **Adapters not rewrites.** Build toward interoperability by translating from a stable internal representation.

---

## Differentiating “Reviewed + Certified” vs “Unreviewed”

### Repo-root agent entrypoint (best practice)
Add a repo-root doc that agents read first, in the style of other agentic repos (e.g., `CLAUDE.md` in Theia):
- `AGENTS.md` (or `CLAUDE.md` if you want to match that convention)

This file should:
- link to `docs/INDEX.md`
- define the doc header schema and certification rules
- state the current top priorities
- state what is allowed without approval vs what requires explicit approval

Adopt **`AGENTS.md`** as the canonical agent entrypoint, and add a tiny **`CLAUDE.md`** that only links to `AGENTS.md` (for compatibility with Claude-oriented repo conventions, even if GPT is your preferred daily driver).


### 1) Documentation taxonomy (immediate)
Your preference is **subject/feature discovery at the top level**, with **status as a generated index** (not the canonical storage location).

#### Canonical doc locations (discovery-first)
Create top-level subject directories under `docs/`:
- `docs/adr/` — architecture decisions
- `docs/goals/` — high-level goals (many small docs; avoid giant masters)
- `docs/plans/` — approved work plans / execution playbooks
- `docs/teams/` — team charters, role definitions, skill packs (e.g. `infra/`, `theia/`, `agent/`)
- `docs/features/<feature-name>/` — feature-specific specs, designs, acceptance criteria, implementation notes (numbered if you want ordering)
- `docs/releases/` — release notes (later)
- `docs/user-guide/` — public-facing docs (someday)

#### Status index (generated view)
- `docs/status/<status>/` contains **indexes only** (link lists), generated from YAML headers in the canonical docs.
- Optionally add `docs/status/<status>/P<NN>/` to group by priority (also derived from headers).

**Rule:** content lives in subject/feature directories; `docs/status/**` is rebuildable and never authoritative.

**Rule:** nothing outside `docs/5_certified/` is authoritative.

### 2) Certification header (docs)
Every file in `docs/5_certified/` must start with a standard block:

```markdown
---
status: CERTIFIED
certified-scope: <what this doc is the authority for>
owner: <you>
reviewed-by: <name>
review-date: YYYY-MM-DD
verification:
  - <command/steps proving it>
changelog:
  - YYYY-MM-DD: <summary>
---
```

Everything else should carry `status: DRAFT` or `status: UNREVIEWED`.

### 3) Code certification (later; don’t block early progress)
Adopt your lifecycle per-feature, but keep it lightweight initially.

When ready, implement a per-directory marker file:
- `.wti-status.yaml` with:
  - `status: spike|runnable|deployable|tested|production`
  - `owner`
  - `verification commands`

This is preferable to sentinel dotfiles like `.certified`/`.spike` because it’s extensible and machine-readable.

---

## ADRs (Architecture Decision Records)
An ADR is a short, numbered document capturing a decision:
- **Context** (what problem)
- **Decision** (what you chose)
- **Consequences** (trade-offs)
- **Alternatives** (what you didn’t choose)

Example path: `docs/adr/0001-canonical-plan-json.md`.

ADRs are how you prevent “random ideas” from becoming tribal knowledge.

---

## Short-Term Plan (next 2–4 weeks)

### Milestone 0 — Establish review/certification workflow (1–2 days)
**Outcome:** repo has a visible “trust system” so you can safely iterate.

- Create the docs directory taxonomy listed above.
- In each top-level docs directory (and each `docs/features/<feature-name>/`), add a short `PURPOSE.md` explaining what belongs there and what promotion criteria apply.
- Add a single repo map: `docs/INDEX.md` linking to each `PURPOSE.md`.
- Add (near repo root) an agent-friendly entry doc (see below) and link it from `docs/INDEX.md`.
- Move existing notes into `docs/0_triage/` (including the current handoff prompt).
- Create a certified doc: `docs/5_certified/WTI_AI_GLOSSARY.md` (small, but establishes the pattern).
- Add `docs/README.md` that explains the lifecycle and where to put things.

Files:
- `docs/INDEX.md` (new)
- `docs/**/PURPOSE.md` (new, per directory)
- `docs/README.md` (new)
- `docs/0_triage/` (new)
- `docs/5_certified/` (new)


### Milestone 1 — Infra acceptance criteria and “infra team charter” (1–2 days)
**Outcome:** you have a crisp target that an infra agent team can execute without ambiguity.

Create `docs/status/3_specced/INFRA_ACCEPTANCE_CRITERIA.md` including:
- DNS prerequisites for `conductor.wti.net` (primary for now), plus placeholders for `demo.wti.net`, `mcp.wti.net`
- TLS issuance method: **DNS-01 via Google CloudDNS + Let’s Encrypt**, with scripted GCP service account/IAM/secret creation
- Gateway routes: host-based routing
- Access policy: **`conductor.wti.net` restricted to HOME_IP allowlist from day 1** (simple hardening without going full-paranoia)
- Observability requirements (minimal): logs accessible via `kubectl logs` + basic readiness checks
- Explicit “Definition of Done” checklist.

Recommended prioritized milestones:
1) **Envoy Gateway installed** and responding with a default listener (cluster-internal checks)
2) **cert-manager installed** and a test certificate can be issued (self-check)
3) **Hello-world Quarkus app** reachable at `https://demo.wti.net/` (or `https://demo.wti.net/hello`)
4) **MCP hello service** reachable at `https://mcp.wti.net/hello` (static response)
5) (Optional but high value) **/healthz endpoints** and a smoke-test script


### Milestone 2 — Turn `ai/infra` into a certified, repeatable installer (2–5 days)
You already have a strong start in `ai/infra` (bash tasks + idempotent-ish flow).

**Critical improvements to require before “certified”:**
- Remove “search-citation” artifacts (e.g., `cite...`) from scripts/log lines.
- Keep all shared bash helpers under `ai/infra/bin/` and prefix with `_` to indicate “not runnable directly” (e.g., `ai/infra/bin/_wti-gcloud.sh`).
- Add a contract helper that validates required env vars and tool versions.
- Add a smoke test script: `ai/infra/bin/smoke.sh` that:
  - verifies cluster exists
  - verifies cert-manager pods ready
  - verifies envoy-gateway pods ready
  - verifies GatewayClass exists
- Add tasks/manifests to support cert-manager DNS-01 (Google CloudDNS) prerequisites.

Files to inspect/modify:
- `ai/infra/tasks/060-envoy-gateway.sh` (clean log line; later install manifests)
- `ai/infra/bin/run-all.sh`, `ai/infra/bin/run-task.sh` (fine)
- `ai/infra/lib/wti-gcloud.sh` → migrate/rename to `ai/infra/bin/_wti-gcloud.sh` (review for safety, idempotency, error handling)


### Milestone 3 — Deploy hello-world services behind the Gateway (3–7 days)
**Outcome:** the infra team can prove routing + TLS end-to-end.

- Use **Helm** for app manifests (align with your preference; keep kustomize as a future option).
- Deploy `hello-quarkus` behind the Gateway at **`conductor.wti.net`** (not `demo.wti.net`) to establish the “backend/control-plane hostname” pattern early.
- Defer Theia hosting (`demo.wti.net`) until later; local `localhost:3000` is acceptable for now.
- Keep MCP hello optional/secondary for this milestone; focus on proving the Quarkus backend path first.

Deliverables:
- Helm chart(s) or a single chart with subcharts for:
  - `hello-quarkus` Deployment/Service
  - Gateway API resources (Gateway + HTTPRoute) for `conductor.wti.net`
  - cert-manager Issuer/ClusterIssuer + Certificate resources using **DNS-01 (Google Cloud DNS)**
- Scripted setup for Google DNS solver prerequisites (service account, IAM roles, secret creation).

Decisions needed (record as ADRs):
- single-namespace vs per-component namespaces (recommend: per-component namespaces, but keep it simple in WIP)
- DNS-01 solver implementation details (SA + secret + issuer naming)


### Milestone 4 — Theia-native planning workflow (in parallel, but bounded) (2–5 days)
**Outcome:** you can use Theia AI (skills + task contexts) to generate consistent work plans.

- Create a “Plan template” in `.prompts/` that:
  - forces structured output (JSON plan + narrative)
  - includes acceptance criteria links
  - ends with a verification checklist
- Create skill guidelines in `ai/skills/`:
  - “Infra Planner” (writes specced acceptance criteria)
  - “Infra Implementer” (writes bash/k8s changes)
  - “Infra Reviewer” (critiques idempotency and safety)

Reference:
- `docs/theia/SETUP_NOTES.md` for Theia settings to enable skills and task contexts.


---

## Reference Examples (existing material to follow)
- `MASTER_PLAN.md` — good scaffolding for infra milestones; treat as *planning* input, not certified.
- `ai/infra/README.md` — good “bash-first tasks” structure.
- `docs/theia/SETUP_NOTES.md` — good operational notes for enabling Theia AI features.

---

## Verification

### Infra
- Run: `cd ai/infra && ./bin/run-all.sh`
- Then smoke checks:
  - `kubectl get pods -A | grep cert-manager`
  - `kubectl get pods -A | grep envoy`
  - `kubectl get gatewayclass`
  - `curl -vk https://demo.wti.net/` (expect hello)
  - `curl -vk https://mcp.wti.net/hello` (expect hello)

### Docs certification
- Manual: ensure certified docs contain the required YAML frontmatter header.
- (Later) add a Jenkins job to validate headers and block changes to certified docs without review.