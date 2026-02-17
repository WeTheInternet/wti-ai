---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-02-17T00:00:00Z
verification:
  - "(manual) Notes migration is complete for dev"
---

# Design note: Terraform baseline for dev

## Goal

Dev is provisioned end-to-end by Terraform with zero manual steps.

Terraform owns:
- GCP APIs
- Network
- GKE Autopilot cluster
- Static IP
- Cloud DNS zone and the `A conductor.<domain>` record
- Workload Identity for cert-manager DNS01
- Helm installs for cert-manager and Envoy Gateway
- Kubernetes baseline manifests (placeholder app, Certificate, Gateway, HTTPRoute)

## State

Dev uses local state by default and can be migrated to a GCS backend later.
