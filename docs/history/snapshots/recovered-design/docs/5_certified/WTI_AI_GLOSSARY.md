---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-11-23T00:14:54Z
verification:
  - "Draft source reconciliation; no runtime behavior certified"
---

# Preserved source attachment

This DRAFT wrapper quotes an older source version. The quoted certification belongs to that original revision; it does not certify this wrapper or a current definition.

- [Exact source bytes](WTI_AI_GLOSSARY.md.source)
- Exact original locator and source-to-snapshot mapping are retained in the private review package.

````text
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
- **dev cluster**: The initial, disposable environment to prove the vertical slice before production hardening.
- **Certified**: Reviewed and promoted content with frontmatter `status: CERTIFIED` (folder location does not determine authority).
- **Unreviewed**: Imported or scratch content that must not be treated as truth.

````
