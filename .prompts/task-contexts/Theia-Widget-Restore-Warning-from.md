id: 7b18a746-0477-4409-a849-eb4e17c818d6
sessionId: 74cc83d5-a652-4e68-86dc-16a230003ae7
date: '2026-02-16T21:57:15.267Z'
label: Theia Widget Restore Warning from Persisted repos/theia URI
---
## Summary (for coding agent)

### Main objective
Eliminate **all in-repo references** to the string/path token `repos/theia` except in documents that explicitly describe the rule “do not reference `repos/theia`”. Theia is run from the command line in `/opt/theia`.

A runtime warning is observed:
- `2026-02-16T21:49:53.213Z root WARN Couldn't restore widget for editor-preview-widget. Error: Error: 'file:///opt/wti-ai/repos/theia/packages/ai-ide/src/browser/infra-agent.ts' is invalid`

This warning likely comes from persisted Theia UI state, but the *coding task* is to remove in-repo references and record the runtime info.

---

### Relevant artifacts / findings
Workspace search found `repos/theia` in these tracked files:

1) **`wti-ai.theia-workspace`** (must be changed)
- Contains exclude rules referencing `repos/theia`.

2) Docs that mention `repos/theia` (allowed if they describe the “do not reference it” rule)
- `.prompts/task-contexts/Theia-Workspace-Excludes-For-Node.md`
- `.prompts/task-contexts/Theia-Infra-Agent-Build-Steps.md`
- `skills/theia-dev/SKILL.md`

3) **`AGENTS.md`** exists and should record `/opt/theia` runtime assumption.

Search did **not** find `file:///opt/wti-ai/repos/theia` in repo code/config; warning is likely from persisted state, not code.

---

### Requirements / constraints
- Theia is run from the command line in **`/opt/theia`**.
- If a `repos/theia` directory exists in this repo, it is lookup-only for agents; do not reference it in code/config/scripts.

---

### Proposed implementation approach (task steps)

#### Step 1 — Remove `repos/theia` from committed workspace config
Edit **`wti-ai.theia-workspace`** and remove any `repos/theia` entries.

#### Step 2 — Update docs that instruct using `repos/theia` as a default target
Replace any guidance that defaults to `repos/theia` with `/opt/theia` (or require explicit user-provided path).

#### Step 3 — Record operational fact: Theia runtime is `/opt/theia`
Ensure **`AGENTS.md`** records:
- Theia is run from `/opt/theia`.
- `repos/theia` (if present) is lookup-only and must not be referenced in code or committed configuration.
