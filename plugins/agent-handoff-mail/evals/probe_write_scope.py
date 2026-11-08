#!/usr/bin/env python3
"""Trace synthetic publication; verify observed scope, not OS permission isolation."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import uuid

HERE = Path(__file__).resolve().parent
SCRIPT = HERE.parent / "skills/handoff-mail/scripts/mailbox.py"
ALICE, BOB = "test/fixture/alice", "test/fixture/bob"


def require(condition, explanation):
    if not condition:
        raise RuntimeError(explanation)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()
    tracer = shutil.which("strace")
    require(tracer is not None, "strace unavailable: no installation or bypass attempted")
    # A new evidence directory prevents overwriting old probe results.
    output = args.output_dir.resolve()
    output.mkdir(exist_ok=False)
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
    # Only fixture actors are used; no native actor or exchange is involved.
    env.pop("CODEX_THREAD_ID", None)
    report = {"scope": "synthetic syscall footprint; not sandbox enforcement or live delivery",
              "helper_sha256": hashlib.sha256(SCRIPT.read_bytes()).hexdigest(),
              "actor": ALICE, "peer": BOB, "steps": []}
    with tempfile.TemporaryDirectory(prefix="scope-fixture-", dir=HERE) as temporary:
        fixture = Path(temporary)
        exchange = fixture / "exchange"
        exchange.mkdir(mode=0o700)
        body = fixture / "body.txt"
        body.write_text("Non-sensitive synthetic write-scope probe.\n")
        own = exchange / "test__fixture__alice.md"
        peer = exchange / "test__fixture__bob.md"
        lock = own.with_suffix(".lock")

        def command(actor, recipient, mid):
            return [sys.executable, str(SCRIPT), "--root", str(exchange), "--actor", actor,
                    "send", "--to", recipient, "--message-id", mid, "--request-id",
                    "write-scope-probe", "--revision", "1", "--body-file", str(body)]

        seed = subprocess.run(command(BOB, ALICE, str(uuid.uuid4())), env=env,
                              text=True, capture_output=True)
        require(seed.returncode == 0, f"Fixture setup failed: {seed.stderr}")
        peer_before = peer.read_bytes()
        second_id = str(uuid.uuid4())
        for name, mid, writes in (("create", str(uuid.uuid4()), True),
                                  ("replace", second_id, True), ("retry", second_id, False)):
            trace = output / f"{name}.strace"
            cmd = [tracer, "-f", "-yy", "-s", "4096", "-e",
                   "trace=openat,rename,renameat,renameat2,unlink,unlinkat,flock,fsync",
                   "-o", str(trace), *command(ALICE, BOB, mid)]
            result = subprocess.run(cmd, env=env, text=True, capture_output=True)
            require(result.returncode == 0, f"Trace failed; do not bypass: {result.stderr}")
            receipt = json.loads(result.stdout)
            require(receipt["written"] is writes, f"Unexpected {name} publication result")
            lines = trace.read_text().splitlines()
            # Observe every write-capable open, not just ones inside the exchange.
            write_opens = [line for line in lines if "openat(" in line and
                           re.search(r"O_WRONLY|O_RDWR|O_CREAT|O_TRUNC", line)]
            paths = [Path(re.search(r'openat\([^,]+, "([^"]+)"', line).group(1))
                     for line in write_opens]
            temps = [p for p in paths if p.parent == exchange and p.name.startswith(".mail-")]
            require(paths.count(lock) == 1, "Expected exactly one own lock open")
            require(len(temps) == int(writes), "Unexpected temporary creation count")
            require(set(paths) == {lock, *temps}, f"Unexpected write-capable open: {write_opens}")
            lock_line = next(line for line in write_opens if str(lock) in line)
            require("O_NOFOLLOW" in lock_line and "O_CREAT" in lock_line and "0600" in lock_line,
                    "Lock flags/mode changed")
            require(any("flock(" in line and str(lock) in line and "LOCK_EX" in line and
                        line.endswith("= 0") for line in lines), "Own advisory lock not acquired")
            renames = [line for line in lines if re.search(r"\brename(?:at2|at)?\(", line)]
            unlinks = [line for line in lines if re.search(r"\bunlink(?:at)?\(", line)]
            syncs = [line for line in lines if "fsync(" in line]
            require(len(renames) == int(writes), "Unexpected rename count")
            require(len(unlinks) == int(writes), "Unexpected cleanup count")
            require(len(syncs) == 2 * int(writes), "Unexpected fsync count")
            if writes:
                temp = temps[0]
                temp_line = next(line for line in write_opens if str(temp) in line)
                require("O_EXCL" in temp_line and "0600" in temp_line, "Temp is not exclusive/private")
                require(f'rename("{temp}", "{own}") = 0' in renames[0], "Replace target mismatch")
                require(f'unlink("{temp}")' in unlinks[0] and "ENOENT" in unlinks[0],
                        "Expected cleanup of this already-renamed temporary only")
                for path in (temp, exchange):
                    require(any(f"<{path}>" in line and line.endswith("= 0") for line in syncs),
                            f"Missing successful fsync: {path}")
            require(peer.read_bytes() == peer_before, "Peer outbox changed")
            require(not list(exchange.glob(".mail-*")), "Temporary file leaked")
            report["steps"].append({"name": name, "command": cmd, "returncode": result.returncode,
                                    "trace": trace.name, "written": writes,
                                    "write_opens": [str(p) for p in paths],
                                    "peer_unchanged": True, "assertions": "passed"})
        report["peer_sha256"] = hashlib.sha256(peer_before).hexdigest()
        report["fixture_cleaned_after_run"] = True
    (output / "result.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"result": str(output / "result.json"), "steps": len(report["steps"]),
                      "assertions": "passed", "scope": report["scope"]}, indent=2))


if __name__ == "__main__":
    main()
