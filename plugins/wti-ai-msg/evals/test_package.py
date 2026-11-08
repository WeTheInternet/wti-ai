"""Exercise portable publication independently of the containing repository."""

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

ROOT = Path(__file__).resolve().parents[1]


class PackageTests(unittest.TestCase):
    def test_postwrite_validation_failure_preserves_prior_archive_and_cleans_temp(self):
        spec = importlib.util.spec_from_file_location("package_test_impl", ROOT / "package.py")
        package = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(package)
        for existing in (False, True):
            for failure in ("integrity", "names"):
                with self.subTest(existing=existing, failure=failure), tempfile.TemporaryDirectory() as tmp:
                    output = Path(tmp) / "package.zip"
                    if existing:
                        output.write_bytes(b"previous validated artifact")
                    original = package.require
                    def reject(condition, explanation):
                        if explanation == ("Archive integrity failure" if failure == "integrity" else "Archive contents mismatch"):
                            raise ValueError("synthetic postwrite failure")
                        return original(condition, explanation)
                    with patch.object(sys, "argv", ["package.py", "--output", str(output)]), patch.object(package, "require", side_effect=reject):
                        with self.assertRaisesRegex(ValueError, "postwrite failure"):
                            package.main()
                    self.assertEqual(output.exists(), existing)
                    if existing:
                        self.assertEqual(output.read_bytes(), b"previous validated artifact")
                    self.assertEqual(sorted(p.name for p in Path(tmp).iterdir()), ["package.zip"] if existing else [])

    def build(self, root, output, success=True, optimized=False):
        result = subprocess.run(
            [sys.executable, *(["-O"] if optimized else []), str(root / "package.py"), "--output", str(output)],
            capture_output=True, text=True, check=False,
            env=dict(os.environ, **({"PYTHONOPTIMIZE": "1"} if optimized else {})),
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
                for name in ("skills/wti-ai-msg/LICENSE", "skills/wti-ai-msg/NOTICE.md",
                             "skills/wti-ai-msg/references/XAPI-LICENSE.txt"):
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
            (detached / "skills/wti-ai-msg/local-only.json").write_bytes(sentinel)
            output = base / "package.zip"
            self.build(detached, output)
            with zipfile.ZipFile(output) as archive:
                self.assertNotIn("live-outbox.md", archive.namelist())
                self.assertNotIn("skills/wti-ai-msg/local-only.json", archive.namelist())
                self.assertFalse(any(sentinel in archive.read(name) for name in archive.namelist()))

    def test_changed_parent_contract_blocks_publication(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            detached = base / "detached"
            shutil.copytree(ROOT, detached, ignore=shutil.ignore_patterns("__pycache__"))
            (detached / "skills/wti-ai-msg/references/protocol.md").write_text("wrong contract\n")
            output = base / "package.zip"
            self.build(detached, output, success=False)
            self.assertFalse(output.exists())

    def test_optimized_python_retains_validation(self):
        for name in ("protocol", "templates"):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as tmp:
                base = Path(tmp)
                detached = base / "detached"
                shutil.copytree(ROOT, detached, ignore=shutil.ignore_patterns("__pycache__"))
                (detached / f"skills/wti-ai-msg/references/{name}.md").write_text("tampered\n")
                output = base / "package.zip"
                result = self.build(detached, output, success=False, optimized=True)
                self.assertIn(f"Parent {name} checksum mismatch", result.stderr)
                self.assertFalse(output.exists())

    def test_symlink_file_or_ancestor_cannot_enter_package(self):
        for target in ("evals", "README.md", "provenance.json"):
            with self.subTest(target=target), tempfile.TemporaryDirectory() as tmp:
                base = Path(tmp)
                detached = base / "detached"
                shutil.copytree(ROOT, detached, ignore=shutil.ignore_patterns("__pycache__"))
                original = detached / target
                outside = base / "outside"
                original.rename(outside)
                original.symlink_to(outside, target_is_directory=outside.is_dir())
                output = base / "package.zip"
                result = self.build(detached, output, success=False, optimized=True)
                self.assertIn("Symlink package input", result.stderr)
                self.assertFalse(output.exists())

    def test_optimized_python_rejects_missing_inputs_and_unpackaged_links(self):
        for missing in (True, False):
            with self.subTest(missing=missing), tempfile.TemporaryDirectory() as tmp:
                base = Path(tmp)
                detached = base / "detached"
                shutil.copytree(ROOT, detached, ignore=shutil.ignore_patterns("__pycache__"))
                if missing:
                    (detached / "README.md").unlink()
                else:
                    (detached / "README.md").write_text("[missing](not-packaged.md)\n")
                output = base / "package.zip"
                self.build(detached, output, success=False, optimized=True)
                self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
