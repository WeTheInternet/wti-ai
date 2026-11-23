#!/usr/bin/env bash
# Source before preflight checks so their failures are recorded too.
umask 077
state_root="${XDG_STATE_HOME:-$HOME/.local/state}/wti-ai"
mkdir -p "$state_root"
run_dir=$(mktemp -d "$state_root/$(date -u +%Y%m%dT%H%M%SZ)-${validation_kind}.XXXXXX")
printf 'Results: %s\n' "$run_dir"
exec 3>&1 4>&2
exec > >(tee "$run_dir/validation.log") 2>&1
log_pid=$!
finish_logging() {
    local result=$?
    trap - EXIT
    if [[ -n ${build_context:-} ]]; then
        rm -rf -- "$build_context" || true
    fi
    date -u +%FT%TZ > "$run_dir/finished-at.txt"
    printf '%s\n' "$result" > "$run_dir/exit-code.txt"
    printf 'finished\n' > "$run_dir/status.txt"
    exec 1>&3 2>&4 3>&- 4>&-
    wait "$log_pid" || true
    exit "$result"
}
trap finish_logging EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
date -u +%FT%TZ > "$run_dir/started-at.txt"
printf 'running\n' > "$run_dir/status.txt"
# Missing exit-code.txt indicates interruption before normal finalization.
printf 'Validation: %s\n' "$validation_kind"
