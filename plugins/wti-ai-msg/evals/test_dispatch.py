"""Synthetic queue adapter checks. No installed Codex invocation or live recipient."""
import concurrent.futures
import base64
import datetime as dt
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import shutil
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch
import uuid

SCRIPT = Path(__file__).resolve().parents[1] / "skills/wti-ai-msg/scripts/dispatch.py"
spec = importlib.util.spec_from_file_location("dispatch_impl", SCRIPT)
dispatch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dispatch)
mail = dispatch.mail
ALICE = "codex/local/11111111-1111-4111-8111-111111111111"
BOB = "codex/local/22222222-2222-4222-8222-222222222222"
CAROL = "codex/local/33333333-3333-4333-8333-333333333333"
PROVIDER = "44444444-4444-4444-8444-444444444444"


class DispatchEvals(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(os.environ, {}, clear=True)
        self.environment.start()
        self.temp = tempfile.TemporaryDirectory(prefix="dispatch-eval-", dir=Path(__file__).parent)
        self.root = Path(self.temp.name)
        self.box = mail.Mailbox(self.root)
        self.mid = str(uuid.uuid4())
        self.message = self.box.send(ALICE, BOB, self.mid, "synthetic-work", 1, "Echo fixture", ALICE)["event"]
        self.preflight = dict(recipient=BOB, state="idle", observed_at=dispatch.stamp(),
                              source="synthetic reader", reference="fixture status", shared_exchange=str(self.root),
                              queue_without_resume_evidence="synthetic compatible installed route; not a live test")
        self.calls = []

    def tearDown(self):
        self.temp.cleanup()
        self.environment.stop()

    def runner(self, args, **kwargs):
        self.calls.append((args, kwargs))
        return subprocess.CompletedProcess(args, 0,
            f"Queued message {PROVIDER} for thread {BOB.split('/')[-1]}.\n", "")

    def run_once(self, **kw):
        options = dict(box=self.box, actor=ALICE, mid=self.mid, expected_hash=self.message["sha256"],
                       observation=self.preflight, executable=sys.executable, cwd=str(self.root),
                       scope_current=True, runner=self.runner)
        options.update(kw)
        return dispatch.dispatch(**options)

    def finish(self):
        self.box.receipt(BOB, ALICE, self.mid, "ack", "Read fixture")
        self.box.receipt(BOB, ALICE, self.mid, "execution_acceptance", "Accept fixture", "accepted")
        self.box.receipt(BOB, ALICE, self.mid, "result", "Saved fixture result", "completed")

    def test_admission_is_not_activation_ack_result_or_acceptance(self):
        status = self.run_once()
        self.assertEqual(status["provider_admission"], "observed")
        self.assertEqual(status["activation"], "unverified")
        self.assertEqual(status["work_state"], "pending")
        self.assertIsNone(status["ack"])
        self.assertIsNone(status["result"])
        self.assertEqual(status["acceptance_state"], "unverified")
        args, options = self.calls[0]
        self.assertEqual(args[:4], [sys.executable, "queue", "--thread", BOB.split('/')[-1]])
        self.assertNotIn("--resume", args)
        self.assertEqual(len(args), 6)
        self.assertNotIn("shell", options)
        self.assertIn(str(self.box.path(BOB)), args[5])
        self.assertIn(str(self.box.path(ALICE)), args[5])

    def test_repeat_after_admission_does_not_enqueue(self):
        self.run_once()
        before = self.box.path(ALICE).read_bytes()
        self.assertEqual(self.run_once()["next_action"], "reconcile_delivery_no_resend")
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(self.box.path(ALICE).read_bytes(), before)

    def test_timeout_is_uncertain_and_never_blindly_retried(self):
        def timeout(args, **kwargs):
            self.calls.append(args)
            raise subprocess.TimeoutExpired(args, 20)
        status = self.run_once(runner=timeout)
        self.assertEqual(status["provider_admission"], "unverified")
        self.run_once()
        self.assertEqual(len(self.calls), 1)

    def test_resume_warning_with_receipt_keeps_admission_separate(self):
        def warning(args, **kwargs):
            answer = self.runner(args, **kwargs)
            answer.stderr = "warning: cannot resume; active writer"
            return answer
        status = self.run_once(runner=warning)
        self.assertEqual(status["provider_admission"], "observed")
        self.assertEqual(status["activation"], "blocked_by_active_writer_report")
        self.assertIn("active writer", status["adapter_observations"][-1]["stderr"])
        self.run_once()
        self.assertEqual(len(self.calls), 1)

    def test_active_writer_error_and_unfamiliar_success_stop(self):
        for code, stdout, stderr in [(1, "", "already has an active writer"), (0, "ok", "")]:
            with self.subTest(code=code):
                mid = str(uuid.uuid4())
                m = self.box.send(ALICE, BOB, mid, mid, 1, "fixture", ALICE)["event"]
                def answer(args, **kw):
                    self.calls.append(args)
                    return subprocess.CompletedProcess(args, code, stdout, stderr)
                status = self.run_once(mid=mid, expected_hash=m["sha256"], runner=answer)
                self.assertEqual(status["provider_admission"], "unverified")
                self.run_once(mid=mid, expected_hash=m["sha256"])
        self.assertEqual(len(self.calls), 2)

    def test_unknown_and_stale_preflight_never_call_queue(self):
        for state in ("unknown",):
            status = self.run_once(observation=dict(self.preflight, state=state))
            self.assertEqual(status["next_action"], "deferred_" + state)
        old = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(minutes=6)).isoformat()
        with self.assertRaises(mail.MailError):
            self.run_once(observation=dict(self.preflight, observed_at=old))
        self.assertEqual(self.calls, [])
        self.assertEqual(self.box.status(self.message)["delivery_reports"], [])

    def test_verified_busy_route_queues_without_resume_or_takeover(self):
        status = self.run_once(observation=dict(self.preflight, state="busy"))
        self.assertEqual(status["provider_admission"], "observed")
        self.assertEqual(status["activation"], "unverified")
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(self.calls[0][0][:5], [sys.executable, "queue", "--thread", BOB.split('/')[-1], "--message"])
        self.assertEqual(len(self.calls[0][0]), 6)

    def test_missing_route_evidence_and_not_loaded_are_not_idle(self):
        missing = dict(self.preflight)
        missing.pop("queue_without_resume_evidence")
        for observation in (missing, dict(self.preflight, queue_without_resume_evidence=""),
                            dict(self.preflight, state="notLoaded")):
            with self.subTest(observation=observation), self.assertRaises(mail.MailError):
                self.run_once(observation=observation)
        self.assertEqual(self.calls, [])

    def test_timeout_preserves_provider_streams_losslessly_without_resend(self):
        for output, error in ((b"admission evidence\xff", b"warning\xfe"), ("receipt text", "warning"), (None, None)):
            mid = str(uuid.uuid4())
            m = self.box.send(ALICE, BOB, mid, mid, 1, "fixture")["event"]
            def timeout(args, **kwargs):
                self.calls.append(args)
                raise subprocess.TimeoutExpired(args, 20, output=output, stderr=error)
            status = self.run_once(mid=mid, expected_hash=m["sha256"], runner=timeout)
            observation = status["adapter_observations"][-1]
            for name, value in (("stdout", output), ("stderr", error)):
                if value is None:
                    self.assertIsNone(observation[name + "_base64"])
                else:
                    self.assertEqual(base64.b64decode(observation[name + "_base64"]),
                                     value if isinstance(value, bytes) else value.encode())
            self.assertEqual(status["provider_admission"], "unverified")
            self.run_once(mid=mid, expected_hash=m["sha256"])
        self.assertEqual(len(self.calls), 3)

    def test_binary_provider_receipt_retains_raw_bytes(self):
        def bytes_reply(args, **kwargs):
            result = self.runner(args, **kwargs)
            result.stdout = result.stdout.encode()
            result.stderr = b"diagnostic\xff"
            return result
        status = self.run_once(runner=bytes_reply)
        self.assertEqual(status["provider_admission"], "observed")
        self.assertEqual(base64.b64decode(status["adapter_observations"][-1]["stderr_base64"]), b"diagnostic\xff")

    def test_disconnected_accounting_recovers_receipt_without_second_submission(self):
        original = dispatch.record
        def disconnect(box, actor, mid, attempt, stage, outcome, **data):
            if stage == "admission":
                raise OSError("synthetic environment disconnected before accounting")
            return original(box, actor, mid, attempt, stage, outcome, **data)
        with patch.object(dispatch, "record", side_effect=disconnect):
            with self.assertRaises(OSError):
                self.run_once()
        status = self.run_once()
        self.assertEqual(status["provider_admission"], "unverified")
        intent = status["delivery_reports"][0]
        attempt = intent["attempt_id"].removesuffix(":intent")
        dispatch.record(self.box, ALICE, self.mid, attempt, "admission", "queued",
                        provider_message_id=PROVIDER, source="recovered exact synthetic provider reply",
                        note="late own accounting; original call not repeated")
        status = self.run_once()
        self.assertEqual(status["provider_admission"], "observed")
        self.assertIsNone(status["ack"])
        self.assertEqual(len(self.calls), 1)

    def test_wrong_recipient_hash_or_environment_refused(self):
        for changes in [dict(expected_hash="0" * 64), dict(observation=dict(self.preflight, recipient=CAROL)),
                        dict(observation=dict(self.preflight, shared_exchange="/different")),
                        dict(scope_current=False)]:
            with self.subTest(changes=changes), self.assertRaises(mail.MailError):
                self.run_once(**changes)
        with patch.dict(os.environ, {"CODEX_THREAD_ID": CAROL.split('/')[-1]}):
            with self.assertRaises(mail.MailError):
                self.run_once()
        self.assertEqual(self.calls, [])

    def test_remote_recipient_not_guessed_as_local(self):
        mid = str(uuid.uuid4())
        m = self.box.send(ALICE, "codex/durable/" + BOB.split('/')[-1], mid, "remote", 1, "fixture")["event"]
        with self.assertRaises(mail.MailError):
            self.run_once(mid=mid, expected_hash=m["sha256"])
        self.assertEqual(self.calls, [])

    def test_scope_revision_blocks_old_and_preserves_history(self):
        self.box.send(ALICE, BOB, str(uuid.uuid4()), "synthetic-work", 2, "user redirect", ALICE)
        before = self.box.path(ALICE).read_bytes()
        self.assertEqual(self.run_once()["next_action"], "reconcile_scope")
        self.assertEqual(self.box.path(ALICE).read_bytes(), before)
        self.assertEqual(self.calls, [])

    def test_saved_result_recovered_and_only_owner_acceptance_changes_state(self):
        self.finish()
        before = self.box.path(BOB).read_bytes()
        status = self.run_once()
        self.assertEqual(status["next_action"], "recover_saved_result")
        self.assertEqual(status["result"]["body"], "Saved fixture result")
        self.assertEqual(status["acceptance_state"], "unverified")
        self.box.receipt(ALICE, ALICE, self.mid, "acceptance", "Criteria checked", "accepted")
        self.assertEqual(self.run_once()["next_action"], "accepted")
        self.assertEqual(self.calls, [])
        self.assertEqual(self.box.path(BOB).read_bytes(), before)

    def test_ack_alone_prevents_new_execution_notification(self):
        self.box.receipt(BOB, ALICE, self.mid, "ack", "Read fixture")
        self.assertEqual(self.run_once()["next_action"], "await_result")
        self.assertEqual(self.calls, [])

    def test_foreign_observation_is_not_recipient_evidence(self):
        self.box.receipt(CAROL, ALICE, self.mid, "delivery", "Someone saw a send", "uncertain", "one")
        status = self.run_once()
        self.assertIsNone(status["ack"])
        self.assertEqual(status["next_action"], "reconcile_delivery_no_resend")
        self.assertEqual(self.calls, [])

    def test_concurrent_dispatch_holds_lock_over_queue_call(self):
        entered, release = threading.Event(), threading.Event()
        def slow(args, **kwargs):
            entered.set()
            if not release.wait(5):
                raise RuntimeError("fixture stalled")
            return self.runner(args, **kwargs)
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            future = pool.submit(self.run_once, runner=slow)
            self.assertTrue(entered.wait(5))
            try:
                with self.assertRaisesRegex(mail.MailError, "dispatch is active"):
                    self.run_once()
            finally:
                release.set()
            future.result()
        self.run_once()
        self.assertEqual(len(self.calls), 1)

    def test_process_exit_after_intent_cannot_cause_resend(self):
        code = '''import importlib.util, os, sys, json
spec=importlib.util.spec_from_file_location('d',sys.argv[1]);d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d)
box=d.mail.Mailbox(sys.argv[2]); actor=sys.argv[3]; mid=sys.argv[4]
def crash(*args,**kwargs): os._exit(74)
d.dispatch(box,actor,mid,sys.argv[5],json.loads(sys.argv[6]),sys.executable,sys.argv[2],True,runner=crash)
'''
        child = subprocess.run([sys.executable, "-c", code, str(SCRIPT), str(self.root), ALICE, self.mid,
                                self.message["sha256"], json.dumps(self.preflight)], capture_output=True, text=True,
                               env=dict(os.environ, PYTHONDONTWRITEBYTECODE="1"))
        self.assertEqual(child.returncode, 74, child.stderr)
        status = self.run_once()
        self.assertEqual(status["next_action"], "reconcile_delivery_no_resend")
        self.assertEqual(status["adapter_observations"][0]["stage"], "intent")
        self.assertEqual(self.calls, [])

    def test_failed_intent_publication_prevents_queue(self):
        with patch.object(mail.os, "fsync", side_effect=OSError("synthetic disk full")):
            with self.assertRaises(OSError):
                self.run_once()
        self.assertEqual(self.calls, [])
        self.assertEqual(self.box.status(self.message)["delivery_reports"], [])

    def test_result_save_failure_after_submission_retains_intent(self):
        def submit_then_fail_storage(args, **kw):
            answer = self.runner(args, **kw)
            self.failure = patch.object(mail.os, "fsync", side_effect=OSError("synthetic full disk"))
            self.failure.start()
            return answer
        try:
            with self.assertRaises(OSError):
                self.run_once(runner=submit_then_fail_storage)
        finally:
            self.failure.stop()
        self.run_once()
        self.assertEqual(len(self.calls), 1)

    def test_activation_observation_is_idempotent_and_not_ack(self):
        e = dict(recipient=BOB, message_id=self.mid, message_sha256=self.message["sha256"],
                 source="synthetic thread reader", turn_id=str(uuid.uuid4()), observed_at=dispatch.stamp(),
                 detail="fixture exact notification in new turn")
        for _ in range(2):
            status = dispatch.observe_activation(self.box, ALICE, self.mid, e)
        self.assertEqual(len(status["delivery_reports"]), 1)
        self.assertEqual(status["activation"], "observer_reported")
        self.assertIsNone(status["ack"])
        self.assertEqual(status["acceptance_state"], "unverified")
        with self.assertRaises(mail.MailError):
            dispatch.observe_activation(self.box, ALICE, self.mid, dict(e, recipient=CAROL))

    def test_conflicting_same_id_is_rejected_before_dispatch(self):
        with self.assertRaises(mail.MailError):
            self.box.send(ALICE, BOB, self.mid, "synthetic-work", 1, "conflicting bytes", ALICE)
        self.assertEqual(self.box.message(ALICE, self.mid), self.message)
        self.assertEqual(self.calls, [])

    def test_scan_cli_reads_pending_without_mutation(self):
        before = {p.name: p.read_bytes() for p in self.root.iterdir()}
        result = subprocess.run([sys.executable, str(SCRIPT), "--root", str(self.root),
                                 "--actor", ALICE, "scan"], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)[0]["next_action"], "eligible_for_preflight")
        self.assertEqual(before, {p.name: p.read_bytes() for p in self.root.iterdir()})

    def test_scan_environment_default_and_explicit_override(self):
        before = {p.name: p.read_bytes() for p in self.root.iterdir()}
        command = [sys.executable, str(SCRIPT), '--actor', ALICE, 'scan']
        env = dict(os.environ, WTI_AI_MSG_DIR=str(self.root))
        result = subprocess.run(command, env=env, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)[0]['message']['message_id'], self.mid)
        env['WTI_AI_MSG_DIR'] = str(self.root / 'missing')
        result = subprocess.run(command[:2] + ['--root', str(self.root)] + command[2:],
                                env=env, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        failed = subprocess.run(command, env=env, capture_output=True, text=True)
        self.assertEqual(failed.returncode, 1)
        self.assertFalse((self.root / 'missing').exists())
        env['WTI_AI_MSG_DIR'] = ''
        missing = subprocess.run(command, env=env, capture_output=True, text=True)
        self.assertEqual(missing.returncode, 2)
        self.assertIn('--root', missing.stderr)
        self.assertEqual(before, {p.name: p.read_bytes() for p in self.root.iterdir()})

    def test_orphan_receipt_blocks_scan_and_queue(self):
        self.finish()
        self.box.path(ALICE).unlink()
        with self.assertRaisesRegex(mail.MailError, 'Orphan receipt'):
            dispatch.scan(self.box, ALICE)
        with self.assertRaisesRegex(mail.MailError, 'Orphan receipt'):
            self.run_once()
        self.assertEqual(self.calls, [])

    def test_revision_published_during_preflight_stops_before_intent(self):
        original = dispatch.preflight
        def changed(*args, **kwargs):
            answer = original(*args, **kwargs)
            self.box.send(ALICE, BOB, str(uuid.uuid4()), "synthetic-work", 2, "updated scope", ALICE)
            return answer
        with patch.object(dispatch, "preflight", side_effect=changed):
            status = self.run_once()
        self.assertEqual(status["next_action"], "reconcile_scope")
        self.assertEqual(status["delivery_reports"], [])
        self.assertEqual(self.calls, [])

    def test_ack_during_preflight_stops_before_intent(self):
        original = dispatch.preflight
        def changed(*args, **kwargs):
            answer = original(*args, **kwargs)
            self.box.receipt(BOB, ALICE, self.mid, "ack", "Already read")
            return answer
        with patch.object(dispatch, "preflight", side_effect=changed):
            status = self.run_once()
        self.assertEqual(status["next_action"], "await_result")
        self.assertEqual(status["delivery_reports"], [])
        self.assertEqual(self.calls, [])

    def test_scan_single_read_per_outbox_and_fresh_saved_result(self):
        for i in range(30):
            self.box.send(ALICE, BOB, str(uuid.uuid4()), f"request-{i}", 1, "fixture", ALICE)
        with patch.object(mail, "decode", wraps=mail.decode) as decode:
            self.assertEqual(len(dispatch.scan(self.box, ALICE)), 31)
            self.assertEqual(decode.call_count, 1)
        self.finish()
        with patch.object(mail, "decode", wraps=mail.decode) as decode:
            status = dispatch.scan(self.box, ALICE)
            self.assertEqual(decode.call_count, 2)
        original = next(s for s in status if s["message"]["message_id"] == self.mid)
        self.assertEqual(original["next_action"], "recover_saved_result")

    def test_scan_does_not_create_bytecode_with_default_python_settings(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            scripts, exchange = root / "scripts", root / "exchange"
            scripts.mkdir()
            exchange.mkdir(mode=0o700)
            for name in ("dispatch.py", "mailbox.py"):
                shutil.copyfile(SCRIPT.parent / name, scripts / name)
            before = {str(p.relative_to(root)): p.read_bytes() for p in root.rglob("*") if p.is_file()}
            env = dict(os.environ)
            env.pop("PYTHONDONTWRITEBYTECODE", None)
            result = subprocess.run([sys.executable, str(scripts / "dispatch.py"), "--root",
                str(exchange), "--actor", ALICE, "scan"], env=env, text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(result.stdout), [])
            self.assertFalse(list(root.rglob("__pycache__")))
            self.assertEqual(before, {str(p.relative_to(root)): p.read_bytes() for p in root.rglob("*") if p.is_file()})


if __name__ == "__main__":
    unittest.main()
