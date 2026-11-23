# WTI-AI roadmap router

The current product direction is the [Conductor/LISA goal](docs/goals/conductor-lisa-loops.md), [delivery workflow draft](docs/specs/agent-workflow.md) and [bounded reconciliation plan](docs/plans/docs-reconciliation.md). The workflow starts with software delivery; it does not require completing the whole older architecture first.

The previous roadmap versions remain preserved:
- [Main's GKE/Quarkus proposal](docs/history/snapshots/main-9de86d6/MASTER_PLAN.md).
- [Recovery's later infrastructure variant](docs/history/snapshots/recovered-design/MASTER_PLAN.md).
- [Screened snapshot inventory](docs/history/INDEX.md).

The Human values GKE's familiar deployment/scaling path and Quarkus/Vert.x's async/AoT possibilities. Preserving those reasons does not decide when to adopt them. Their exact deployment status remains a roadmap choice, separate from the current fixture-only panel work.

The [certified glossary](docs/5_certified/WTI_AI_GLOSSARY.md) still uses “conductor” for the earlier Quarkus control-plane service. The current workflow draft describes the broader orchestration responsibility. Reconcile that term's certification explicitly before presenting the service and responsibility as an identical settled architecture.

This router and the linked reconciliation drafts do not authorize infrastructure changes, change agent permissions, or certify recovered implementations.
