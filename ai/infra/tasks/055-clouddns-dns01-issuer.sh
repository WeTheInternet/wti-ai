#!/usr/bin/env bash
set -Eeuo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/lib/wti-gcloud.sh"
start_task_log "055-clouddns-dns01-issuer"

ensure_gcloud_context

validate_var GOOGLE_PROJECT_ID "Set GOOGLE_PROJECT_ID"

DNS01_SA_NAME="${DNS01_SA_NAME:-cert-manager-dns01}"
DNS01_SA_DISPLAY_NAME="${DNS01_SA_DISPLAY_NAME:-cert-manager DNS01}"
DNS01_SA_EMAIL="${DNS01_SA_NAME}@${GOOGLE_PROJECT_ID}.iam.gserviceaccount.com"
DNS01_SA_KEY_OUT="${DNS01_SA_KEY_OUT:-}"

_log "Ensuring service account ${DNS01_SA_EMAIL}"
if gcloud_resource_exists iam service-accounts describe "${DNS01_SA_EMAIL}"; then
  _log "Exists: service account ${DNS01_SA_EMAIL}"
else
  _gc iam service-accounts create "${DNS01_SA_NAME}" --display-name "${DNS01_SA_DISPLAY_NAME}"
fi

_log "Ensuring IAM binding for Cloud DNS"
_gc projects add-iam-policy-binding "${GOOGLE_PROJECT_ID}" \
  --member "serviceAccount:${DNS01_SA_EMAIL}" \
  --role "roles/dns.admin" \
  >/dev/null

cat <<EOF

NEXT STEPS (approval-gated):

1) Create a service account key JSON (do not commit it):
   - Suggested output file (local): ./secrets/clouddns-dns01-key.json
   - Command (example):
       gcloud iam service-accounts keys create ./secrets/clouddns-dns01-key.json \\
         --project "${GOOGLE_PROJECT_ID}" \\
         --zone "${GKE_ZONE}" \\
         --iam-account "${DNS01_SA_EMAIL}"

2) Create the Kubernetes Secret in the cert-manager namespace (do not commit it):
       kubectl --context "${KUBE_CONTEXT}" --namespace cert-manager create secret generic clouddns-dns01-svc-acct \\
         --from-file=key.json=./secrets/clouddns-dns01-key.json

3) Update and apply the ClusterIssuer manifest:
   - File: ai/infra/manifests/cert-manager/10-clusterissuer-letsencrypt-dns01.yaml
   - Set:
       spec.acme.email
       spec.acme.solvers[0].dns01.cloudDNS.project

Notes:
- Start with Let's Encrypt staging (current manifest uses staging) to avoid rate limits.
- Consider switching to Workload Identity later.

EOF
