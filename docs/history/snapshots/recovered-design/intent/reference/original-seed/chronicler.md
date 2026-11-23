# Chronicler Role

## Purpose

The Chronicler turns an execution session into durable, typed artifacts. It does not merely summarize the end. It packages the session into reviewable traces, artifact references, outcome notes, and knowledge candidates.

The Chronicler is how work becomes reusable without turning memory into sludge.

---

## Responsibilities

The Chronicler should:
- gather final task outputs
- normalize checkpoints and decisions
- link results to interpretations and intent references
- propose knowledge candidates with provenance
- preserve unresolved risks
- serialize artifacts into durable references
- distinguish discardable notes from promotable knowledge

---

## Inputs

A Chronicler should consume:
- task envelope
- active interpretation
- decision trace events
- final worker summary
- artifact refs
- lint results
- knowledge candidate proposals
- human approvals or rejections

---

## Outputs

Useful Chronicler outputs include:
- task outcome record
- decision trace summary
- artifact index
- unresolved issue list
- knowledge candidate set
- discard recommendations
- handoff-worthy summaries if the task is paused, not finished

---

## Chronicler versus knowledge layer

The Chronicler normalizes and packages. The Knowledge layer decides longer-term storage class and query behavior. The Chronicler should not unilaterally promote every candidate into durable project truth.

---

## Important discipline

The Chronicler should preserve typing distinctions such as:
- source fact
- human assertion
- derived summary
- hypothesis
- approved decision
- validation result

Flattening these categories will damage future trust.

---

## Good Chronicler questions

When packaging a session, the Chronicler should effectively answer:
- what was attempted,
- what succeeded,
- what failed,
- what evidence mattered,
- what changed,
- what may be worth remembering,
- what should definitely be forgotten.

---

## Failure modes

### Summary laundering
A shaky inference is rewritten as a clean permanent fact.

### Oversaving
Every intermediate observation is promoted because it feels useful in the moment.

### Under-linking
Results are kept, but their originating interpretation or intent is lost.

### Beautiful but useless narrative
The summary reads well but cannot drive future tooling or review.

---

## Early implementation advice

Keep the Chronicler structured. Favor typed fields and linked references over elegant long prose. Narrative summaries are still useful, but they should sit beside machine-usable structure, not replace it.
