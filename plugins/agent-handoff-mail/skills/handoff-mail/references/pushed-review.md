# Review pushed code through a verified ChatGPT reviewer

Use a normal addressed message with [this payload shape](review-request.json).
This workflow does not create a reviewer, post comments, edit code or merge by itself.
Preserve repository review gates and the user's permitted operations.

## Exact handoff

Resolve the existing primary issue and PR. Include repository, verified reviewer,
issue/PR links, full base/head SHAs, observed PR metadata, objective, scope/exclusions,
criteria and latest user amendments. Link existing requirement/assignment records
with observed revision/timestamp/hash. Include tests already run (command/check,
status, tested SHA, evidence, who ran it), known gaps, user-owned checks, completion
owner, allowed operations, review focus and stop condition.

Verify reviewer repository access through connected GitHub. Prefer it for pushed
files, commits, diffs, issues, PRs and CI; local work is only for local-only evidence.
Do not duplicate successful CI or delegate normal remote reading back to Codex.
Role/title and another agent's connector do not prove reviewer access.
Include the [environment preflight](environment.md): reviewer-accessible repository
links/SHAs and private evidence locations, actual read evidence and unknowns. A
Codex-local path or localhost URL can describe the sender's environment, but cannot
deliver code, test logs or this skill to remote ChatGPT. Carry any necessary local
evidence through the authorized private relay, or keep that slice explicitly blocked.

Packet SHAs are claims until matched to GitHub. Read exact commit files and the
base/head comparison, recording actual merge-base semantics. If a tool cannot pin
reads, bracket mutable reads with head checks and stop/report incomplete coverage
on drift. Do not label a mutable branch read an immutable snapshot.

## Reviewer result

ACK the exact message. Compare current scope and PR base/head with the packet.
Record execution agreement separately after that comparison, using `accept-execution`
only in a 0.1.4-capable exchange or the reviewer's attributed native record otherwise.
If either SHA changed, preserve the old packet as stale and obtain a revised
request/new message before claiming current-head review. Review criteria, affected
code, meaningful callers/tests and concrete failure modes. Unavailable reads are
coverage gaps. Application/manual tests and code changes need their own authority.

Each finding uses:

```text
finding_id: stable within this request
classification: bug | suggestion | question
severity: critical | high | medium | low (bugs); informational otherwise
repository / head_sha / file / line: exact inspected location, or explicit unavailable
reasoning: trigger, behavior, impact and violated requirement
reproduction_or_gap: minimal repro, test evidence or precise missing criterion
requirement_link: existing issue/criterion/source; never invent requirements
recommended_action: bounded fix or question
```

Prioritize bugs; keep suggestions/questions distinct from blockers. With no findings,
report inspected coverage and residual risks rather than universal correctness.
Persist the result before notifying. On a lost notification, retrieve/resend that
same result instead of repeating the review; check whether the head changed and
mark the old coverage accurately. Return exact reviewed base/head, criteria revision, findings, coverage and tests
relied on. Review completion is separate from implementation acceptance and merge.

## Fix and re-review

System routes findings to already authorized owners. Prefer connected GitHub for
safe remote edits when authorized; dispatch only local-only residuals to Codex.
Review permission does not itself authorize edits, pushes or posted comments.
Keep stable finding IDs and evidence links across the loop.

After a push, fetch the new full head/base. Reconcile each finding as verified fixed,
open, superseded or disputed. Create a new request revision/message for the new SHA,
covering the fix and plausible regressions. Re-read unchanged code if assumptions
changed. Preserve old reviews; CI/review evidence covers its actual SHA only.

The designated owner separately accepts results and required gates. Apply existing
project rules such as current-head Copilot independently from this ChatGPT review.
Agent approval, green CI and issue closure do not authorize merge. There is no merge
action or automatic terminal mode in this workflow.
