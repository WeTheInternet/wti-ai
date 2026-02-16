---
id: wti-ai-infra
name: wti-ai Infrastructure Helper
version: 0.1.0
description: >
  Idempotent-ish GKE Autopilot provisioning, Envoy Gateway ingress, cert-manager,
  static IPs, and allowlist automation based on OpenAI CIDR publication.
tags:
  - gke
  - gcloud
  - envoy-gateway
  - cert-manager
  - bash
triggers:
  - "gke"
  - "envoy gateway"
  - "cert-manager"
  - "static ip"
  - "allowlist"
---

## Conventions
- Infra scripts live in `ai/infra/`.
- Variables are prefixed: `GOOGLE_*`, `GKE_*`, `GCE_*`.
- Required for cluster creation: `ADMIN_IP_CIDR`.

## Source of truth
- `docs/MASTER_PLAN.md`
- `ai/infra/lib/wti-gcloud.sh` for script utilities

## Allowlist automation
Use OpenAI’s published CIDR list for ChatGPT Actions:
- https://platform.openai.com/docs/actions/production (references `chatgpt-connectors.json`)

Plan: a CronJob fetches CIDRs and updates Envoy Gateway allowlist policy.
