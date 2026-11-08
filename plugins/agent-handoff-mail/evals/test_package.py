"""Exercise portable publication independently of the containing repository."""

import hashlib
import json
from pathlib import Path
import secrets
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]


class PackageTests(unittest.TestCase):
    def build(self, root, output, success=True):
        result = subprocess.run(
            [sys.executable, str(root / "package.py"), "--output", str(output)],
            capture_output=True, text=True, check=False,
        )
        if success:
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(result.stdout)["sha256"],
                             hashlib.sha256(output.read_bytes()).hexdigest())
        else:
            self.assertNotEqual(result.returncode, 0)
        return result

    def test_detached_archive_rebuilds_identically_with_notices(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            first, second = base / "first.zip", base / "second.zip"
            self.build(ROOT, first)
            detached = base / "detached"
            with zipfile.ZipFile(first) as archive:
                archive.extractall(detached)
                for name in ("skills/handoff-mail/LICENSE", "skills/handoff-mail/NOTICE.md",
                             "skills/handoff-mail/references/XAPI-LICENSE.txt"):
                    self.assertTrue(archive.read(name))
            self.build(detached, second)
            self.assertEqual(first.read_bytes(), second.read_bytes())

    def test_unlisted_files_do_not_enter_public_package(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            detached = base / "detached"
            shutil.copytree(ROOT, detached, ignore=shutil.ignore_patterns("__pycache__"))
            sentinel = secrets.token_bytes(32)
            (detached / "live-outbox.md").write_bytes(sentinel)
            (detached / "skills/handoff-mail/local-only.json").write_bytes(sentinel)
            output = base / "package.zip"
            self.build(detached, output)
            with zipfile.ZipFile(output) as archive:
                self.assertNotIn("live-outbox.md", archive.namelist())
                self.assertNotIn("skills/handoff-mail/local-only.json", archive.namelist())
                self.assertFalse(any(sentinel in archive.read(name) for name in archive.namelist()))

    def test_changed_parent_contract_blocks_publication(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            detached = base / "detached"
            shutil.copytree(ROOT, detached, ignore=shutil.ignore_patterns("__pycache__"))
            (detached / "skills/handoff-mail/references/protocol.md").write_text("wrong contract\n")
            output = base / "package.zip"
            self.build(detached, output, success=False)
            self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
