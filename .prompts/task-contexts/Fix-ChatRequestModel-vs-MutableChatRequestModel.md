id: 315925d4-6870-4632-8247-13b5380fef2e
sessionId: 29e5598e-a2f7-4493-99f1-4d4ef3ee584f
date: '2026-03-18T06:03:53.309Z'
label: Fix ChatRequestModel vs MutableChatRequestModel TypeScript Error
---
## Summary of Current Session

### Objective
Fix a TypeScript compilation error when running `ide/run.sh` for package `@wti/infra-agent@0.1.0`:

- Error: `TS2345: Argument of type 'ChatRequestModel' is not assignable to parameter of type 'MutableChatRequestModel'`
- Location: `ide/agents/infra/src/browser/infra-agent.ts:315` (call to `getRequestText(last)`)

Root cause: `ChatModel.getRequests()` returns immutable `ChatRequestModel[]`, but helper `getRequestText` is typed to accept `MutableChatRequestModel`. The function only *reads* properties and already casts to `any`, so it should accept the immutable type as well.

### Key Artifacts / Locations
- File: `ide/agents/infra/src/browser/infra-agent.ts`
  - Function: `getRequestText(request: MutableChatRequestModel): string`
  - Usage: inside `InfraAgent.getMessages(model: ChatModel)`:
    - `const requests = model.getRequests();`
    - `const last = requests[requests.length - 1];`  // inferred as `ChatRequestModel | undefined`
    - `const lastUserText = last ? getRequestText(last).trim() : '';`  // type mismatch

### Requirements / Constraints
- Make TypeScript compile without changing runtime behavior.
- Minimal, safe change: adjust typing only (no functional refactor needed).
- Ensure `pnpm exec tsc -p tsconfig.json` for `ide/agents/infra` passes, and thus `ide/run.sh` proceeds.

### Proposed Implementation Approach (Task Steps)
1. **Update the `getRequestText` function signature** to accept the immutable request model type returned by `model.getRequests()`.
2. **Option A (preferred, most explicit typing):**
   - Import `ChatRequestModel` from `@theia/ai-chat` in `ide/agents/infra/src/browser/infra-agent.ts`.
   - Change signature to union type:
     - `function getRequestText(request: MutableChatRequestModel | ChatRequestModel): string`
3. **Option B (alternative, simplest import-wise):**
   - Change signature to `unknown`:
     - `function getRequestText(request: unknown): string`
   - Keep the existing dynamic property checks unchanged.
4. Confirm no other code changes required (the body already does `const anyReq = request as any;` and only reads fields).
5. Rebuild the package (`pnpm exec tsc -p tsconfig.json` in `ide/agents/infra` context) and verify `ide/run.sh` no longer fails.

### Ambiguities / Clarifications Needed
- None functionally. Only a choice between:
  - **Union with `ChatRequestModel` (Option A)** vs **`unknown` (Option B)**.
  - If uncertain, choose Option A to keep stronger typing and clearer intent.

### Relevant Example / Correct Pattern
Because `ChatModel.getRequests()` returns `ChatRequestModel[]`, helpers that read request data should accept `ChatRequestModel` (or a union of mutable/immutable types) rather than only `MutableChatRequestModel`.

**Example patch (Option A):**
- In `ide/agents/infra/src/browser/infra-agent.ts`:
  - Add `ChatRequestModel` to the import list from `@theia/ai-chat`.
  - Update:
    - `function getRequestText(request: MutableChatRequestModel | ChatRequestModel): string { ... }`

This resolves the TS2345 error at the call site `getRequestText(last)`.