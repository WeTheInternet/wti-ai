id: 44cc4bd2-a44d-4747-921d-9e94ecc469ce
sessionId: 3fd370e3-3fdc-4846-be16-a8900f5e3668
date: '2026-02-16T18:35:19.035Z'
label: 'Most Important Triage Doc: WTI_AI_DOCS_SPEC'
---
## Summary of current chat session

### Main coding objective
Refactor and “beef up” the repository documentation spec currently at `docs/0_triage/WTI_AI_DOCS_SPEC.md` by:
1) Renaming it to a friendlier name (`docs/0_triage/docs-system-spec.md`) with a matching title, and
2) Expanding it to include the **complete feature lifecycle + maturity model** (currently described in triage workflow docs),
3) Clarifying “best-effort” vs “non-negotiable” rules, and
4) Updating `AGENTS.md` so this new spec doc is one of the first documents agents are directed to read.

### Key requirements (final decisions)
- New preferred filename: `docs/features/doc-system-spec.md`
- The doc should be routed very early from `AGENTS.md` (“one of the first things we direct AGENTS.md to read”).
- Filename and title should be similar (avoid the “brutal” `WTI_AI_DOCS_SPEC` naming).
- Incorporate the lifecycle + maturity system from `docs/0_triage/workflow/feature-lifecycle-and-maturity.md` into the spec.
- Add explicit wording about **best-effort-ness** (metadata may be missing/incorrect) while preserving:
  - **Non-negotiable trust rule**: only `status: CERTIFIED` is authoritative.
  - **No enforcement yet**: missing metadata should not block work (should instead become a goal to fix docs; consistent with `docs/0_triage/agents/compliance-agent.md`).

---

## Artifacts / files involved
- Rename source:
  - `docs/0_triage/WTI_AI_DOCS_SPEC.md` → `docs/features/doc-system-spec.md`
- Inputs to merge/align with:
  - `docs/0_triage/workflow/feature-lifecycle-and-maturity.md`
  - `docs/0_triage/workflow/role-based-reading-and-trust.md`
  - `docs/0_triage/agents/compliance-agent.md` (for “create goals, don’t enforce” stance)
- Routing update required:
  - `AGENTS.md` (repo root)

---

## Proposed implementation approach (task steps)

### Step 1 — Rename
1. Rename file:
   - From: `docs/0_triage/WTI_AI_DOCS_SPEC.md`
   - To: `docs/features/doc-system-spec.md`
2. In the renamed doc, update the H1 title to match (e.g., `# Docs System Spec` or `# Documentation System Spec`).

### Step 2 — Expand the spec to include lifecycle + maturity
In `docs/0_triage/docs-system-spec.md`, extend the frontmatter schema section to add **optional** keys:

- `lifecycle` allowed values:
  - `TRIAGE`
  - `CONFIRMED`
  - `SPECCED`
  - `APPROVED`
  - `IMPLEMENTING`
  - `COMPLETE`
  - `DEPRECATED`

- `maturity` recommended values:
  - `NONE` (default)
  - `SPIKE`
  - `RUNNABLE`
  - `DEPLOYABLE`
  - `TESTED`
  - `DOCUMENTED`
  - `PRODUCTION`

- `approvedSha` (git short sha)
- `approvedBy` (human or bot id)
  - Specify these are expected when `lifecycle: APPROVED` (and remain relevant for later lifecycle states).

Also add a section describing the “three orthogonal axes”:
- `status` (trust/authority) — only `CERTIFIED` is authoritative
- `lifecycle` (work phase)
- `maturity` (implementation reality)

Definitions can be adapted directly from `docs/0_triage/workflow/feature-lifecycle-and-maturity.md` (keep them minimal).

### Step 3 — Add explicit “best-effort” policy + non-enforcement
Add a clear section (near the top) that states:

- Best-effort metadata: `lifecycle`, `maturity`, `teams`, `roles`, `verification`, and `approved*` are recommended but may be missing or imperfect (especially in triage and drafts).
- Non-negotiable rule: only `status: CERTIFIED` is authoritative.
- No enforcement yet: missing/inconsistent metadata must not block work; it should trigger creation of a **goal** to correct docs (aligned with `docs/0_triage/agents/compliance-agent.md`).

### Step 4 — Keep/retain existing trust + router rules, but align with role reading guidance
- Keep existing sections from the current spec:
  - required frontmatter keys (`status`, `teams`, `roles`, `authors`, `lastUpdated`)
  - status values and meaning
  - authority rules (directory names don’t determine authority; generated index not authoritative unless certified)
  - directory router rules (`PURPOSE.md` expectations)
  - triage rules (`docs/0_triage` is intake only)
  - teams/roles filtering guidance
- Add a small routing section that points to, or aligns with:
  - `docs/0_triage/workflow/role-based-reading-and-trust.md`
  (avoid large duplication, but ensure the spec mentions the “routers first” concept.)

### Step 5 — Update `AGENTS.md` to route to the new doc early
Edit `AGENTS.md` to include `docs/0_triage/docs-system-spec.md` as one of the first reads.

Desired ordering (as agreed in chat; adjust to fit existing AGENTS.md structure):
1. `AGENTS.md`
2. `docs/0_triage/docs-system-spec.md`
3. `PURPOSE.md` (repo root)
4. `docs/PURPOSE.md`
5. directory routers (`docs/*/PURPOSE.md`)

Also ensure any links in `AGENTS.md` that previously referenced `docs/0_triage/WTI_AI_DOCS_SPEC.md` (if any) are updated.

---

## Ambiguities / items to clarify later
- Exact title wording: “Docs System Spec” vs “Documentation System Spec” (both acceptable; pick one consistent with repo style).
- Whether to add a stub/redirect file at the old path (`docs/0_triage/WTI_AI_DOCS_SPEC.md`) pointing to the new filename. (Not requested explicitly; optional. If the repo has many references, a small deprecated stub could prevent broken links.)

---

## Relevant examples / patterns to follow

### Example: lifecycle + maturity definitions source
Use content from:
- `docs/0_triage/workflow/feature-lifecycle-and-maturity.md`
This already defines:
- lifecycle allowed values + definitions
- maturity recommended values + notes
- expectations for `approvedSha` / `approvedBy`

### Example: non-enforcement / create-goals behavior
Align wording with:
- `docs/0_triage/agents/compliance-agent.md`
Key behavior: create goal docs for missing artifacts; do not enforce or block.

### Example: routing principle
Align with:
- `docs/0_triage/workflow/role-based-reading-and-trust.md`
Key behavior: “Read routers first, then drill down”; triage not default search target.

---

## Deliverables checklist
- [ ] `docs/features/doc-system-spec.md` exists (renamed from `WTI_AI_DOCS_SPEC.md`)
- [ ] Title updated; optional “Formerly …” note added
- [ ] Spec includes lifecycle + maturity + approval metadata keys and definitions
- [ ] Spec includes explicit best-effort + non-enforcement stance, while preserving the certified-only authority rule
- [ ] `AGENTS.md` updated to direct agents to read `docs/features/doc-system-spec.md` very early
- [ ] No broken references (update links if present)