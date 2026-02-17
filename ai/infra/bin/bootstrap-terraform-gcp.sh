#!/usr/bin/env bash
set -euo pipefail

MODE="check"
LOGIN=0
DEBUG_ENABLED=0

args=()
for arg in "$@"; do
  case "$arg" in
    --login)
      LOGIN=1
      ;;
    --debug)
      DEBUG_ENABLED=1
      ;;
    check|apply|revoke)
      MODE="$arg"
      ;;
    -h|--help|help)
      MODE="$arg"
      ;;
    *)
      args+=("$arg")
      ;;
  esac
done

if [[ ${#args[@]} -gt 0 ]]; then
  echo "ERROR: Unknown argument(s): ${args[*]}" >&2
  echo >&2
  MODE="__invalid__"
fi

if [[ "${DEBUG:-}" == "true" || "${DEBUG:-}" == "1" ]]; then
  DEBUG_ENABLED=1
fi

debug() {
  if [[ "$DEBUG_ENABLED" -eq 1 ]]; then
    echo "DEBUG: $*" >&2
  fi
}

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

if [[ "$TARGET_PRINCIPAL" != *:* ]]; then
  echo "ERROR: TARGET_PRINCIPAL must include a principal type prefix (e.g. user:, serviceAccount:, group:)" >&2
  exit 2
fi

debug "GOOGLE_PROJECT_ID=$GOOGLE_PROJECT_ID"
debug "GCLOUD_ACCOUNT=$GCLOUD_ACCOUNT"
debug "TARGET_PRINCIPAL=$TARGET_PRINCIPAL"

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
  GOOGLE_PROJECT_ID=... GCLOUD_ACCOUNT=... $0 [--debug] [--login] [check|apply|revoke]

Required:
  GOOGLE_PROJECT_ID   Target GCP project id
  GCLOUD_ACCOUNT      Expected gcloud account (email)

Optional:
  TARGET_PRINCIPAL    Principal to bind roles to (default: user:<GCLOUD_ACCOUNT>)
  --login             If active account != GCLOUD_ACCOUNT, run: gcloud auth login <GCLOUD_ACCOUNT>
  --debug             Enable debug logging (also via DEBUG=true or DEBUG=1)

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

get_active_account() {
  gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -n1 || true
}

active_account="$(get_active_account)"

if [[ -z "$active_account" ]]; then
  echo "ERROR: No active gcloud account. Run: gcloud auth login" >&2
  exit 3
fi

debug "active_account=$active_account"
debug "expected_account=$EXPECTED_ACCOUNT"

expected_account_lc="${EXPECTED_ACCOUNT,,}"
active_account_lc="${active_account,,}"

if [[ "$active_account_lc" != "$expected_account_lc" ]]; then
  if [[ "$LOGIN" -eq 1 ]]; then
    echo "WARN: Active gcloud account mismatch; attempting login to expected account" >&2
    echo "  expected: $EXPECTED_ACCOUNT" >&2
    echo "  active:    $active_account" >&2
    gcloud auth login "$EXPECTED_ACCOUNT"

    active_account="$(get_active_account)"
    if [[ -z "$active_account" ]]; then
      echo "ERROR: No active gcloud account after login" >&2
      exit 3
    fi

    active_account_lc="${active_account,,}"

    if [[ "$active_account_lc" != "$expected_account_lc" ]]; then
      echo "ERROR: Active gcloud account mismatch after login" >&2
      echo "  expected: $EXPECTED_ACCOUNT" >&2
      echo "  active:    $active_account" >&2
      echo "Hint: run 'gcloud auth list' and 'gcloud config set account $EXPECTED_ACCOUNT' (or re-run with the correct GCLOUD_ACCOUNT)" >&2
      exit 3
    fi
  else
    echo "ERROR: Active gcloud account mismatch" >&2
    echo "  expected: $EXPECTED_ACCOUNT" >&2
    echo "  active:    $active_account" >&2
    echo "Hint: re-run with --login to auto-run 'gcloud auth login $EXPECTED_ACCOUNT'" >&2
    exit 3
  fi
fi

PROJECT_ROLES=(
  roles/iam.serviceAccountAdmin
  roles/serviceusage.serviceUsageAdmin
  roles/compute.networkAdmin
  roles/container.admin
  roles/dns.admin
)

get_policy_json() {
  gcloud projects get-iam-policy "$PROJECT_ID" --project "$PROJECT_ID" --format=json
}

policy_json="$(get_policy_json)"

debug "policy_json_loaded=yes"

binding_exists() {
  local role="$1"
  echo "$policy_json" | jq -e --arg principal "$TARGET_PRINCIPAL" --arg role "$role" '
    [(.bindings // [])[]
      | select(.role == $role)
      | (.members // [])[]
    ]
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
    if binding_exists "$role"; then
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

debug "GOOGLE_PROJECT_ID=$GOOGLE_PROJECT_ID"
debug "GCLOUD_ACCOUNT=$GCLOUD_ACCOUNT"
debug "TARGET_PRINCIPAL=$TARGET_PRINCIPAL"
debug "active_account=$active_account"
debug "expected_account=$EXPECTED_ACCOUNT"

case "$MODE" in
  check)
    print_check_table
    ;;
  apply)
    echo
    echo "Planned changes:"
    for role in "${PROJECT_ROLES[@]}"; do
      if binding_exists "$role"; then
        echo "SKIP: already has $role (member=$TARGET_PRINCIPAL)"
        debug "binding_exists role=$role member=$TARGET_PRINCIPAL present=yes"
      else
        echo "ADD:  $role (member=$TARGET_PRINCIPAL)"
        debug "binding_exists role=$role member=$TARGET_PRINCIPAL present=no"
      fi
    done
    echo
    echo "Applying:"
    for role in "${PROJECT_ROLES[@]}"; do
      if binding_exists "$role"; then
        echo "SKIP: $role"
      else
        add_binding "$role"
      fi
    done
    echo
    echo "Done. Current status:"
    policy_json="$(get_policy_json)"
    print_check_table
    ;;
  revoke)
    echo
    echo "Planned changes:"
    for role in "${PROJECT_ROLES[@]}"; do
      if binding_exists "$role"; then
        echo "REMOVE: $role"
      else
        echo "SKIP:   missing $role"
      fi
    done
    echo
    echo "Revoking (best-effort):"
    set +e
    for role in "${PROJECT_ROLES[@]}"; do
      if binding_exists "$role"; then
        remove_binding "$role" || true
      else
        echo "SKIP: $role"
      fi
    done
    set -e
    echo
    echo "Done. Current status:"
    policy_json="$(get_policy_json)"
    print_check_table
    ;;
esac
