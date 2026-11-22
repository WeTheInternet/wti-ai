# Linter Role

## Purpose

The Linter is the system's judge of output quality against declared rules, scope, and acceptance criteria. It should prefer deterministic checking wherever possible and use semantic review only for the gaps that deterministic checks cannot cover.

A harness that can generate but not clearly reject is not trustworthy.

---

## Validation layers

### 1. Mechanical validation
Examples:
- tests pass
- formatter clean
- type checks pass
- no forbidden APIs used
- changed files are syntactically valid

### 2. Policy validation
Examples:
- changes stayed within declared scope
- required patterns or architectural constraints were followed
- approvals were present where required
- prohibited side effects did not occur

### 3. Semantic validation
Examples:
- behavior appears to match interpretation
- acceptance criteria seem satisfied
- user-facing behavior matches declared intent

Semantic checks should be bounded and explain what evidence they relied on.

---

## Output contract

Lint results should be structured and actionable.

Example:
```json
{
  "result": "fail",
  "failures": [
    {
      "layer": "policy",
      "code": "OUT_OF_SCOPE_EDIT",
      "file": "src/ui/Toolbar.java",
      "message": "Modified outside interpretation scope."
    }
  ]
}
```

Do not return only vague prose.

---

## Relationship to Task-Agent

The Linter should not become a second Task-Agent. If it finds a problem, it should report it clearly. A separate worker or a retried task cycle can address the issue.

---

## Relationship to interpretation

The Linter must validate against the active interpretation. If interpretation is weak, lint quality will also be weak. This is another reason the interpretation layer matters.

---

## Failure modes

### Vague semantic approval
The Linter says "looks good" without evidence.

### Hidden policy enforcement
The Linter fails output for rules that were never surfaced in interpretation or context.

### Overuse of model judgment
The Linter turns into another generator with opinions instead of a validator with contracts.

---

## Early implementation advice

Start with:
- strong mechanical validation
- a small policy rule set
- very narrow semantic checks

Increase semantic ambition only when you can measure whether it improves decisions rather than merely sounding persuasive.
