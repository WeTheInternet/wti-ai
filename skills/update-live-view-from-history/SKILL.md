---
name: update-live-view-from-history
description: Refresh an enrolled project's Agent Graph view after a verified history publication, reader handoff, or authorized refresh request. Show the confirmed roster, reported state, exact displayed revision and any source failures.
---

# Update the Agent Graph view from project history

Run this workflow when the existing reader receives a publication receipt or has an authorized refresh to perform. Skills guide active runs. Automatic wake-up requires an existing authorized trigger or separately assigned integration.

1. Read the current roster and allowlisted source bindings from the integration owner. Keep stable IDs across display-name changes. Show confirmed members with **No report yet** when no report exists. A valid report may itself say **unknown**. Use distinct labels for fixtures, curated snapshots, and agent-branch Git reports. Keep report author and publisher visible where a relay was involved.
2. For each assigned source, resolve its exact full ref in the right private companion repo and pin the resulting commit once. Read only the bounded summary blob at that commit/path. Use the existing summary decoder. Verify actor binding, digest and submitted commit against the receipt. A later tip or mismatch requires explicit reconciliation. Preserve the failure and retain the last verified report with its original timestamp. Mark first-read failures as unavailable. A fixture cannot satisfy a real-source read.
3. Use the supported reader and UI refresh. If the reader requires a local Git source, use the operator-approved mirror of the exact hosted ref and verify the full commit matches before refreshing. A checkout on a different host needs an established read route. The single-source WTI-AI panel can display one bound source at a time. Use a separately authorized reader for a multi-source roster. Route changes to bindings or UI to their integration owners. Preserve running previews until cutover is authorized.
4. Check the rendered view using the ordinary operator entry point. Compare the source label, actor ID, state, reported UTC (including missing values), and exact displayed commit to the validated input. Derive freshness from report time. Record read time separately. Preserve provenance when a view combines reports with different commits. Never infer liveness, publisher access, or an assignment from a row.
5. Return the reader identity, source repo/ref/path, expected and displayed commit, SHA-256, refresh time and an observed view receipt. Say whether this was independent of publication. If only the decoder or backend succeeded, identify the outstanding display check. Make repeated refreshes at an unchanged tip idempotent.
