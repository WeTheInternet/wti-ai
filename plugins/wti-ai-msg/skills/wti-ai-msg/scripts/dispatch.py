#!/usr/bin/env python3
"""Foreground local queue adapter. No service, timer, automatic retry or task execution."""

import argparse
import datetime as dt
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import uuid

# Load the sibling helper explicitly, never Python's standard-library mailbox module.
HELPER = Path(__file__).resolve().with_name("mailbox.py")
spec = importlib.util.spec_from_file_location("wti_ai_msg", HELPER)
mail = importlib.util.module_from_spec(spec)
_bytecode_setting = sys.dont_write_bytecode
try:
    sys.dont_write_bytecode = True
    spec.loader.exec_module(mail)
finally:
    sys.dont_write_bytecode = _bytecode_setting
ADAPTER = "codex-local-queue/1"


def stamp():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def local_thread(actor):
    mail.identity(actor)
    provider, host, thread = actor.split("/")
    if (provider, host) != ("codex", "local"):
        raise mail.MailError("This adapter only addresses verified existing codex/local sessions")
    mail.uuid_text(thread, "local session ID")
    return thread


def actor_guard(actor):
    mail.identity(actor)
    live = os.environ.get("CODEX_THREAD_ID")
    if live and actor != f"codex/local/{live}":
        raise mail.MailError("Dispatcher must use its own local CODEX_THREAD_ID")


def projection(box, message, snapshot=None):
    status = box.status(message, snapshot)
    reports = status["delivery_reports"]
    if status["result"]:
        action = "accepted" if status["acceptance"] else "recover_saved_result"
    elif status["requires_scope_reconciliation"]:
        action = "reconcile_scope"
    elif status["ack"]:
        action = "await_result"
    elif reports:
        action = "reconcile_delivery_no_resend"
    else:
        action = "eligible_for_preflight"
    # Only exact adapter observations get structured interpretation. All other
    # delivery reports remain available, attributed to their original observer.
    observations = []
    for report in reports:
        try:
            data = json.loads(report["body"])
        except (ValueError, TypeError):
            continue
        if (isinstance(data, dict) and data.get("adapter") == ADAPTER
                and report["actor"] == message["actor"]):
            observations.append(dict(data, observer=report["actor"], event_id=report["event_id"]))
    return dict(status, next_action=action, adapter_observations=observations,
                provider_admission="observed" if any(
                    x.get("stage") == "admission" and x.get("provider_message_id") for x in observations
                ) else "unverified",
                activation="observer_reported" if any(x.get("stage") == "activation" for x in observations)
                else "blocked_by_active_writer_report" if any(x.get("active_writer_reported") for x in observations)
                else "unverified")


def scan(box, actor):
    snapshot = box.snapshot()
    return [projection(box, m, snapshot) for m in snapshot.messages.values() if m["actor"] == actor]


def record(box, actor, mid, attempt, stage, outcome, **data):
    body = json.dumps(dict(adapter=ADAPTER, stage=stage, **data), sort_keys=True, ensure_ascii=False)
    return box.receipt(actor, actor, mid, "delivery", body, outcome, f"{attempt}:{stage}")


def preflight(observation, recipient, root, now=None):
    required = {"recipient", "state", "observed_at", "source", "reference", "shared_exchange"}
    if not isinstance(observation, dict) or set(observation) != required:
        raise mail.MailError("Preflight needs exact recipient/state/observed_at/source/reference/shared_exchange fields")
    if not all(isinstance(value, str) and value.strip() for value in observation.values()):
        raise mail.MailError("Preflight fields must be nonempty strings")
    if observation["recipient"] != recipient or observation["shared_exchange"] != str(root):
        raise mail.MailError("Preflight targets a different recipient or exchange")
    if observation["state"] not in ("idle", "busy", "unknown"):
        raise mail.MailError("Preflight state must be idle, busy or unknown")
    try:
        seen = dt.datetime.fromisoformat(observation["observed_at"].replace("Z", "+00:00"))
        age = ((now or dt.datetime.now(dt.timezone.utc)) - seen).total_seconds()
        if age < 0 or age > 300:
            raise ValueError()
    except (ValueError, TypeError) as exc:
        raise mail.MailError("Preflight must have a timezone and be at most five minutes old") from exc
    return observation["state"]


def wake_prompt(box, message):
    # This notification is only for an enrolled local recipient with demonstrated
    # shared-file access. It contains identity and a pointer, never shell commands.
    return (
        f"Addressed wti-ai-msg notification. To: {message['to']}; from: {message['actor']}. "
        f"Message: {message['message_id']}; request: {message['request_id']}; revision: {message['revision']}; "
        f"payload SHA256: {message['sha256']}. "
        f"Use the existing helper {HELPER} and skill {HELPER.parent.parent / 'SKILL.md'}. "
        f"Your writable outbox: {box.path(message['to'])}. Peer outbox, read-only: {box.path(message['actor'])}. "
        "At a safe boundary, verify your identity, read the exact message and current scope, "
        "and reconcile prior receipts/results. Only you author ACK, accept-execution and result. "
        "Latest direct user instructions take precedence. Recover saved work; do not repeat it. "
        "If busy or blocked, retain the message; no takeover, new session or callback is required."
    )


def dispatch(box, actor, mid, expected_hash, observation, executable, cwd, scope_current, runner=subprocess.run):
    actor_guard(actor)
    if not scope_current:
        raise mail.MailError("Reconcile current user scope before passing --scope-current")
    # Held across journaling AND the ordinary queue child. This is dispatch exclusion
    # only, not a lock over the recipient's model/tools or an external effect.
    lock = box.root / (actor.replace("/", "__") + ".dispatch.lock")
    fd = os.open(lock, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW | os.O_NONBLOCK, 0o600)
    with os.fdopen(fd, "r+") as stream:
        if not stat.S_ISREG(os.fstat(stream.fileno()).st_mode):
            raise mail.MailError("Dispatch lock must be a regular file")
        try:
            fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise mail.MailError("Another foreground dispatch is active; inspect after it finishes") from exc
        snapshot = box.snapshot()
        message = box.message(actor, mid, snapshot)
        if message["sha256"] != expected_hash:
            raise mail.MailError("Message hash changed or incorrect selection; no queue call")
        status = projection(box, message, snapshot)
        if status["next_action"] != "eligible_for_preflight":
            return status
        thread = local_thread(message["to"])
        state = preflight(observation, message["to"], box.root)
        if state != "idle":
            return dict(status, next_action="deferred_" + state, preflight=observation)
        executable, cwd = Path(executable), Path(cwd)
        if not executable.is_absolute() or not executable.is_file() or not os.access(executable, os.X_OK):
            raise mail.MailError("Provide the observed absolute installed Codex executable")
        if not cwd.is_absolute() or not cwd.is_dir():
            raise mail.MailError("Provide the verified existing target working directory")
        prompt = wake_prompt(box, message)
        command = [str(executable), "queue", "--thread", thread, "--message", prompt, "--resume"]
        attempt = "queue-" + str(uuid.uuid4())
        # Recheck after preflight/path validation, immediately before journaling.
        # This narrows the stale-scope window; separate outboxes cannot fence it.
        snapshot = box.snapshot()
        message = box.message(actor, mid, snapshot)
        if message["sha256"] != expected_hash:
            raise mail.MailError("Message hash changed before dispatch intent")
        status = projection(box, message, snapshot)
        if status["next_action"] != "eligible_for_preflight":
            return status
        # Publish uncertainty BEFORE the external effect. Crash before/after queue
        # cannot make a later invocation assume it is safe to enqueue again.
        record(box, actor, mid, attempt, "intent", "uncertain", command=command, cwd=str(cwd),
               prompt_sha256=hashlib.sha256(prompt.encode()).hexdigest(), preflight=observation,
               note="Intent persisted; submission/activation still unverified")
        try:
            result = runner(command, cwd=str(cwd), capture_output=True, text=True, timeout=20)
        except (OSError, subprocess.TimeoutExpired) as exc:
            record(box, actor, mid, attempt, "uncertain", "uncertain", error=str(exc),
                   note="Reconcile target/provider and saved results; never blind resend")
            return projection(box, box.message(actor, mid))
        # Exact documented-in-this-install receipt shape; unfamiliar success is
        # uncertain. Even a recognized receipt says nothing about turn activation.
        matches = re.findall(r"^Queued message ([0-9a-f-]{36}) for thread ([0-9a-f-]{36})\.$",
                             result.stdout, re.M)
        admitted = len(matches) == 1 and matches[0][1] == thread
        if admitted:
            try:
                mail.uuid_text(matches[0][0], "provider message ID")
            except mail.MailError:
                admitted = False
        stage, outcome = ("admission", "queued") if admitted else ("uncertain", "uncertain")
        record(box, actor, mid, attempt, stage, outcome, returncode=result.returncode,
               stdout=result.stdout, stderr=result.stderr,
               provider_message_id=matches[0][0] if admitted else None,
               active_writer_reported="active writer" in (result.stdout + result.stderr).lower(),
               note="Admission only; warnings/errors may include active-writer or resume failure; no retry")
        return projection(box, box.message(actor, mid))


def observe_activation(box, actor, mid, evidence):
    actor_guard(actor)
    message = box.message(actor, mid)
    required = {"recipient", "message_id", "message_sha256", "source", "turn_id", "observed_at", "detail"}
    if not isinstance(evidence, dict) or set(evidence) != required:
        raise mail.MailError("Activation observation fields do not match the documented schema")
    if not all(isinstance(v, str) and v.strip() for v in evidence.values()):
        raise mail.MailError("Activation evidence values must be nonempty strings")
    if (evidence["recipient"], evidence["message_id"], evidence["message_sha256"]) != (
            message["to"], mid, message["sha256"]):
        raise mail.MailError("Activation evidence references another message/recipient/hash")
    mail.uuid_text(evidence["turn_id"], "observed turn ID")
    try:
        if dt.datetime.fromisoformat(evidence["observed_at"].replace("Z", "+00:00")).utcoffset() is None:
            raise ValueError()
    except ValueError as exc:
        raise mail.MailError("Activation observation needs timezone") from exc
    record(box, actor, mid, "observation-" + mail.digest(evidence), "activation", "delivered", **evidence)
    return projection(box, message)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", required=True)
    parser.add_argument("--actor", required=True)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("scan", help="Read only: pending work and saved results")
    send = commands.add_parser("once", help="Explicitly submit one selected eligible message, at most once")
    send.add_argument("--message-id", required=True)
    send.add_argument("--message-sha256", required=True)
    send.add_argument("--preflight-file", type=Path, required=True)
    send.add_argument("--codex", required=True)
    send.add_argument("--cwd", required=True)
    send.add_argument("--scope-current", action="store_true")
    observe = commands.add_parser("observe-activation", help="Record own observation, never a recipient receipt")
    observe.add_argument("--message-id", required=True)
    observe.add_argument("--evidence-file", type=Path, required=True)
    args = parser.parse_args()
    try:
        box = mail.Mailbox(args.root)
        if args.command == "scan":
            output = scan(box, mail.identity(args.actor))
        elif args.command == "observe-activation":
            output = observe_activation(box, args.actor, args.message_id, json.loads(mail.safe_read(args.evidence_file)))
        else:
            output = dispatch(box, args.actor, args.message_id, args.message_sha256,
                              json.loads(mail.safe_read(args.preflight_file)), args.codex, args.cwd, args.scope_current)
        print(json.dumps(output, indent=2, ensure_ascii=False))
    except (mail.MailError, OSError, ValueError) as exc:
        print(json.dumps({"error": str(exc), "action": "stop_and_reconcile"}), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
