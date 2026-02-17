# Repo Boundaries Policy (WTI)

WTI uses simple, repo-local boundary markers to reduce accidental inspection/modification of large vendor trees and to keep responsibilities clear.

## Marker file

A directory containing a `WTI-ROLES.md` file is a boundary root.

- The marker acts as an allowlist of roles that may inspect/modify within that directory subtree.
- If no `WTI-ROLES.md` is present, default to least-privilege.

## Boundaries in this repository

### `repos/theia/**`

- Purpose: vendored / forked upstream Eclipse Theia sources.
- Allowed roles: `theia-dev` only.

### `ai/agents/**`

- Purpose: WTI agent implementations and related assets.
- Allowed roles: `wti-ai-infra`, `theia-dev`.

## Extending the policy

To introduce a new boundary:

1. Add `WTI-ROLES.md` at the directory root you want to protect.
2. List the roles allowed to inspect/modify the subtree.
3. Keep the file short and explicit about what is allowed vs prohibited.

## Notes

- These markers are guidance for agents and reviewers; they are not a security mechanism.
- If the user explicitly requests work inside a restricted boundary, proceed only with that user's instruction.
