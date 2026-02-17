id: 7e5b8d82-32b6-48a7-8e30-29e914f1ea3f
sessionId: 065ff1ef-5456-4e4d-bcd0-5a67567dcfb6
date: '2026-02-16T16:45:32.790Z'
label: Theia-Dev Skill Update And Markdown Sprawl Scan
---
## Summary of coding task (for @Coder)

### Main objective
Restructure and formalize repository documentation navigation and authority rules using **machine-readable** `PURPOSE.md` + `AGENTS.md`, while minimizing root clutter and reducing doc sprawl. Establish a strict docs taxonomy hub at `docs/PURPOSE.md`, create dedicated hubs for **agent-only instructions** and **product feature specs**, and migrate docs-like content out of `ai/` (skills/prompts) into appropriate locations. Fix outdated rule that “`docs/5_certified` is authoritative”; instead, authority is determined by **frontmatter `status: CERTIFIED`**.

### Key requirements / decisions (final)
1) **Single root entry point**: `AGENTS.md` is the primary/required entry point for agents. Avoid a web of entry points.
2) **Machine vs human docs**:
   - `AGENTS.md` + `PURPOSE.md` are **machine-oriented**.
   - `README.md` (directory readmes) are **human-oriented**; do not focus on rewriting these in this batch except where rules are wrong.
3) **PURPOSE.md contract**:
   - Every “special directory with instructions/docs/spec” should have `PURPOSE.md` that routes to subdirectories/docs and helps scope reading.
   - PURPOSE docs should support team/role scoping via frontmatter.
4) **Authority semantics**:
   - Authoritative truth = `status: CERTIFIED` (not folder-based).
   - `docs/5_certified/` must NOT be treated as global authority; it’s legacy/outdated.
5) **New docs hubs**:
   - Create `docs/agent/` for agent-only instruction hub.
   - Create `docs/specs/` for product feature specs (PM-style). (This is not “agent implementation instructions”; specs may reference agent/process docs.)
6) **Generated/numbered status directories**:
   - Treat numbered “status” structures as **generated indexes** (non-authoritative). Do not make authority depend on them.
7) **Migration constraints**:
   - “Migration” in this batch is **docs-only**. Do not move `.sh` or code artifacts.
   - However, we DO need to fix `ai/` sprawl by moving docs-like materials (skills/prompts) out of `ai/`.
8) **Frontmatter fixed schema (required keys)**:
   - `status`
   - `teams` (list; empty means global)
   - `roles` (list; empty means global)
   - `authors` (use `JamesXNelson`; include bots/agents if desired)
   - `lastUpdated` (timestamp with seconds resolution, ISO-8601 e.g. `2026-02-16T15:08:31Z`)
   - `verification` should be supported and is desired if “agents will just get it”; treat as optional-but-encouraged field (do not over-engineer).
9) **docs/INDEX.md**:
   - Consider it unnecessary now; replace with `docs/PURPOSE.md`. Retire/move `docs/INDEX.md` to trash (do not keep as a required entry point).
10) **Trash**:
   - Add `docs/trash/` for staging deletions; ignore `docs/trash/**` via `.aiignore`.
   - `docs/0_triage/` should warn agents away unless asked to do triage.
11) **HANDOFF_THEIA_AGENT**:
   - Only file currently is `docs/0_triage/HANDOFF_THEIA_AGENT.md` (the old `docs/HANDOFF_THEIA_AGENT.md` is already gone).
   - It is likely trash; move to `docs/trash/` unless value is extracted. (If extracting: it contains Theia setup questions + extension panel requirements + some infra goals/constraints. No explicit extraction targets were requested—default to trash.)
12) **ai/** folder handling:
   - Add `ai/PURPOSE.md` (minimal; says it’s implementation/tooling and not authoritative repo structure).
   - Move `ai/skills/**` → root `skills/**`.
   - Move `ai/prompts/**` (created by assistant previously) → `docs/0_triage/` (e.g. `docs/0_triage/imported_prompts/**`) and later decompose into goals/plans/etc.
   - Leave `ai/infra/` in place for now (tooling spike; code-ish).

### Existing relevant files/paths (current repo state)
- `AGENTS.md` (currently hardcodes: “Anything under docs/5_certified is authoritative.” Must change.)
- `docs/README.md` (currently says: “status: CERTIFIED only in docs/5_certified/”. Must change.)
- `docs/INDEX.md` (to retire)
- `docs/5_certified/WTI_AI_GLOSSARY.md` (CERTIFIED; defines “Certified = under docs/5_certified” → must update definition)
- `docs/0_triage/HANDOFF_THEIA_AGENT.md` (move to trash)
- Existing PURPOSE dirs: `docs/0_triage/PURPOSE.md`, `docs/adr/PURPOSE.md`, `docs/goals/PURPOSE.md`, `docs/plans/PURPOSE.md`, `docs/status/PURPOSE.md`, `docs/teams/PURPOSE.md`, `docs/features/PURPOSE.md`, `docs/5_certified/PURPOSE.md` (legacy)
- Skills currently in `ai/skills/*/SKILL.md`
- Prompts currently in `ai/prompts/task-contexts/wti-ai-wip.md`
- `.aiignore` exists at repo root (update to ignore `docs/trash/**`)

### Implementation approach (task steps)

#### Step 1: Add machine-readable directory routers
1. Create root `PURPOSE.md`:
   - Machine-oriented repo map: `docs/`, `skills/`, `ai/`, `.prompts/`
   - Include guidance: “scope reads; don’t load unrelated docs; use teams/roles where possible”
   - Add required YAML frontmatter fields.

2. Create `docs/PURPOSE.md` as the docs taxonomy hub:
   - Explain purpose of `docs/` and how to navigate via subdirectory PURPOSE files.
   - Link to key subdirs: `docs/0_triage/`, `docs/agent/`, `docs/specs/`, `docs/adr/`, `docs/goals/`, `docs/plans/`, `docs/teams/`, `docs/status/`, `docs/theia/`, existing `docs/features/` (keep for now; no final decision to delete).
   - Mention that `docs/status/` is non-authoritative generated/index.

3. Create `docs/agent/PURPOSE.md` and `docs/specs/PURPOSE.md`:
   - `docs/agent/`: agent-only instruction hub.
   - `docs/specs/`: PM-style product feature specs.

4. Create `docs/trash/PURPOSE.md` and add ignore rule:
   - Update `.aiignore` to include `docs/trash/**`.

#### Step 2: Update AGENTS.md authority + team/role awareness
Edit `AGENTS.md`:
- Add pointer to root `PURPOSE.md` as the repo map.
- Replace trust rules:
  - Remove “Anything under docs/5_certified is authoritative.”
  - New rule: **Only `status: CERTIFIED` is authoritative**.
  - Triage is non-authoritative by default.
  - Generated indexes are non-authoritative.
- Add team/role-aware instructions at top:
  - Agents should preferentially load PURPOSE docs whose `teams`/`roles` match; generic ad-hoc tasks can use best judgment and should not read 50 files.

#### Step 3: Create docs spec draft in triage
Create `docs/0_triage/WTI_AI_DOCS_SPEC.md` (machine-oriented, but stored in triage for now) defining:
- Required frontmatter schema: `status`, `teams`, `roles`, `authors`, `lastUpdated`; plus `verification` supported/encouraged.
- `lastUpdated` format is ISO-8601 with seconds.
- Status meanings: at least `UNREVIEWED`, `DRAFT`, `CERTIFIED`, `DEPRECATED`.
- Authority rules (CERTIFIED-driven, not folder-driven).
- Directory rules: PURPOSE required for “special directories”; triage warning.
- How teams/roles filtering should be interpreted by agents.

#### Step 4: Retire docs/INDEX.md
- Move `docs/INDEX.md` → `docs/trash/docs_INDEX.md` (or similar name) rather than deleting, to reduce risk.

#### Step 5: Fix legacy “5_certified is authority” rules
Update these docs to match new semantics:
1. `docs/README.md`:
   - Remove “Only docs/5_certified is authoritative.”
   - Remove “status: CERTIFIED only in docs/5_certified/.”
   - Update taxonomy list to include `docs/agent/` and `docs/specs/`.
2. `docs/5_certified/WTI_AI_GLOSSARY.md`:
   - Update glossary entry for “Certified” to mean `status: CERTIFIED` (not folder).
   - Consider adding note that `docs/5_certified/` is legacy.
3. `docs/5_certified/PURPOSE.md`:
   - Mark as legacy/deprecated (set `status: DEPRECATED`) and explain that certified product specs are moving to `docs/specs/`.
   - Keep file (don’t delete), but do not treat as authority hub.

#### Step 6: Move docs-like sprawl out of ai/
Docs-only moves:
1. Move `ai/skills/**` → `skills/**` preserving skill folder names:
   - `ai/skills/theia-dev/SKILL.md` → `skills/theia-dev/SKILL.md`
   - `ai/skills/wti-ai-infra/SKILL.md` → `skills/wti-ai-infra/SKILL.md`
   - `ai/skills/xapi-wti/SKILL.md` → `skills/xapi-wti/SKILL.md`
2. Create `skills/PURPOSE.md` (machine router) with teams/roles concept if useful.
3. Move `ai/prompts/**` → `docs/0_triage/imported_prompts/**` (preserve structure), e.g.:
   - `ai/prompts/task-contexts/wti-ai-wip.md` → `docs/0_triage/imported_prompts/task-contexts/wti-ai-wip.md`
4. Create `ai/PURPOSE.md`:
   - State `ai/` is for implementation/tooling spikes; not authoritative repo structure.

#### Step 7: Trash the Theia handoff doc
Move:
- `docs/0_triage/HANDOFF_THEIA_AGENT.md` → `docs/trash/HANDOFF_THEIA_AGENT.md`

(Optionally add a one-line stub in triage saying it was moved to trash, but not required.)

### Ambiguities / clarify later (do not block this batch)
- Whether to keep `docs/features/` long-term vs merging into `docs/specs/`. For now: keep `docs/features/` and ensure `docs/PURPOSE.md` explains both; no destructive moves.
- Whether to add slash-command support for “ignore team/role rules” is future work; only document intent lightly if needed in `AGENTS.md`.

### Examples / patterns to follow
- Make `PURPOSE.md` files concise but include:
  - “What belongs here / what does not”
  - “Next reads” (links to subdirs/docs)
  - Authority statement (CERTIFIED semantics)
  - teams/roles scoping hints
- Use ISO-8601 timestamps with seconds in `lastUpdated`.

### Quick checklist for completion
- [ ] Root `PURPOSE.md` exists and referenced by `AGENTS.md`
- [ ] `docs/PURPOSE.md` exists and acts as docs hub; `docs/INDEX.md` moved to trash
- [ ] `docs/agent/` and `docs/specs/` exist with PURPOSE.md
- [ ] `.aiignore` ignores `docs/trash/**`
- [ ] `docs/README.md` no longer claims `docs/5_certified` is the only authority
- [ ] `docs/5_certified/WTI_AI_GLOSSARY.md` definition of “Certified” updated
- [ ] `ai/skills` moved to root `skills/` and `skills/PURPOSE.md` added
- [ ] `ai/prompts` moved to `docs/0_triage/imported_prompts/`
- [ ] `docs/0_triage/HANDOFF_THEIA_AGENT.md` moved to `docs/trash/`