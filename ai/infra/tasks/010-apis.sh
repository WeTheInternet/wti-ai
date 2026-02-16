#!/usr/bin/env bash
set -Eeuo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/lib/wti-gcloud.sh"
start_task_log "010-apis"

ensure_gcloud_context

_log "Enabling required Google APIs"
_gc services enable \
  container.googleapis.com \
  compute.googleapis.com \
  iam.googleapis.com \
  dns.googleapis.com \
  certificatemanager.googleapis.com
