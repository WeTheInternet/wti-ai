# Coordination contract 1.2 templates

Use these field names; choose task-specific occurrence fields before dispatch. `null`
means unknown and requires an explanation. Do not use empty arrays to conceal failure.

## Request

```yaml
protocol: '1.2'
request_id: R01
revision: 1
objective: <bounded outcome>
roles: {coordinator: <verified actor>, worker: <verified actor>, analyst: <actor>}
completion_owner: <actor>
existing_outputs: [] # tool/input/output versions to reuse
additional_work: [] # bounded execution needed, with purpose
source_scope: {roots_or_ids: [], exclusions: []}
manifest: {id: <id>, version: 1, action: create-or-reuse}
dates: {start_inclusive: <ISO date or null>, end_inclusive: <ISO date or null>, field: <field or not-applicable>, timezone: <zone or not-applicable>}
filters: []
output: {directory: <worker-local approved path>, format: <format>, fields: <exact names/types>, locator_convention: <row/page/line definition>}
allowed_operations: []
prohibited_operations: []
max_batch: <count/unit>
stop_condition: <coverage/budget/failure boundary>
```

## Result and source manifest

```yaml
protocol: '1.2'
request_id: R01
revision: 1
manifest: {id: <id>, version: 1}
result: {id: <id>, version: 1, status: complete-or-partial-or-blocked}
population: {unit: <files/pages/rows>, count: null, explanation: <basis>}
coverage: {inspected: [], failed_or_unavailable: [], filter_basis: <literal rule>}
occurrence_count: <integer or null>
sources:
  - {id: S01, path: <actual source>, kind: raw-or-processed-or-unknown, format: <format>, size: null, sha256: null, availability: <state>, expected_coverage: <unit/count>, inspected_coverage: <range>}
artifacts:
  - {id: A01, version: 1, request_revision: 1, manifest_version: 1, path: <local output>, size: <bytes>, sha256: <digest>}
uncertainties: []
unresolved_items: []
next: {owner: <actor>, action: <one concrete action>}
```

For report reuse, specify the report's native table/section schema and locators rather
than inventing raw occurrence rows. Attach known date coverage and application/rule versions;
unknown versions are explicit gaps, not an automatic reason to rebuild the pipeline.

Occurrence minimum for a requested raw drill-down: `occurrence_id`, `source_id`, `locator`, `original_values`,
`date_value`, `date_field`. Use explicit null dates when not applicable. Extend fields
for the requested task without removing original evidence. Consumer skills may add domain
fields and policy, but must reference contract 1.2 rather than copy its coordination rules.

## Capability, scope change, transfer and checkpoint records

```yaml
capability: {actor: <role>, surface: <provider>, id: <verified ID>, id_type: <type>, host: <host or unknown>, account: <verified account>, operation: <read/send/upload>, state: <tested/unknown/denied/disconnected/available>, evidence: <tool receipt>, tested_at: <time>}
scope_change: {request_id: R01, from_revision: 1, to_revision: 2, authorized_by: <direct user instruction locator>, reason: <reason>, affected_operations: [], superseded_outputs: []}
transfer: {artifact_id: A01, version: 1, sha256: <digest>, source: <location>, destination: <account/container>, approval: <authority locator>, object_id: <provider ID or null>, link: <verified link or null>, state: <prepared/transferred/accessible/delivered/consumed/completed/uncertain/blocked>, receipt: <evidence or missing>, recipient: <actor>, time: <time>}
checkpoint: {protocol: '1.2', request_revisions: {}, manifest_versions: {}, artifact_versions: {}, input_tool_versions: {}, verified_capabilities: [], facts: [], user_statements: [], assumptions: [], unknowns: [], open_ids: [], denied_operations: [], next_owner: <actor>, next_action: <one action>}
```

Keep per-hop transfer receipts and per-recipient state evidence; one aggregate state
must not replace the audit trail. Before resuming a checkpoint compare its request,
manifest and artifact versions against current receipts. Mark conclusions based on older
versions stale and retain them as superseded; recalculate only affected analysis.
