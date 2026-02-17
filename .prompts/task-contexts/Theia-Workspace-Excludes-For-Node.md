---
id: 1b8ab4ea-335d-4c13-93af-1a8d54479e83
sessionId: aafac68d-5b2e-4696-9da7-c8b38ef75f8c
date: '2026-02-16T21:45:08.091Z'
label: Theia Workspace Excludes For Node_modules And repos/theia
---
## Summary of Current Chat Session

### Main Objective
Configure the Theia IDE workspace to ignore large/noisy directories (especially `node_modules`). Do not add any references to `repos/theia` in tracked repo config; if such a directory exists it is lookup-only for agents and must not be referenced in code/config.

### Key Requirements
1. **Theia workspace settings** (in `wti-ai.theia-workspace`) must:
   - Exclude `node_modules` (and common build/cache directories) from:
     - Search indexing (`search.exclude`)
     - File watching (`files.watcherExclude`) for performance
     - Optionally Explorer visibility (`files.exclude`)

2. **Operational policy**
   - Theia is run from the command line in `/opt/theia`.
   - If `repos/theia` exists in this repo, it is lookup-only and must not be referenced in code, scripts, or committed workspace configuration.

### Relevant Artifacts / Paths
- Theia workspace file: `wti-ai.theia-workspace`

---

## Proposed Implementation Approach (Task Steps)

### Step 1 — Update Theia workspace settings
Edit `wti-ai.theia-workspace` and populate/ensure these keys:

- `search.exclude`:
  - `**/node_modules`: `true`
  - `**/dist`: `true`
  - `**/build`: `true`
  - `**/.next`: `true`
  - `**/.turbo`: `true`
  - `**/.cache`: `true`

- `files.watcherExclude`:
  - `**/node_modules/**`: `true`
  - `**/dist/**`: `true`
  - `**/build/**`: `true`
  - `**/.next/**`: `true`
  - `**/.turbo/**`: `true`
  - `**/.cache/**`: `true`

- `files.exclude` (optional):
  - `**/node_modules`: `true`

Concrete example for `wti-ai.theia-workspace`:

```jsonc
{
  "folders": [{ "path": "" }],
  "settings": {
    "search.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "**/build": true,
      "**/.next": true,
      "**/.turbo": true,
      "**/.cache": true
    },
    "files.watcherExclude": {
      "**/node_modules/**": true,
      "**/dist/**": true,
      "**/build/**": true,
      "**/.next/**": true,
      "**/.turbo/**": true,
      "**/.cache/**": true
    },
    "files.exclude": {
      "**/node_modules": true
    }
  }
}
```

---

## Ambiguities / Follow-ups
- Making `repos/theia` “invisible” in the IDE cannot be enforced via committed workspace config without referencing it. If needed, use user-level (untracked) settings.