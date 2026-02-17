#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-check}"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "ERROR: Missing required env var: ${name}" >&2
    exit 2
  fi
}

require_env "GOOGLE_PROJECT_ID"
require_env "GCLOUD_ACCOUNT"

PROJECT_ID="$GOOGLE_PROJECT_ID"
EXPECTED_ACCOUNT="$GCLOUD_ACCOUNT"
TARGET_PRINCIPAL="${TARGET_PRINCIPAL:-user:${EXPECTED_ACCOUNT}}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud not found in PATH" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq not found in PATH" >&2
  exit 2
fi

describe_mode() {
  cat <<EOF
Usage:
  GOOGLE_PROJECT_ID=... GCLOUD_ACCOUNT=... $0 [check|apply|revoke]

Required:
  GOOGLE_PROJECT_ID   Target GCP project id
  GCLOUD_ACCOUNT      Expected gcloud account (email)

Optional:
  TARGET_PRINCIPAL    Principal to bind roles to (default: user:<GCLOUD_ACCOUNT>)

Modes:
  check   Verify active gcloud account and show whether roles are present
  apply   Add IAM policy bindings for TARGET_PRINCIPAL
  revoke  Remove IAM policy bindings for TARGET_PRINCIPAL (best-effort)
EOF
}

case "$MODE" in
  check|apply|revoke) ;;
  -h|--help|help)
    describe_mode
    exit 0
    ;;
  *)
    echo "ERROR: Unknown mode: $MODE" >&2
    describe_mode
    exit 2
    ;;
esac

active_account="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -n1 || true)"

if [[ -z "$active_account" ]]; then
  echo "ERROR: No active gcloud account. Run: gcloud auth login" >&2
  exit 3
fi

if [[ "$active_account" != "$EXPECTED_ACCOUNT" ]]; then
  echo "ERROR: Active gcloud account mismatch" >&2
  echo "  expected: $EXPECTED_ACCOUNT" >&2
  echo "  active:    $active_account" >&2
  exit 3
fi

PROJECT_ROLES=(
  roles/iam.serviceAccountAdmin
  roles/serviceusage.serviceUsageAdmin
  roles/compute.networkAdmin
  roles/container.admin
  roles/dns.admin
)

policy_json="$(gcloud projects get-iam-policy "$PROJECT_ID" --project "$PROJECT_ID" --format=json)"

has_role() {
  local role="$1"
  echo "$policy_json" | jq -e --arg principal "$TARGET_PRINCIPAL" --arg role "$role" '
    (.bindings // [])
    | map(select(.role == $role))
    | map(.members // [])
    | flatten
    | any(. == $principal)
  ' >/dev/null 2>&1
}

print_check_table() {
  echo "Project: $PROJECT_ID"
  echo "Account: $active_account"
  echo "Principal: $TARGET_PRINCIPAL"
  echo
  printf '%-40s %s\n' "ROLE" "PRESENT"
  printf '%-40s %s\n' "----" "-------"
  local role
  for role in "${PROJECT_ROLES[@]}"; do
    if has_role "$role"; then
      printf '%-40s %s\n' "$role" "yes"
    else
      printf '%-40s %s\n' "$role" "no"
    fi
  done
}

add_binding() {
  local role="$1"
  echo "gcloud projects add-iam-policy-binding \"$PROJECT_ID\" --project \"$PROJECT_ID\" --member \"$TARGET_PRINCIPAL\" --role \"$role\""
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --project "$PROJECT_ID" \
    --member "$TARGET_PRINCIPAL" \
    --role "$role" \
    --quiet >/dev/null
}

remove_binding() {
  local role="$1"
  echo "gcloud projects remove-iam-policy-binding \"$PROJECT_ID\" --project \"$PROJECT_ID\" --member \"$TARGET_PRINCIPAL\" --role \"$role\""
  gcloud projects remove-iam-policy-binding "$PROJECT_ID" \
    --project "$PROJECT_ID" \
    --member "$TARGET_PRINCIPAL" \
    --role "$role" \
    --quiet >/dev/null
}

echo "Mode: $MODE"

case "$MODE" in
  check)
    print_check_table
    ;;
  apply)
    echo
    echo "Planned changes:"
    for role in "${PROJECT_ROLES[@]}"; do
      if has_role "$role"; then
        echo "SKIP: already has $role"
      else
        echo "ADD:  $role"
      fi
    done
    echo
    echo "Applying:"
    for role in "${PROJECT_ROLES[@]}"; do
      if has_role "$role"; then
        echo "SKIP: $role"
      else
        add_binding "$role"
      fi
    done
    echo
    echo "Done. Current status:"
    policy_json="$(gcloud projects get-iam-policy "$PROJECT_ID" --project "$PROJECT_ID" --format=json)"
    print_check_table
    ;;
  revoke)
    echo
    echo "Planned changes:"
    for role in "${PROJECT_ROLES[@]}"; do
      if has_role "$role"; then
        echo "REMOVE: $role"
      else
        echo "SKIP:   missing $role"
      fi
    done
    echo
    echo "Revoking (best-effort):"
    set +e
    for role in "${PROJECT_ROLES[@]}"; do
      if has_role "$role"; then
        remove_binding "$role" || true
      else
        echo "SKIP: $role"
      fi
    done
    set -e
    echo
    echo "Done. Current status:"
    policy_json="$(gcloud projects get-iam-policy "$PROJECT_ID" --project "$PROJECT_ID" --format=json)"
    print_check_table
    ;;
esac
