#!/usr/bin/env python3
"""Small, local, addressed mail ledger. No network, agent launch, or task execution."""

import argparse
import contextlib
import datetime
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys
import tempfile
import uuid

PROTOCOL = "handoff-mail/0.1"
MAX_BYTES = 1024 * 1024
IDENTITY = re.compile(r"[a-zA-Z0-9.-]+/[a-zA-Z0-9.-]+/[a-zA-Z0-9.-]+\Z")
KINDS = {"message", "delivery", "ack", "execution_acceptance", "result", "acceptance"}
COMMON_FIELDS = {"protocol", "kind", "actor", "event_id", "message_id", "request_id",
                 "revision", "body", "created_at", "sha256"}
RECEIPT_FIELDS = {"message_sender", "message_sha256", "outcome", "attempt_id"}


class MailError(Exception):
    pass


def identity(value):
    if not isinstance(value, str) or not IDENTITY.fullmatch(value) or any(x in (".", "..") for x in value.split("/")):
        raise MailError("Identity must be provider/host-label/session-id using letters, digits, dots or hyphens")
    return value


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False,
                                     separators=(",", ":")).encode()).hexdigest()


def header(actor):
    return f"# Agent outbox: {actor}\n\nProtocol: {PROTOCOL}; parent: coordination contract 1.2.\nOnly this actor writes this outbox.\n\n"


def render(actor, events):
    return header(actor) + "".join(
        f"## {e['event_id']} ({e['kind']})\n\n```json\n" +
        json.dumps(e, indent=2, ensure_ascii=False, sort_keys=True) + "\n```\n\n"
        for e in events)


def event_payload(event):
    return {k: v for k, v in event.items() if k not in ("created_at", "sha256")}


def uuid_text(value, field):
    try:
        valid = isinstance(value, str) and str(uuid.UUID(value)) == value
    except ValueError:
        valid = False
    if not valid:
        raise MailError(f"{field} must be a canonical UUID string")


def receipt_id(actor, kind, sender, message_id, attempt_id):
    return str(uuid.uuid5(uuid.NAMESPACE_URL,
                         f"{PROTOCOL}:{actor}:{kind}:{sender}:{message_id}:{attempt_id or ''}"))


def validate_event(event):
    """Validate structure independently of its checksum, before indexing any fields."""
    if not isinstance(event, dict) or not all(isinstance(k, str) for k in event):
        raise MailError("Event must be an object with string keys")
    kind = event.get("kind")
    if not isinstance(kind, str) or kind not in KINDS:
        raise MailError("Event has missing/unknown kind")
    required = COMMON_FIELDS | ({"to"} if kind == "message" else RECEIPT_FIELDS)
    allowed = required | ({"completion_owner"} if kind == "message" else set())
    missing, unknown = required - event.keys(), event.keys() - allowed
    if missing or unknown:
        raise MailError(f"Invalid {kind} fields; missing={sorted(missing)}, unknown={sorted(unknown)}")
    if event["protocol"] != PROTOCOL:
        raise MailError("Unsupported protocol")
    identity(event["actor"])
    for field in ("event_id", "message_id"):
        uuid_text(event[field], field)
    for field in ("request_id", "body"):
        if not isinstance(event[field], str) or not event[field].strip():
            raise MailError(f"{field} must be a nonempty string")
    if type(event["revision"]) is not int or event["revision"] < 1:
        raise MailError("revision must be a positive integer, not a boolean")
    stamp = event["created_at"]
    try:
        if not isinstance(stamp, str) or datetime.datetime.fromisoformat(stamp.replace("Z", "+00:00")).utcoffset() is None:
            raise ValueError()
    except ValueError as exc:
        raise MailError("created_at must be an ISO timestamp with timezone") from exc
    hashes = ("sha256",) if kind == "message" else ("sha256", "message_sha256")
    for field in hashes:
        if not isinstance(event[field], str) or not re.fullmatch(r"[0-9a-f]{64}", event[field]):
            raise MailError(f"{field} must be a lowercase SHA-256 string")
    if kind == "message":
        identity(event["to"])
        if event["to"] == event["actor"] or event["event_id"] != event["message_id"]:
            raise MailError("Message needs a different recipient and event_id equal to message_id")
        if "completion_owner" in event:
            identity(event["completion_owner"])
    else:
        identity(event["message_sender"])
        outcome, attempt = event["outcome"], event["attempt_id"]
        if kind == "ack":
            valid = outcome is None and attempt is None
        elif kind == "delivery":
            valid = (isinstance(outcome, str) and outcome in ("queued", "delivered", "uncertain", "blocked")
                     and isinstance(attempt, str) and bool(attempt.strip()))
        elif kind == "result":
            valid = isinstance(outcome, str) and outcome in ("completed", "blocked", "declined", "superseded", "cancelled") and attempt is None
        else:
            valid = outcome == "accepted" and attempt is None
        if not valid:
            raise MailError(f"Invalid {kind} outcome/attempt_id")
        if event["event_id"] != receipt_id(event["actor"], kind, event["message_sender"], event["message_id"], attempt):
            raise MailError("Receipt event_id does not match its immutable message reference")
    if event["sha256"] != digest(event_payload(event)):
        raise MailError("Event checksum mismatch")


def safe_read(path):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd, "r", encoding="utf-8") as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_size > MAX_BYTES:
            raise MailError(f"Not a bounded regular mail file: {path}")
        return stream.read()


def decode(path):
    text = safe_read(path)
    blocks = re.findall(r"```json\n(.*?)\n```\n\n", text, re.S)
    try:
        actor = identity(text.splitlines()[0].removeprefix("# Agent outbox: "))
        events = [json.loads(block) for block in blocks]
        seen = set()
        for event in events:
            validate_event(event)
            if event["actor"] != actor:
                raise MailError(f"Event actor does not own outbox: {path}")
            if event["event_id"] in seen:
                raise MailError(f"Duplicate event in {path}")
            seen.add(event["event_id"])
        if render(actor, events) != text or path.name != actor.replace("/", "__") + ".md":
            raise MailError(f"Malformed or partially written outbox: {path}")
        return actor, events
    except (ValueError, KeyError, IndexError, TypeError, AttributeError) as exc:
        raise MailError(f"Invalid outbox: {path}: {exc}") from exc


class Mailbox:
    def __init__(self, root):
        self.root = Path(os.path.abspath(root))
        for path in (self.root, *self.root.parents):
            if path.is_symlink():
                raise MailError(f"Symlink root/ancestor refused: {path}")
        info = self.root.stat()
        if not stat.S_ISDIR(info.st_mode) or info.st_uid != os.getuid() or info.st_mode & 0o022:
            raise MailError("Exchange must be an existing directory owned by this OS user, without group/world write")

    def path(self, actor):
        return self.root / (identity(actor).replace("/", "__") + ".md")

    def events(self):
        result = []
        for path in sorted(self.root.glob("*.md")):
            # Exchange directories contain only actor outboxes, not instructions/docs.
            _, events = decode(path)
            result.extend(events)
        return result

    def message(self, sender, message_id):
        candidates = [e for e in self.events() if e["kind"] == "message" and
                      e["actor"] == sender and e["message_id"] == message_id]
        if len(candidates) != 1:
            raise MailError("Expected exactly one persisted message for sender + message ID")
        return candidates[0]

    def related(self, message):
        events = [e for e in self.events() if e["kind"] != "message" and
                  e.get("message_sender") == message["actor"] and
                  e.get("message_id") == message["message_id"]]
        for event in events:
            if event.get("message_sha256") != message["sha256"]:
                raise MailError("Receipt references different message bytes")
            if event["request_id"] != message["request_id"] or event["revision"] != message["revision"]:
                raise MailError("Receipt references a different request ID/revision")
            if event["kind"] in ("ack", "execution_acceptance", "result") and event["actor"] != message["to"]:
                raise MailError("Receipt was not authored by the addressed recipient")
            if event["kind"] == "acceptance" and event["actor"] != message.get("completion_owner"):
                raise MailError("Acceptance was not authored by the named completion owner")
        return events

    def append(self, actor, event):
        # This check protects against accidental impersonation in a live Codex turn.
        # Same-UID files are not a cryptographic identity/security boundary.
        live_id = os.environ.get("CODEX_THREAD_ID")
        if live_id and actor != f"codex/{actor.split('/')[1]}/{live_id}":
            raise MailError("Actor does not match this live CODEX_THREAD_ID; peer outboxes are read-only")
        path = self.path(actor)
        lock = path.with_suffix(".lock")
        fd = os.open(lock, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, "r+") as stream:
            fcntl.flock(stream, fcntl.LOCK_EX)
            if path.is_symlink():
                raise MailError(f"Symlink outbox refused: {path}")
            old = [] if not path.exists() else decode(path)[1]
            payload = event_payload(event)
            for previous in old:
                if previous["event_id"] == event["event_id"]:
                    if event_payload(previous) != payload:
                        raise MailError("Idempotency conflict: event ID already binds different content")
                    return {"written": False, "path": str(path), "event": previous}
            event = dict(payload, created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                         sha256=digest(payload))
            validate_event(event)
            encoded = render(actor, old + [event]).encode()
            if len(encoded) > MAX_BYTES:
                raise MailError("Outbox limit reached; retain records and arrange owner-approved archival")
            tmp_fd, temporary = tempfile.mkstemp(prefix=".mail-", dir=self.root)
            try:
                with os.fdopen(tmp_fd, "wb") as out:
                    out.write(encoded)
                    out.flush()
                    os.fsync(out.fileno())
                os.replace(temporary, path)
                directory = os.open(self.root, os.O_RDONLY | os.O_DIRECTORY)
                try:
                    os.fsync(directory)
                finally:
                    os.close(directory)
            finally:
                with contextlib.suppress(FileNotFoundError):
                    os.unlink(temporary)
            return {"written": True, "path": str(path), "event": event}

    def send(self, actor, recipient, message_id, request_id, revision, body, completion_owner=None):
        identity(actor)
        identity(recipient)
        if actor == recipient:
            raise MailError("Sender and recipient must differ")
        if (type(revision) is not int or revision < 1 or not isinstance(request_id, str)
                or not request_id.strip() or not isinstance(body, str) or not body.strip()):
            raise MailError("Request ID, positive revision and nonempty body are required")
        uuid_text(message_id, "message_id")
        event = dict(protocol=PROTOCOL, kind="message", actor=actor,
                     event_id=message_id, message_id=message_id, to=recipient,
                     request_id=request_id, revision=revision, body=body)
        # Omit when absent: old messages/retries keep their original immutable bytes.
        if completion_owner is not None:
            event["completion_owner"] = identity(completion_owner)
        return self.append(actor, event)

    def receipt(self, actor, sender, message_id, kind, body, outcome=None, attempt_id=None):
        identity(actor)
        message = self.message(identity(sender), message_id)
        if kind not in ("ack", "execution_acceptance", "result", "delivery", "acceptance"):
            raise MailError("Unknown receipt kind")
        if kind in ("ack", "execution_acceptance", "result") and message["to"] != actor:
            raise MailError("Only the addressed recipient may ACK, accept execution or finish this message")
        related = self.related(message)
        if kind == "execution_acceptance":
            # A scope agreement is not an executor lock or a new authority grant.
            if not any(e["kind"] == "ack" for e in related):
                raise MailError("ACK the exact message before accepting execution")
            if outcome != "accepted":
                raise MailError("Invalid execution acceptance outcome")
            if (any(e["kind"] == "result" for e in related)
                    and not any(e["kind"] == "execution_acceptance" for e in related)):
                raise MailError("Cannot retrofit execution acceptance after a terminal result")
        if kind == "acceptance":
            if actor != message.get("completion_owner"):
                raise MailError("Only the explicitly named completion owner may accept work")
            if not any(e["kind"] == "result" and e["outcome"] == "completed" for e in related):
                raise MailError("Completed recipient result required before acceptance")
            if outcome != "accepted":
                raise MailError("Invalid acceptance outcome")
        if kind == "result" and not any(e["kind"] == "ack" for e in related):
            raise MailError("ACK the exact message before recording a result")
        if kind == "result" and outcome not in ("completed", "blocked", "declined", "superseded", "cancelled"):
            raise MailError("Invalid result outcome")
        if kind == "delivery" and (outcome not in ("queued", "delivered", "uncertain", "blocked") or not attempt_id):
            raise MailError("Delivery needs an attempt ID and queued/delivered/uncertain/blocked outcome")
        if not isinstance(body, str) or not body.strip():
            raise MailError("Receipt needs evidence or an explanation")
        event_id = receipt_id(actor, kind, sender, message_id, attempt_id)
        return self.append(actor, dict(protocol=PROTOCOL, actor=actor, kind=kind,
                           event_id=event_id, message_sender=sender, message_id=message_id,
                           message_sha256=message["sha256"], request_id=message["request_id"],
                           revision=message["revision"], body=body, outcome=outcome,
                           attempt_id=attempt_id))

    def status(self, message):
        related = self.related(message)
        ack = next((e for e in related if e["kind"] == "ack"), None)
        execution_acceptance = next((e for e in related if e["kind"] == "execution_acceptance"), None)
        result = next((e for e in related if e["kind"] == "result"), None)
        acceptance = next((e for e in related if e["kind"] == "acceptance"), None)
        if result and not ack:
            raise MailError("Result exists without recipient ACK")
        if execution_acceptance and not ack:
            raise MailError("Execution acceptance exists without recipient ACK")
        if acceptance and (not result or result["outcome"] != "completed"):
            raise MailError("Acceptance exists without completed recipient result")
        newer = [dict(message_id=e["message_id"], revision=e["revision"]) for e in self.events()
                 if e["kind"] == "message" and e["actor"] == message["actor"] and
                 e["to"] == message["to"] and e["request_id"] == message["request_id"] and
                 e["revision"] > message["revision"]]
        return {"message": message, "storage": "persisted", "ack": ack, "result": result,
                "execution_acceptance": execution_acceptance,
                "execution_acceptance_state": "accepted" if execution_acceptance else "unverified",
                "acceptance": acceptance, "acceptance_state": "accepted" if acceptance else "unverified",
                "newer_revisions": newer, "requires_scope_reconciliation": bool(newer),
                "delivery_reports": [e for e in related if e["kind"] == "delivery"],
                "work_state": result["outcome"] if result else "acknowledged" if ack else "pending"}

    def inbox(self, actor, include_closed=False):
        messages = [e for e in self.events() if e["kind"] == "message" and e["to"] == actor]
        statuses = [self.status(m) for m in messages]
        return [s for s in statuses if include_closed or not s["result"] or s["work_state"] == "blocked"]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--actor", required=True, help="Exact provider/host-label/session-id")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("path")
    inbox = sub.add_parser("inbox")
    inbox.add_argument("--all", action="store_true")
    send = sub.add_parser("send")
    send.add_argument("--to", required=True)
    send.add_argument("--message-id", required=True, help="Fresh UUID, reused on retries")
    send.add_argument("--request-id", required=True)
    send.add_argument("--revision", type=int, required=True)
    send.add_argument("--body-file", required=True, type=Path)
    send.add_argument("--completion-owner", help="Verified existing completion owner; grants no authority itself")
    for command in ("ack", "accept-execution", "finish", "delivery", "accept", "status"):
        p = sub.add_parser(command)
        p.add_argument("--sender", required=True)
        p.add_argument("--message-id", required=True)
        if command != "status":
            p.add_argument("--text", required=True)
        if command == "finish":
            p.add_argument("--outcome", required=True, choices=("completed", "blocked", "declined", "superseded", "cancelled"))
        if command == "delivery":
            p.add_argument("--outcome", required=True, choices=("queued", "delivered", "uncertain", "blocked"))
            p.add_argument("--attempt-id", required=True)
    args = parser.parse_args(argv)
    try:
        actor = identity(args.actor)
        box = Mailbox(args.root)
        if args.command == "path":
            result = {"outbox": str(box.path(actor))}
        elif args.command == "inbox":
            result = box.inbox(actor, args.all)
        elif args.command == "send":
            result = box.send(actor, args.to, args.message_id, args.request_id, args.revision,
                              safe_read(args.body_file), args.completion_owner)
        elif args.command == "status":
            result = box.status(box.message(args.sender, args.message_id))
        else:
            result = box.receipt(actor, args.sender, args.message_id,
                                 {"finish": "result", "accept": "acceptance",
                                  "accept-execution": "execution_acceptance"}.get(args.command, args.command),
                                 args.text, "accepted" if args.command in ("accept", "accept-execution") else getattr(args, "outcome", None),
                                 getattr(args, "attempt_id", None))
        print(json.dumps(result, indent=2, ensure_ascii=False, sort_keys=True))
        return 0
    except (MailError, OSError, ValueError) as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
