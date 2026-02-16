# WTI Agentic Dev Platform — Master Plan (WIP → PROD)

> Targets: GKE Autopilot + Envoy Gateway now, Istio later.  
> UI: Theia. Orchestration: Quarkus `agent`. Tools: MCP (`rg`/filesystem) read-only first.

---

## 0. Glossary
- **demo**: Theia web frontend (`demo.wti.net`)
- **agent**: Quarkus control plane (`agent.wti.net`)
- **mcp**: MCP tool endpoints (`mcp.wti.net/fs`, `/git`, ...)
- **workspace**: shared repo volume mounted at `/opt/workspace`

---

## 1. Goals
1. Theia provides IDE shell + custom UI panels (threaded convos, approvals, streaming).
2. `agent` owns prompt parsing (javacc), planning, multi-agent workflow, cancellation.
3. MCP servers provide repo access (ripgrep + file_get), sandboxed to `/opt/workspace`.
4. Default safety: **Step Mode** (plan → approve → execute), tool approvals ON.
5. WIP cluster first (`wti-wip`), then rebuild as PROD (`wti-ai`).

---

## 2. Traffic & Control Flow
### 2.1 Default request path
Theia UI → `agent` → OpenAI API → (tool calls) → `mcp` → back to `agent` → Theia UI

### 2.2 Why keep external `agent` even if Theia supports OpenAI
- `agent` keeps prompt parsing + dispatch rules out of model prompts.
- `agent` implements plan gating + fan-out/fan-in merge logic.
- Theia “direct LLM provider” remains optional for quick ad-hoc use.

---

## 3. Domains (no wildcard certs)
**WIP (now):**
- `demo.wti.net` (Theia)
- `agent.wti.net` (Quarkus)
- `mcp.wti.net` (Envoy Gateway; path-based routing)

**Later:**
- `api.wti.net` (shared APIs)
- `src.wti.net` (read-only workspace browser)
- `repo.wti.net` (artifact mirror UI)

---

## 4. Security Model
### 4.1 Edge TLS & allowlists
- Separate cert per hostname (no wildcards).
- Static external IP(s) for load balancers.
- **Allowlist**:
  - `mcp.wti.net`: OpenAI egress CIDRs + optionally home IP
  - `agent.wti.net`: home IP only (and maybe VPN/mobile)
  - `demo.wti.net`: home IP only (initially)

### 4.2 OpenAI allowlist source of truth
Plan: CronJob sync from OpenAI’s published CIDR list:
- `chatgpt-connectors.json` (used for ChatGPT calling external endpoints)

CronJob will:
1) fetch CIDR list
2) compute allowlist
3) update Envoy Gateway policy / config

### 4.3 Internal mTLS later (mesh)
- Add Istio after WIP works for service-to-service mTLS inside cluster.
- Keep Gateway API/Envoy Gateway at edge so work isn’t discarded.

### 4.4 Crawlers
Not needed. Don’t expose sensitive endpoints to crawlers.

---

## 5. Deep Research (later)
- Deep research workflows may require approval-free tools.
- Introduce a separate “read-only/no-approval” tool profile later.

---

## 6. Region choice
Use `northamerica-northeast2` for WIP (per your measurements/preferences).
To compare without deploying: use `gcping.com` and Google’s Region Picker.

---

## 7. Workspace Storage & Repo Sync
### 7.1 Mount strategy
- Mount shared volume at `/opt/workspace` (avoid mounting over `/opt`).

### 7.2 “1 writer, many readers”
Preferred: **RWX** volume so one sync pod can update while others read.
- Use Filestore CSI (NFS) for RWX.
- repo-sync pod: RW
- Theia: RW
- MCP: RO

### 7.3 Repo update model
Long-lived repo-sync pod does periodic fetch/reset (or your preferred strategy),
avoiding repeated init-container reclones.

---

## 8. Networking (VPC-native)
We avoid `10.128.0.0/9` because of your VPN.

Suggested CIDRs (small but with headroom):
- **Subnet (nodes primary):** `10.44.0.0/24`
- **Pods secondary:** `10.44.8.0/21`  (2048 pod IPs)
- **Services secondary:** `10.44.4.0/23` (512 service IPs)

Names:
- network: `wti-ai-net`
- subnet: `wti-ai-subnet`
- secondary ranges: `pods`, `services`

---

## 9. Cluster (GKE Autopilot)
### 9.1 Required vars
- `GOOGLE_PROJECT_ID`
- `GKE_REGION`
- `GKE_CLUSTER_NAME`
- `ADMIN_IP_CIDR`  (required; used for master authorized networks)

### 9.2 Control plane lockdown
Enable master authorized networks to restrict control plane access to `ADMIN_IP_CIDR`.

---

## 10. Static IPs
Reserve regional static external IP(s), named from cluster:
- `${GKE_CLUSTER_NAME}-gw-ip` (Envoy Gateway LB)

Later add:
- `${GKE_CLUSTER_NAME}-demo-ip`
- `${GKE_CLUSTER_NAME}-agent-ip`

---

## 11. Addons
### 11.1 cert-manager
Install via Helm. Use DNS-01 for cert issuance once DNS is configured.

### 11.2 Envoy Gateway
Install via Helm. Use Gateway API resources (Gateway + HTTPRoute) for:
- `demo.wti.net` → Theia service
- `agent.wti.net` → agent service
- `mcp.wti.net/fs` → mcp-fs service

Bind static IP by setting `Gateway.spec.addresses` (type `IPAddress`) to the reserved IP.

---

## 12. No-root container policy
- Image runs as `wti:1000`.
- Optional additional account `wti-admin:1337` for debug shells (not default).
- Kubernetes: set `runAsNonRoot`, drop capabilities, read-only FS where feasible.

---

## 13. Build/Dev notes (Theia)
Theia dev requires Node 22 and native deps per Theia docs:
- see `doc/Developing.md#quick-start` in the upstream repo.

We’ll build separate images for Theia and Quarkus, but keep a shared “base utils”
layer where practical (curl, git, bash, ca-certs).

---

## 14. Milestones
### Phase 0 (WIP infrastructure & skeleton apps)
1) Create WIP cluster `wti-wip` in `northamerica-northeast2`.
2) Install cert-manager + Envoy Gateway.
3) Stand up shared workspace volume.
4) Deploy skeleton:
   - Theia (demo)
   - Quarkus agent (stub endpoints)
   - MCP fs (rg + file_get)

Exit: Theia can call agent; agent can call MCP; end-to-end request works.

### Phase 1 (tightening + step mode)
1) Add allowlist CronJob for OpenAI CIDRs.
2) Add Step Mode UI (plan/approve).
3) Add repo-sync pod.

### Phase 2 (multi-agent workflow)
1) Dispatcher creates plan with dependencies.
2) Workers execute bounded tasks.
3) Dispatcher merges results.

### Phase 3 (mesh)
1) Add Istio internal mTLS.
2) Adopt ACP if/when Theia ecosystem makes it clearly beneficial.

---

## 15. Graduation
When WIP is stable, re-run scripts with:
- `GKE_CLUSTER_NAME=wti-ai`
and migrate DNS/certs, then scale down WIP.
