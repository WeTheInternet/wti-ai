id: 22cf3916-1136-446b-bd3e-562a70ee5c01
sessionId: 554989b0-0666-481f-a3d1-730996b67480
date: '2026-02-16T19:02:51.887Z'
label: >-
  Infra agent task spec: Hello-world behind Envoy Gateway w/ cert-manager DNS-01
  + MASTER_PLAN triage refresh
---
# Infra agent task spec: Hello-world behind Envoy Gateway w/ cert-manager DNS-01 + MASTER_PLAN triage refresh

## Goal
1) Produce an **actionable infra execution spec** (no commands run in this repo) that an “infra agent” can follow to deploy a minimal hello-world service behind **Envoy Gateway** with **cert-manager DNS-01 TLS**.
2) Perform a **structured review of `MASTER_PLAN.md`** to identify stale assumptions, missing work items, and reduce “too many entry-points” by defining a small set of canonical docs.

## Non-goals
- Do not actually provision cloud resources, run `gcloud`, `helm`, `kubectl`, or modify DNS in this task.
- Do not implement Theia/Quarkus application code.

## Current repo realities / starting points
- Existing infra scaffolding exists under `ai/infra/` with bash tasks for:
  - APIs (`ai/infra/tasks/010-apis.sh`)
  - Network (`ai/infra/tasks/020-network.sh`)
  - GKE Autopilot cluster (`ai/infra/tasks/030-cluster-autopilot.sh`)
  - Static IP reserve (`ai/infra/tasks/040-static-ips.sh`) – reserves `${GKE_CLUSTER_NAME}-gw-ip`
  - cert-manager install (`ai/infra/tasks/050-cert-manager.sh`)
  - Envoy Gateway install (`ai/infra/tasks/060-envoy-gateway.sh`) (note: currently does **not** create `Gateway` / `HTTPRoute`)

## Design (what “done” should look like)
### A. Vertical slice (WIP) deliverable
A minimal HTTPS endpoint served through Envoy Gateway:
- **Hostname:** `conductor.wti.net`
- DNS `A` record for `conductor.wti.net` points to the reserved Gateway static IP (`${GKE_CLUSTER_NAME}-gw-ip`).
- cert-manager issues a certificate via **DNS-01** using **Google Cloud DNS**, and the `Certificate` becomes `Ready=True`.
- Envoy Gateway `Gateway` listens on 443 for `conductor.wti.net`, terminates TLS using the cert-manager secret.
- A `HTTPRoute` forwards traffic to a `Service` (hello-world placeholder for now) on port 80.

### B. Docs / plan hygiene deliverable
- `MASTER_PLAN.md` updated OR a new canonical doc created and referenced by it, to reduce entry-points.
- A short “Triage backlog” list extracted from the master plan review.

## Key decisions (locked in unless changed)
1) **Hostname:** `conductor.wti.net`
2) **DNS-01 provider:** Google Cloud DNS (CloudDNS)
3) **Issuer type:** Prefer `ClusterIssuer` for Let’s Encrypt DNS-01 (cluster-wide) so we don’t duplicate issuer config per-namespace.
   - Difference refresher:
     - `Issuer` is namespace-scoped and can only be referenced by `Certificate` resources in the same namespace.
     - `ClusterIssuer` is cluster-scoped and can be referenced from any namespace.
4) **Namespace + Gateway naming conventions (for now):**
   - Use a single namespace `wti-ai` for all WIP resources (Gateway, HTTPRoutes, placeholder service, Certificates).
   - Gateway resource name should be `conductor-gateway` (shortname is safe within namespace).
   - `GatewayClass` name: do **not** invent one; use the Envoy Gateway default/recommended class.
     - Judgment call: assume `gatewayClassName: envoy-gateway` unless `kubectl get gatewayclass` shows a different name. The infra agent should query and set the manifest accordingly.

## Implementation Steps (infra agent)

### Step 1: Add missing “manifests layer” for Gateway + routes + sample app
Create a directory for k8s manifests (pick one and be consistent):
- Option A (recommended): `ai/infra/manifests/` (keeps infra assets together)
- Option B: `docs/plans/infra/manifests/` (if you want everything “plan-like” in docs)

Add these manifests (filenames indicative; adjust as needed):
1) `ai/infra/manifests/wti-ai/00-namespace.yaml`
   - Namespace `wti-ai`.
   - For now, keep WIP infra/app objects together here to make naming simple and avoid cross-namespace references.

2) `ai/infra/manifests/wti-ai/10-placeholder-deployment.yaml`
   - A tiny placeholder backend for `conductor.wti.net` until the real conductor service exists.
   - Prefer a well-known image:
     - `hashicorp/http-echo` (simple) OR
     - `nginxdemos/hello`.
   - Deployment + labels in namespace `wti-ai`.

3) `ai/infra/manifests/wti-ai/20-placeholder-service.yaml`
   - `Service` on port 80 targeting the placeholder deployment.

4) `ai/infra/manifests/wti-ai/30-certificate-conductor.yaml`
   - `Certificate` for `conductor.wti.net` in namespace `wti-ai`.
   - `secretName: conductor-wti-net-tls` (example).
   - `issuerRef: letsencrypt-dns01` (ClusterIssuer).

5) `ai/infra/manifests/wti-ai/40-gateway-conductor.yaml`
   - `Gateway` named `conductor-gateway` in namespace `wti-ai`.
   - `gatewayClassName: envoy-gateway` (unless cluster reports a different class).
   - Bind the reserved static IP (see `MASTER_PLAN.md` §11):
     - `spec.addresses[0].type: IPAddress`
     - `spec.addresses[0].value: <reserved-ip>`
   - Listener:
     - `hostname: conductor.wti.net`
     - `port: 443`
     - `protocol: HTTPS`
     - `tls.mode: Terminate`
     - `tls.certificateRefs` → `Secret` `conductor-wti-net-tls`.

6) `ai/infra/manifests/wti-ai/50-httproute-conductor.yaml`
   - `HTTPRoute` in namespace `wti-ai` that references `conductor-gateway` via `parentRefs`.
   - Route all `/` to the placeholder `Service`.

Notes:
- Confirm the correct apiVersions for your installed Envoy Gateway and Gateway API CRDs.
- Ensure Envoy Gateway installation includes Gateway API CRDs as required.

### Step 2: Add Google Cloud DNS-01 plumbing (IAM + k8s secret) + cert-manager ClusterIssuer
This step is where the infra agent does the **full CloudDNS integration** (service account, IAM, k8s Secret) so DNS-01 can work unattended.

#### Step 2.1: Decide credential strategy (recommended default)
Use a dedicated **GCP Service Account key JSON** stored as a Kubernetes Secret that cert-manager references.
- This is the most straightforward bootstrap.
- Later, consider switching to Workload Identity (more secure; more setup).

#### Step 2.2: Create (or ensure) the CloudDNS service account and IAM
Add a new infra task script (bootstrap-friendly):
- New task: `ai/infra/tasks/055-clouddns-dns01-issuer.sh`
  - Ensures a service account exists, e.g. `cert-manager-dns01`.
  - Grants least-privilege IAM needed for DNS-01 in the managed zone.

IAM notes (judgment call; infra agent should verify exact minimum role):
- Start with project-level role:
  - `roles/dns.admin` for the service account (easy, broad), or
  - Prefer narrower: `roles/dns.editor` if sufficient.
- If restricting to a single managed zone is desired, document the follow-up work (zone-level IAM via IAM Conditions / policy bindings).

#### Step 2.3: Create the Kubernetes Secret with the SA key JSON (approval-gated)
In namespace `cert-manager` (common pattern), create a secret like:
- `cert-manager/clouddns-dns01-svc-acct`
  - key: `key.json`

The secret **must not** be committed.
- Provide a template manifest under `ai/infra/manifests/_templates/` if helpful, but the repo should not contain real keys.

#### Step 2.4: Add the ClusterIssuer manifest (Let’s Encrypt + CloudDNS)
Create:
- `ai/infra/manifests/cert-manager/10-clusterissuer-letsencrypt-dns01.yaml`
  - `ClusterIssuer` name: `letsencrypt-dns01`
  - DNS solver: `dns01.cloudDNS.project: ${GOOGLE_PROJECT_ID}`
  - Reference the k8s Secret created above.
  - Consider starting with Let’s Encrypt **staging** issuer during initial testing to avoid rate limits, then switch to prod.

#### Step 2.5: Add the conductor certificate manifest
Move certificate definition to the `wti-ai` namespace (so the TLS Secret is co-located with the Gateway):
- `ai/infra/manifests/wti-ai/30-certificate-conductor.yaml`
  - `dnsNames: ["conductor.wti.net"]`
  - `secretName: conductor-wti-net-tls`
  - `issuerRef: letsencrypt-dns01` (ClusterIssuer)

Approval gates:
- Creating the service account key JSON is security-sensitive.
- DNS record updates (A record for `conductor.wti.net`) are external-impacting.

Secret rotation note:
- Add a doc note: rotating the key requires updating the k8s Secret and recycling cert-manager pods if needed.


### Step 3: Wire manifests + DNS prerequisites into `ai/infra` task runner
Add infra task scripts that make this repeatable.

1) New task: `ai/infra/tasks/055-clouddns-dns01-issuer.sh`
   - Creates/ensures CloudDNS DNS-01 service account + IAM.
   - **Does not** print secrets.
   - Produces instructions/artifact location for creating the Kubernetes Secret (approval-gated).

2) Rename/replace the “hello” apply task to reflect conductor placeholder:
   - New task: `ai/infra/tasks/070-conductor-gateway-placeholder.sh`
     - `ensure_kube_credentials`
     - Apply manifests in order:
       - `wti-ai` namespace
       - placeholder deployment/service
       - ClusterIssuer (cert-manager namespace)
       - Certificate (wti-ai)
       - Gateway (wti-ai)
       - HTTPRoute (wti-ai)
     - Wait loops (best-effort) for:
       - `Certificate` Ready
       - `Gateway` Programmed
       - `HTTPRoute` Accepted

3) Update `ai/infra/bin/run-all.sh`
   - Insert `055-clouddns-dns01-issuer.sh` after `050-cert-manager.sh`.
   - Add `070-conductor-gateway-placeholder.sh` after `060-envoy-gateway.sh`.

Approval gates (must be explicit in task output/docs):
- Creating the DNS credential Secret in-cluster.
- Creating/updating the public DNS `A` record for `conductor.wti.net`.


### Step 4: Verification checklist (infra agent should run outside this task)
Document verification commands (do not run here):
- `kubectl get gateway -A`
- `kubectl get httproute -A`
- `kubectl describe certificate -n <ns> <cert>`
- `kubectl get challenge,order -A` (cert-manager)
- `curl -vk https://<hostname>/` should return the hello payload

Also verify DNS:
- `dig A <hostname>` returns the reserved static IP.

### Step 5: Document the runbook
Add a short runbook doc under `docs/plans/infra/hello-envoy-certmanager-dns01.md` including:
- required env vars (mirroring `ai/infra/README.md`)
- prerequisites (DNS zone, DNS provider creds)
- “apply manifests” steps
- verification checklist
- rollback notes (delete HTTPRoute/Gateway/Certificate in reverse order)

## MASTER_PLAN review + triage refresh (spec)

### Objective
1) Reduce the “many entry points” problem by defining **canonical routers**.
2) Create a **triage document** that becomes the bridge from “stale master plan” → “feature definitions/goals” → “execution plans”.

### Deliverables
1) A new triage doc: `docs/0_triage/goals/setup-infra.md` (DRAFT; `lifecycle: TRIAGE`)
2) Promote confirmed items into goal docs under `docs/goals/` (DRAFT or CERTIFIED depending on review), using frontmatter `lifecycle` to reflect maturity.
   - This follows the doc-system guidance: `docs/0_triage/` is intake; `docs/goals/` is the promoted home.
3) A new infra plans router: `docs/plans/infra/PURPOSE.md` (DRAFT)
4) Updates to `MASTER_PLAN.md` that:
   - explicitly defers detailed execution to the infra plans router
   - points at the triage doc as the backlog source-of-truth

### Proposed doc flow (canonical entry points)
- `MASTER_PLAN.md` = narrative + architecture + milestones (high level)
- `docs/0_triage/goals/setup-infra.md` = raw backlog + questions + priorities (non-authoritative but current)
- `docs/goals/*` = promoted, scoped goal docs (when confirmed)
- `docs/plans/infra/*` = concrete runbooks / execution plans

### How to create the triage doc
In `docs/0_triage/goals/setup-infra.md`, include sections:
1) **Context / current reality**
   - what exists today in `ai/infra/`
   - what is missing to reach Phase 0 exit
2) **Open questions** (each with an owner)
   - DNS zone details, delegation, managed zone name
   - whether to use SA key JSON now vs Workload Identity now
   - where to enforce allowlists (Cloud Armor vs Gateway policy, etc.)
3) **Backlog items (prioritized)**
   - Each item should have:
     - Title
     - Why it matters
     - Acceptance criteria
     - Dependencies
     - Suggested implementation home (scripts vs manifests vs docs)
4) **Promotion criteria**
   - define when an item becomes a `docs/goals/<...>.md`

### Initial triage backlog seed (from MASTER_PLAN + repo)
Infra / edge:
- Implement `Gateway` + `HTTPRoute` manifests and apply tasks (currently missing; `ai/infra/tasks/060-envoy-gateway.sh` explicitly defers)
- Implement CloudDNS DNS-01 bootstrap (IAM + secret + ClusterIssuer)
- Add `conductor.wti.net` placeholder backend behind gateway (swap later to real conductor Service)
- Decide/implement allowlist enforcement mechanism for `mcp.wti.net` and other endpoints

Storage / workspace:
- Decide Filestore CSI + RWX volumes and create manifests/scripts
- Implement repo-sync pod and RO mount strategy for MCP

Platform / workflow:
- Define Step Mode gating location (Theia UI vs conductor) and a thin vertical slice acceptance test

### MASTER_PLAN update instructions
- Add a “Repo status” section pointing to implemented scripts (`ai/infra/tasks/010..060`) and planned scripts (`055`, `070`).
- Add a “Single execution path” section:
  - `ai/infra` tasks 010→060→055→070 (with explicit approval gates for DNS + secrets)
- Add a “Backlog & triage” section:
  - "See `docs/0_triage/goals/setup-infra.md`".

### Goal doc template (for promoting triage items into `docs/goals/`)
When an item in `docs/0_triage/goals/setup-infra.md` is confirmed/sliced enough to work on, promote it into `docs/goals/<goal-slug>.md` using this template.

```yaml
---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
lifecycle: CONFIRMED  # TRIAGE | CONFIRMED | SPECCED | APPROVED | IMPLEMENTING | COMPLETE | DEPRECATED
maturity: NONE        # NONE | SPIKE | RUNNABLE | DEPLOYABLE | TESTED | DOCUMENTED | PRODUCTION
verification:
  - "(manual) Acceptance criteria can be verified with the listed commands/observations"
---
```

```md
# <Goal title>

## Goal
One paragraph describing the outcome.

## Why this matters
Bullet list of risks reduced / capabilities unlocked.

## Scope
### In-scope
- ...

### Out-of-scope
- ...

## Acceptance Criteria
- [ ] ...
- [ ] ...

## Dependencies
- ...

## Proposed approach
High-level approach; link to any specs/runbooks.

## Implementation plan link(s)
- `docs/plans/...` (if exists) or state "TBD"

## Verification
Concrete checks (commands are ok to list here; execution remains approval-gated elsewhere):
- `kubectl ...`
- `curl ...`

## Rollback
What to delete/undo and in what order.
```

Notes:
- Keep goal docs **short**; they are the slice definition.
- Put long procedures in `docs/plans/` runbooks.
- Only mark `status: CERTIFIED` after review; otherwise treat as non-authoritative.

## Reference Examples (in repo)
- `ai/infra/tasks/040-static-ips.sh` — reserved IP name convention (`${GKE_CLUSTER_NAME}-gw-ip`).
- `ai/infra/tasks/050-cert-manager.sh` — Helm install pattern.
- `ai/infra/tasks/060-envoy-gateway.sh` — Helm install pattern + note about IP binding.
- `docs/features/doc-system-spec.md` — status/certification rules.

## Verification (for this spec itself)
- Spec is detailed enough that an infra agent can implement without rediscovering repository structure.
- All referenced paths exist or are explicitly marked “new file to create”.
- Open questions are enumerated (hostname, DNS provider, issuer scope).