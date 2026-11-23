id: 6aee479c-3444-4086-8c35-7c7054b9f6c2
sessionId: 2c901a99-febf-40a1-869d-0b2e699ad037
date: '2026-03-29T05:25:45.609Z'
label: Theia Orchestrator Sidebar Panel Setup
---
## Coding Task Summary (for @Coder)

### Objective
Add a new **Conductor** UI + supporting packages to the Theia-based IDE, without touching the existing `ide/agents/infra` spike (@Prime). Update the `intent/` documentation to reflect the new plan: Conductor is a **threaded, selection-addressable chat/intent surface** with comment threads and a “send to deliberation” flow that returns a **replacement suggestion** for selected text, which when accepted is committed into a `.wti` intent document (persistence can be stubbed in v0 unless implemented trivially).

### Hard Constraints / Requirements
- **Use `ide/packages/*`** for new packages (not `ide/agents/*`).
- Update `ide/pnpm-workspace.yaml` to include `packages/*` if not already.
- **Do not modify** `ide/agents/infra` (leave @Prime behavior as-is).
- Prefer **Conductor** naming only (no “Orchestrator” compatibility layer).
- Do **not** formalize “Conductor modes/phases”; avoid LiSA phase state machine UI. (You may deprecate/replace older `docs/goals/conductor-lisa-loops.md` content.)
- Keep React “brains” isolated so the UI renderer can be swapped later (e.g., libgdx). Therefore split UI rendering into a dedicated React package if used.

### Repo Context (existing)
- The Theia app is at: `ide/apps/wti-ide/` (depends on `@wti/infra-agent` now).
- Existing Theia extension example: `ide/agents/infra/src/browser/frontend-module.ts`.
- Intent docs live in: `intent/` (to be updated).

---

## Deliverables

### A) Documentation Updates (in `intent/`)
Create new docs and update existing ones to match the refined Conductor plan.

#### A1. Create new folder + goal doc
- Create folder: `intent/goals/`
- Create: `intent/goals/conductor-threaded-intent-surface.md`
  - Goal: implement Conductor threaded intent surface with selection-based interactions, comments, deliberation returning replacement suggestion, accept→commit into `.wti` intent doc.
  - Include concise UI actions: `Promote:` combobox, `+ Comment`, `Send → Deliberation`, optional rating (tooltip-friendly icons).
  - Link to related docs created below.

#### A2. Create new design docs
1) `intent/threaded-chat-view.md`
   - Defines the “threaded chat” UI contract:
     - Source “chat bubbles” represent seed prompt / intent text blocks.
     - Selection granularity: sentence/paragraph/bubble (gesture details can be “desired UX”; not mandatory for v0).
     - Clicking whitespace on a bubble opens an **interaction panel** (likely in main area).
     - Interaction panel re-renders the source bubble, highlights the selected text, and shows existing comment threads expanded (if any).
     - Actions are concise (see B5 below).

2) `intent/implementation-engines.md`
   - Defines “Finalize intent” gate → ship to an **ImplementationEngine**.
   - First engine: `SoftwareImplementationEngine` (turns intents into software).
   - Future engines: `KnowledgeImplementationEngine`, `LawImplementationEngine`, `StoryImplementationEngine`, etc.
   - Keep this conceptual; no heavy schema.

#### A3. Update existing intent docs to use Conductor and link new docs
Update these files:
- `intent/main.md`
  - Replace references to Orchestrator with **Conductor**.
  - Add doc map entries/links for:
    - `intent/threaded-chat-view.md`
    - `intent/implementation-engines.md`
    - `intent/goals/conductor-threaded-intent-surface.md`
  - Add/adjust pipeline wording: refine seed prompt → “finalize intent” → ship to ImplementationEngine.

- `intent/theia.md`
  - Rename “Orchestrator window” to **Conductor window**.
  - Describe the threaded bubble UI + interaction panel behavior.
  - Explain deliberation in separate context; only accepted replacement text flows back into intent.

- `intent/architecture-map.md`
  - Replace “orchestrator” role/pane with **conductor**.
  - Optionally mention ImplementationEngines downstream of work plan.

- `intent/scenarios.md`
  - Add acceptance scenario: “Conductor threaded intent surface v0” with criteria below.

#### A4. Acceptance criteria to add (in `intent/scenarios.md`)
Add scenario with acceptance criteria (v0):
1. A new **Conductor** sidebar view exists in Theia.
2. It renders a seed conversation as chat bubbles (can be stubbed/hardcoded initially).
3. Selecting a chunk (or clicking bubble whitespace) opens an **Interaction panel** (main area widget is fine).
4. Interaction panel shows:
   - original bubble with selected text highlighted
   - existing comment threads opened/expanded for that selection (if any; can be stubbed)
5. Actions are concise:
   - `Promote:` combobox (targets: Intent/Spec/Work Plan/Knowledge/Idea etc; can be stubbed)
   - `+ Comment` (no deliberation required)
   - `Send → Deliberation`
   - optional rating icons with tooltips
6. `Send → Deliberation` opens a deliberation view/context seeded with quoted text + backlink.
7. Deliberation produces a **replacement suggestion** for the selected text; user acceptance updates the `.wti` intent document and commits it (can be stubbed in v0; note ambiguity below).

#### A5. Deprecate or overwrite old LiSA goal doc (optional)
- File: `docs/goals/conductor-lisa-loops.md`
  - Either rewrite to match current plan (no acronym/phase UI) or mark deprecated/superseded by `intent/goals/conductor-threaded-intent-surface.md`.
  - User explicitly said docs/ can be overwritten.

---

### B) New Packages in `ide/packages/*` (API/SPI discipline + React isolation)

#### B1. Update pnpm workspace
- Edit: `ide/pnpm-workspace.yaml`
  - Ensure it includes: `packages/*` (plus existing `apps/*`, `agents/*`, etc.).

#### B2. Create packages (minimal scaffolding is acceptable)
Create directories + `package.json` + `tsconfig.json` + sources as needed:

1) `ide/packages/conductor-api/` → `@wti/conductor-api`
   - Pure types/interfaces consumed by others (no `@theia/*`, no React).
   - Include basic models such as:
     - Bubble / message
     - Selection range / selector (even if simplified)
     - Comment thread identifiers
     - Promotion target enum/string union
     - Replacement proposal type

2) `ide/packages/conductor-spi/` → `@wti/conductor-spi`
   - Provider interfaces for services Conductor needs:
     - storage interface (read/write `.wti` intent doc)
     - deliberation launcher interface
     - engine registry interface (ImplementationEngines)
     - patch application interface (replace selected text)

3) `ide/packages/conductor/` → `@wti/conductor`
   - Implements SPI with simple in-memory stubs initially.
   - Export bindings/services usable by UI.
   - Avoid Theia imports if possible (keep UI-agnostic).

4) `ide/packages/conductor-ui/` → `@wti/conductor-ui`
   - Theia frontend extension package.
   - Must contain `theiaExtensions.frontend` pointing to built `lib/browser/frontend-module`.
   - Registers:
     - **Conductor** sidebar view (ViewContribution / widget factory).
     - Command: “Conductor: Open” (Command Palette).
   - Opens Interaction panel (main area widget) on bubble click/selection.
   - Can depend on `@wti/conductor` and optionally `@wti/threaded-chat-react`.

5) Optional but recommended: `ide/packages/threaded-chat-react/` → `@wti/threaded-chat-react`
   - Contains the ReactWidget(s) implementing the bubble list + interaction panel UI.
   - This is the “React island” to later replace (libgdx).
   - `@wti/conductor-ui` uses this renderer.

#### B3. Wire the new UI into the app
- Edit: `ide/apps/wti-ide/package.json`
  - Add dependency: `"@wti/conductor-ui": "workspace:*"`

No changes to `ide/agents/infra` and no refactors of existing Prime/infra code.

---

## Implementation Approach (recommended steps)
1. **Docs first**: add new `intent/` docs + update references; add acceptance scenario.
2. **Workspace plumbing**: add `packages/*` to `ide/pnpm-workspace.yaml`.
3. **Create packages**: scaffold `@wti/conductor-api`, `@wti/conductor-spi`, `@wti/conductor`, `@wti/conductor-ui` (+ optional `@wti/threaded-chat-react`).
4. **Minimal Theia UI**:
   - Conductor sidebar shows placeholder bubbles.
   - Clicking a bubble (or selection stub) opens Interaction widget in main area.
   - Interaction widget shows bubble + highlight (hardcoded highlight ok in v0) + actions.
   - “Send → Deliberation” opens placeholder Deliberation widget in main area with quote/backlink.
   - Actions can call `MessageService.info(...)` initially.
5. **(Optional v0 persistence)**: If doing `.wti` updates now, implement a trivial file write path; otherwise stub with TODO and document ambiguity.

---

## Ambiguities / Clarifications Needed (log but don’t block v0)
1. **`.wti` file location and format**:
   - Where should the intent `.wti` document live? (e.g. `.wti/intent.wti.md` vs `intent/intent.md` vs workspace root)
   - What is the minimal format for “replace selected chunk”?
   - For v0, you may stub commit behavior and just display the proposed replacement.

2. **Selection mechanics**:
   - Desired UX includes double/triple/quad click semantics; but v0 can implement simpler (click bubble → treat as whole-bubble selection).
   - Later refine.

3. **Deliberation view design**:
   - For v0, placeholder view is fine; later it becomes full threaded WTI chat.

---

## Relevant Example/Pattern Hints (Theia)
- Use a Theia frontend extension module in `conductor-ui` similar in shape to:
  - `ide/agents/infra/src/browser/frontend-module.ts` (binding contributions).
- Implement sidebar view with `ViewContribution` + `WidgetFactory` (typical Theia pattern).
- Use `MessageService` for stub actions.

---

## Explicit “Do Not Do”
- Do not rename/modify/repurpose `ide/agents/infra` or @Prime-related behavior.
- Do not introduce formal Conductor “modes/phases” UI or hardwire LiSA state machine concepts into the UI.
- Do not spread React deep into core packages; keep it isolated (prefer `@wti/threaded-chat-react`).