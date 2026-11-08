"""Executable transport evals with synthetic actors only; never contact real agents."""

import concurrent.futures
import errno
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import uuid

SCRIPT = Path(__file__).resolve().parents[1] / "skills/handoff-mail/scripts/mailbox.py"
spec = importlib.util.spec_from_file_location("mailbox_impl", SCRIPT)
mail = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mail)
ALICE, BOB, CAROL = "test/fixture/alice", "test/fixture/bob", "test/fixture/carol"


class MailboxEvals(unittest.TestCase):
    def setUp(self):
        # This is a simulated environment, not a live actor or its exchange.
        self.environment = patch.dict(os.environ, {}, clear=True)
        self.environment.start()
        self.temporary = tempfile.TemporaryDirectory(prefix="mail-eval-", dir=Path(__file__).parent)
        self.root = Path(self.temporary.name)
        self.box = mail.Mailbox(self.root)
        self.mid = str(uuid.uuid4())

    def tearDown(self):
        self.temporary.cleanup()
        self.environment.stop()

    def send(self, sender=ALICE, recipient=BOB, body="Echo synthetic nonce abc123."):
        return self.box.send(sender, recipient, self.mid, "fixture-request", 1, body)

    def ack(self, actor=BOB):
        return self.box.receipt(actor, ALICE, self.mid, "ack", "Read synthetic message.")

    def finish(self, outcome="completed"):
        return self.box.receipt(BOB, ALICE, self.mid, "result", "Synthetic result abc123.", outcome)

    def current(self):
        return self.box.status(self.box.message(ALICE, self.mid))

    def test_persist_ack_and_result_are_independent(self):
        self.send()
        self.assertEqual(self.current()["work_state"], "pending")
        self.assertIsNone(self.current()["ack"])
        with self.assertRaises(mail.MailError):
            self.finish()
        self.ack()
        self.assertEqual(self.current()["work_state"], "acknowledged")
        self.assertIsNone(self.current()["result"])
        self.finish()
        self.assertEqual(self.current()["work_state"], "completed")
        self.assertEqual(self.box.inbox(BOB), [])
        self.assertEqual(len(self.box.inbox(BOB, True)), 1)

    def test_observer_cannot_ack_or_finish(self):
        self.send()
        self.assertEqual(self.box.inbox(CAROL), [])
        self.assertEqual(self.current()["work_state"], "pending")
        with self.assertRaises(mail.MailError):
            self.ack(CAROL)
        with self.assertRaises(mail.MailError):
            self.box.receipt(CAROL, ALICE, self.mid, "result", "Not mine", "completed")
        self.assertFalse(self.box.path(CAROL).exists())

    def test_message_retry_preserves_bytes_and_time(self):
        first = self.send()
        before = self.box.path(ALICE).read_bytes()
        second = self.send()
        self.assertFalse(second["written"])
        self.assertEqual(first["event"], second["event"])
        self.assertEqual(before, self.box.path(ALICE).read_bytes())

    def test_conflicting_message_id_does_not_overwrite(self):
        self.send()
        before = self.box.path(ALICE).read_bytes()
        with self.assertRaises(mail.MailError):
            self.send(body="Different task")
        self.assertEqual(before, self.box.path(ALICE).read_bytes())

    def test_receipt_retries_are_idempotent(self):
        self.send()
        self.assertTrue(self.ack()["written"])
        self.assertFalse(self.ack()["written"])
        self.assertTrue(self.finish()["written"])
        self.assertFalse(self.finish()["written"])
        self.assertEqual(len(self.box.related(self.box.message(ALICE, self.mid))), 2)

    def test_changed_receipt_is_not_rewritten(self):
        self.send()
        self.ack()
        with self.assertRaises(mail.MailError):
            self.box.receipt(BOB, ALICE, self.mid, "ack", "Contradictory ACK")

    def test_offline_message_survives_reopen(self):
        self.send()
        reopened = mail.Mailbox(self.root)
        inbox = reopened.inbox(BOB)
        self.assertEqual(len(inbox), 1)
        self.assertEqual(inbox[0]["work_state"], "pending")
        self.assertEqual(inbox[0]["delivery_reports"], [])

    def test_delivery_report_cannot_imply_ack(self):
        self.send()
        for attempt, outcome in (("one", "queued"), ("two", "uncertain")):
            self.box.receipt(CAROL, ALICE, self.mid, "delivery", "Simulated provider receipt", outcome, attempt)
        status = self.current()
        self.assertEqual(status["work_state"], "pending")
        self.assertIsNone(status["ack"])
        self.assertEqual([e["actor"] for e in status["delivery_reports"]], [CAROL, CAROL])

    def test_interrupted_replace_keeps_original(self):
        self.send()
        original = self.box.path(ALICE).read_bytes()
        with patch.object(mail.os, "replace", side_effect=OSError("simulated interruption")):
            with self.assertRaises(OSError):
                self.box.send(ALICE, BOB, str(uuid.uuid4()), "second", 1, "Second message")
        self.assertEqual(original, self.box.path(ALICE).read_bytes())
        self.assertEqual(list(self.root.glob(".mail-*")), [])
        self.assertEqual(len(self.box.inbox(BOB)), 1)

    def test_denied_temp_creation_preserves_own_and_peer_outboxes(self):
        self.send()
        self.ack()
        own = self.box.path(ALICE).read_bytes()
        peer = self.box.path(BOB).read_bytes()
        # Simulated permission boundary; this does not test a real sandbox policy.
        with patch.object(mail.tempfile, "mkstemp", side_effect=PermissionError("simulated temp denial")):
            with self.assertRaises(PermissionError):
                self.box.send(ALICE, BOB, str(uuid.uuid4()), "next", 1, "New message")
        self.assertEqual(self.box.path(ALICE).read_bytes(), own)
        self.assertEqual(self.box.path(BOB).read_bytes(), peer)
        self.assertEqual(list(self.root.glob(".mail-*")), [])

    def test_denied_replace_preserves_outboxes_and_cleans_temp(self):
        self.send()
        self.ack()
        own = self.box.path(ALICE).read_bytes()
        peer = self.box.path(BOB).read_bytes()
        with patch.object(mail.os, "replace", side_effect=PermissionError("simulated replace denial")):
            with self.assertRaises(PermissionError):
                self.box.send(ALICE, BOB, str(uuid.uuid4()), "next", 1, "New message")
        self.assertEqual(self.box.path(ALICE).read_bytes(), own)
        self.assertEqual(self.box.path(BOB).read_bytes(), peer)
        self.assertEqual(list(self.root.glob(".mail-*")), [])

    def test_changed_payload_checksum_is_rejected(self):
        self.send()
        path = self.box.path(ALICE)
        path.write_text(path.read_text().replace("abc123", "abc999"))
        with self.assertRaises(mail.MailError):
            self.box.inbox(BOB)

    def test_uncertain_write_after_replace_is_reconciled_by_retry(self):
        real_fsync = mail.os.fsync
        calls = []
        def fail_directory_sync(fd):
            calls.append(fd)
            if len(calls) == 2:
                raise OSError("simulated post-replace sync uncertainty")
            return real_fsync(fd)
        with patch.object(mail.os, "fsync", side_effect=fail_directory_sync):
            with self.assertRaises(OSError):
                self.send()
        self.assertEqual(len(self.box.inbox(BOB)), 1)
        self.assertFalse(self.send()["written"])
        self.assertEqual(len(self.box.inbox(BOB)), 1)

    def test_fifo_outbox_is_rejected_without_waiting_for_a_writer(self):
        os.mkfifo(self.box.path(ALICE))
        with self.assertRaises(mail.MailError):
            self.box.inbox(BOB)

    def test_partial_record_is_not_silently_skipped(self):
        self.send()
        path = self.box.path(ALICE)
        with path.open("a") as out:
            out.write("## partial event\n```json\n{")
        corrupt = path.read_bytes()
        with self.assertRaises(mail.MailError):
            self.box.inbox(BOB)
        self.assertEqual(path.read_bytes(), corrupt)

    def test_checksum_valid_message_missing_recipient_is_rejected(self):
        self.send()
        path = self.box.path(ALICE)
        event = self.box.message(ALICE, self.mid)
        del event["to"]
        event["sha256"] = mail.digest(mail.event_payload(event))
        path.write_text(mail.render(ALICE, [event]))
        with self.assertRaises(mail.MailError):
            mail.decode(path)

    def valid_kinds(self):
        self.box.send(ALICE, BOB, self.mid, "fixture-request", 1, "Task", CAROL)
        self.ack()
        self.box.receipt(BOB, ALICE, self.mid, "execution_acceptance", "Scope agreed", "accepted")
        self.finish()
        self.box.receipt(CAROL, ALICE, self.mid, "delivery", "Synthetic receipt", "delivered", "one")
        self.box.receipt(CAROL, ALICE, self.mid, "acceptance", "Synthetic acceptance", "accepted")
        return {event["kind"]: event for event in self.box.events()}

    def rehash(self, event):
        event["sha256"] = mail.digest(mail.event_payload(event))
        return event

    def test_all_event_kinds_require_their_contract_fields_even_with_valid_hash(self):
        events = self.valid_kinds()
        common = ("actor", "protocol", "kind", "event_id", "message_id", "request_id", "revision", "body", "created_at", "sha256")
        for kind, original in events.items():
            required = common + (("to",) if kind == "message" else ("message_sender", "message_sha256", "outcome", "attempt_id"))
            for field in required:
                with self.subTest(kind=kind, missing=field):
                    malformed = dict(original)
                    del malformed[field]
                    if field != "sha256":
                        self.rehash(malformed)
                    with self.assertRaisesRegex(mail.MailError, "missing"):
                        mail.validate_event(malformed)

    def test_checksum_valid_missing_body_rejected_by_decoder_for_every_kind(self):
        for kind, original in self.valid_kinds().items():
            with self.subTest(kind=kind):
                malformed = dict(original)
                del malformed["body"]
                self.rehash(malformed)
                path = self.box.path(original["actor"])
                path.write_text(mail.render(original["actor"], [malformed]))
                with self.assertRaisesRegex(mail.MailError, "missing"):
                    mail.decode(path)

    def test_schema_rejects_wrong_types_and_invalid_values_with_valid_checksums(self):
        events = self.valid_kinds()
        cases = [
            ("message", "revision", True), ("message", "revision", "1"),
            ("message", "revision", 0), ("message", "revision", 1.5),
            ("message", "to", None), ("message", "to", []), ("message", "to", "../escape"),
            ("message", "body", []), ("message", "request_id", ""),
            ("message", "completion_owner", {}), ("message", "created_at", "2026-11-08T12:00:00"),
            ("message", "created_at", 123), ("message", "message_id", "not-a-uuid"),
            ("ack", "outcome", "completed"), ("ack", "attempt_id", "not-null"),
            ("result", "outcome", "accepted"), ("result", "outcome", []),
            ("delivery", "attempt_id", None), ("delivery", "attempt_id", ""),
            ("delivery", "outcome", "completed"), ("acceptance", "outcome", "completed"),
            ("execution_acceptance", "outcome", "completed"), ("execution_acceptance", "attempt_id", "retry"),
            ("result", "message_sha256", "bad-hash"), ("ack", "message_sender", "invalid"),
        ]
        for kind, field, value in cases:
            with self.subTest(kind=kind, field=field, value=value):
                malformed = dict(events[kind], **{field: value})
                self.rehash(malformed)
                with self.assertRaises(mail.MailError):
                    mail.validate_event(malformed)

    def test_unknown_fields_and_nonobjects_are_rejected(self):
        original = self.send()["event"]
        for value in (None, [], "message", 1, self.rehash(dict(original, unexpected="field"))):
            with self.subTest(value=value):
                with self.assertRaises(mail.MailError):
                    mail.validate_event(value)

    def test_receipt_request_revision_must_match_referenced_message(self):
        self.send()
        self.ack()
        event = self.current()["ack"]
        event["revision"] = 2
        self.rehash(event)
        self.box.path(BOB).write_text(mail.render(BOB, [event]))
        with self.assertRaisesRegex(mail.MailError, "request ID/revision"):
            self.current()

    def test_invalid_new_event_is_never_published(self):
        self.send()
        before = self.box.path(ALICE).read_bytes()
        with self.assertRaises(mail.MailError):
            self.box.send(ALICE, BOB, str(uuid.uuid4()), "fixture-request", True, "Invalid revision")
        self.assertEqual(before, self.box.path(ALICE).read_bytes())

    def test_symlink_outbox_is_not_followed(self):
        self.send()
        target = self.root / "held-original"
        self.box.path(ALICE).rename(target)
        self.box.path(ALICE).symlink_to(target)
        with self.assertRaises((mail.MailError, OSError)):
            self.send()

    def test_symlink_exchange_is_refused(self):
        alias = self.root / "alias"
        alias.symlink_to(self.root, target_is_directory=True)
        with self.assertRaises(mail.MailError):
            mail.Mailbox(alias)

    def test_live_session_identity_cannot_impersonate(self):
        with patch.dict(os.environ, {"CODEX_THREAD_ID": "real-session"}):
            with self.assertRaises(mail.MailError):
                self.send()
            self.box.send("codex/local/real-session", BOB, self.mid, "nonce", 1, "Hello")
        self.assertFalse(self.box.path(ALICE).exists())

    def test_user_override_is_preserved_as_supersession(self):
        self.send()
        original = self.box.path(ALICE).read_bytes()
        self.ack()
        self.finish("superseded")
        self.assertEqual(self.current()["work_state"], "superseded")
        self.assertEqual(original, self.box.path(ALICE).read_bytes())

    def test_same_uuid_is_scoped_by_sender(self):
        self.send()
        self.send(sender=CAROL, body="Different sender, different request identity")
        self.assertEqual(len(self.box.inbox(BOB)), 2)
        self.ack()
        other = self.box.status(self.box.message(CAROL, self.mid))
        self.assertIsNone(other["ack"])

    def test_multiline_and_fences_are_data(self):
        body = 'hello\n```json\n{"pretend":"event"}\n```\n$(never execute)\nUnicode: \u03bb'
        self.send(body=body)
        self.assertEqual(self.box.inbox(BOB)[0]["message"]["body"], body)

    def test_group_writable_exchange_refused(self):
        self.root.chmod(0o770)
        with self.assertRaises(mail.MailError):
            mail.Mailbox(self.root)
        self.root.chmod(0o700)

    def test_blocked_attempt_stays_visible(self):
        self.send()
        self.ack()
        self.finish("blocked")
        self.assertEqual(self.box.inbox(BOB)[0]["work_state"], "blocked")

    def test_concurrent_same_writer_has_no_lost_messages(self):
        body = self.root / "input.txt"
        body.write_text("Synthetic concurrent message")
        def send_one(_):
            cmd = [sys.executable, str(SCRIPT), "--root", str(self.root), "--actor", ALICE,
                   "send", "--to", BOB, "--message-id", str(uuid.uuid4()), "--request-id",
                   "concurrency", "--revision", "1", "--body-file", str(body)]
            return subprocess.run(cmd, env={"PYTHONDONTWRITEBYTECODE": "1"}, capture_output=True, text=True)
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(send_one, range(12)))
        for result in results:
            self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len(self.box.inbox(BOB)), 12)

    def test_completed_does_not_mean_accepted(self):
        self.box.send(ALICE, BOB, self.mid, "fixture-request", 1, "Task", CAROL)
        with self.assertRaises(mail.MailError):
            self.box.receipt(CAROL, ALICE, self.mid, "acceptance", "Reviewed", "accepted")
        self.ack()
        self.finish()
        self.assertEqual(self.current()["work_state"], "completed")
        self.assertEqual(self.current()["acceptance_state"], "unverified")
        with self.assertRaises(mail.MailError):
            self.box.receipt(BOB, ALICE, self.mid, "acceptance", "I approve myself", "accepted")
        receipt = self.box.receipt(CAROL, ALICE, self.mid, "acceptance", "Verified exact result against criteria", "accepted")
        self.assertTrue(receipt["written"])
        self.assertEqual(self.current()["acceptance_state"], "accepted")
        self.assertFalse(self.box.receipt(CAROL, ALICE, self.mid, "acceptance", "Verified exact result against criteria", "accepted")["written"])

    def test_recipient_execution_acceptance_is_separate_and_idempotent(self):
        self.box.send(ALICE, BOB, self.mid, "fixture-request", 1, "Task", CAROL)
        self.ack()
        self.assertEqual(self.current()["execution_acceptance_state"], "unverified")
        with self.assertRaises(mail.MailError):
            self.box.receipt(CAROL, ALICE, self.mid, "execution_acceptance", "Not my scope", "accepted")
        accepted = self.box.receipt(BOB, ALICE, self.mid, "execution_acceptance", "Scope agreed", "accepted")
        self.assertTrue(accepted["written"])
        status = self.current()
        self.assertEqual(status["execution_acceptance_state"], "accepted")
        self.assertEqual(status["work_state"], "acknowledged")
        self.assertEqual(status["acceptance_state"], "unverified")
        self.assertIsNone(status["result"])
        self.finish()
        self.assertFalse(self.box.receipt(BOB, ALICE, self.mid, "execution_acceptance", "Scope agreed", "accepted")["written"])
        self.assertEqual(self.current()["acceptance_state"], "unverified")

    def test_execution_acceptance_requires_ack_and_cannot_be_retrofitted(self):
        self.send()
        with self.assertRaises(mail.MailError):
            self.box.receipt(BOB, ALICE, self.mid, "execution_acceptance", "Scope agreed", "accepted")
        self.ack()
        self.finish()
        before = self.box.path(BOB).read_bytes()
        with self.assertRaises(mail.MailError):
            self.box.receipt(BOB, ALICE, self.mid, "execution_acceptance", "Too late", "accepted")
        self.assertEqual(self.box.path(BOB).read_bytes(), before)
        self.assertEqual(self.current()["execution_acceptance_state"], "unverified")

    def test_accept_execution_cli_and_schema_reject_forged_owner(self):
        self.send()
        self.ack()
        result = subprocess.run([sys.executable, str(SCRIPT), "--root", str(self.root), "--actor", BOB,
                                 "accept-execution", "--sender", ALICE, "--message-id", self.mid,
                                 "--text", "Scope agreed"], capture_output=True, text=True,
                                env={"PYTHONDONTWRITEBYTECODE": "1"})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.current()["execution_acceptance_state"], "accepted")
        forged = dict(self.current()["execution_acceptance"], actor=CAROL)
        forged["event_id"] = mail.receipt_id(CAROL, "execution_acceptance", ALICE, self.mid, None)
        self.rehash(forged)
        self.box.path(CAROL).write_text(mail.render(CAROL, [forged]))
        with self.assertRaisesRegex(mail.MailError, "addressed recipient"):
            self.current()

    def test_crash_after_read_before_ack_recovers_same_request(self):
        self.send()
        code = ('import os, sys; sys.path.insert(0, sys.argv[1]); import mailbox; '
                'box=mailbox.Mailbox(sys.argv[2]); '
                'assert len(box.inbox(sys.argv[3])) == 1; os._exit(72)')
        crashed = subprocess.run([sys.executable, "-c", code, str(SCRIPT.parent), str(self.root), BOB],
                                 env={"PYTHONDONTWRITEBYTECODE": "1"}, capture_output=True, text=True)
        self.assertEqual(crashed.returncode, 72, crashed.stderr)
        self.assertFalse(self.send()["written"])
        recovered = mail.Mailbox(self.root).inbox(BOB)
        self.assertEqual(len(recovered), 1)
        self.assertIsNone(recovered[0]["ack"])
        self.ack()
        self.assertEqual(self.current()["work_state"], "acknowledged")

    def test_saved_result_survives_process_exit_without_notification(self):
        self.send()
        self.ack()
        code = ('import os, sys; sys.path.insert(0, sys.argv[1]); import mailbox; '
                'box=mailbox.Mailbox(sys.argv[2]); '
                'box.receipt(sys.argv[3], sys.argv[4], sys.argv[5], "result", "Saved synthetic result", "completed"); '
                'os._exit(73)')
        crashed = subprocess.run([sys.executable, "-c", code, str(SCRIPT.parent), str(self.root), BOB, ALICE, self.mid],
                                 env={"PYTHONDONTWRITEBYTECODE": "1"}, capture_output=True, text=True)
        self.assertEqual(crashed.returncode, 73, crashed.stderr)
        before = self.box.path(BOB).read_bytes()
        reopened = mail.Mailbox(self.root)
        status = reopened.status(reopened.message(ALICE, self.mid))
        self.assertEqual(status["result"]["body"], "Saved synthetic result")
        self.assertEqual(status["delivery_reports"], [])
        self.assertEqual(reopened.inbox(BOB), [])
        self.assertEqual(reopened.inbox(BOB, True)[0]["result"], status["result"])
        self.assertFalse(self.send()["written"])
        self.assertEqual(self.box.path(BOB).read_bytes(), before)

    def test_disk_full_before_publish_keeps_old_records_and_diagnosis(self):
        self.send()
        self.ack()
        before = {actor: self.box.path(actor).read_bytes() for actor in (ALICE, BOB)}
        with patch.object(mail.os, "fsync", side_effect=OSError(errno.ENOSPC, "synthetic disk full")):
            with self.assertRaises(OSError) as caught:
                self.box.send(ALICE, BOB, str(uuid.uuid4()), "next", 1, "Unpublished record")
        self.assertEqual(caught.exception.errno, errno.ENOSPC)
        for actor, content in before.items():
            self.assertEqual(self.box.path(actor).read_bytes(), content)
        self.assertEqual(list(self.root.glob(".mail-*")), [])

    def test_old_message_does_not_acquire_an_implicit_completion_owner(self):
        original = self.send()["event"]
        self.ack()
        self.finish()
        with self.assertRaises(mail.MailError):
            self.box.receipt(ALICE, ALICE, self.mid, "acceptance", "Implicit owner?", "accepted")
        self.assertEqual(original, self.send()["event"])

    def test_newer_revision_flags_old_work_without_erasing_it(self):
        self.send()
        newer_id = str(uuid.uuid4())
        self.box.send(ALICE, BOB, newer_id, "fixture-request", 2, "Authorized revised scope")
        status = self.current()
        self.assertTrue(status["requires_scope_reconciliation"])
        self.assertEqual(status["newer_revisions"], [{"message_id": newer_id, "revision": 2}])
        self.assertEqual(status["work_state"], "pending")
        self.ack()
        self.finish("superseded")
        self.assertEqual(self.current()["work_state"], "superseded")
        self.assertEqual(self.box.message(ALICE, self.mid)["revision"], 1)

    def test_busy_report_preserves_pending_message(self):
        self.send()
        self.box.receipt(CAROL, ALICE, self.mid, "delivery", "Simulated active-writer rejection; no retry", "blocked", "busy-1")
        self.assertEqual(self.current()["work_state"], "pending")
        self.assertEqual(len(self.box.inbox(BOB)), 1)
        self.assertIsNone(self.current()["result"])

    def test_concurrent_identical_cli_retry_writes_one_message(self):
        body = self.root / "retry.txt"
        body.write_text("Exact retry body")
        cmd = [sys.executable, str(SCRIPT), "--root", str(self.root), "--actor", ALICE,
               "send", "--to", BOB, "--message-id", self.mid, "--request-id", "retry", "--revision", "1", "--body-file", str(body)]
        def retry(_):
            return subprocess.run(cmd, env={"PYTHONDONTWRITEBYTECODE": "1"}, capture_output=True, text=True)
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(retry, range(8)))
        for result in results:
            self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(sum(json.loads(r.stdout)["written"] for r in results), 1)
        self.assertEqual(len(self.box.inbox(BOB)), 1)


if __name__ == "__main__":
    unittest.main()
