---
status: CERTIFIED
certified-scope: Terminology for WTI-AI repo documents and near-term infrastructure
owner: wti
reviewed-by: TBD
review-date: 2026-02-16
verification:
  - "(manual) Terms align with MASTER_PLAN.md and docs"
changelog:
  - 2026-02-16: Initial certified glossary
---

# WTI-AI Glossary

- **Theia**: The IDE shell used for development and UI integration.
- **conductor**: Quarkus control plane service intended to own planning, step mode, and orchestration.
- **MCP**: Model Context Protocol services providing tools (e.g., file read, ripgrep) with least privilege.
- **Envoy Gateway**: Gateway API implementation providing edge routing into the cluster.
- **cert-manager**: Kubernetes controller for issuing and renewing TLS certificates.
- **DNS-01**: ACME challenge type using DNS TXT records to validate domain ownership.
- **WIP cluster**: The initial, disposable environment to prove the vertical slice before production hardening.
- **Certified**: Reviewed and promoted content under `docs/5_certified/`.
- **Unreviewed**: Imported or scratch content that must not be treated as truth.
