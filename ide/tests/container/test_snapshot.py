"""Offline fixture regression tests; no Podman or real external data."""
import pathlib
import subprocess
import tarfile
import tempfile
import unittest
from snapshot import snapshot


class SnapshotTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = pathlib.Path(self.temp.name)
        self.root = self.base / 'repo'
        (self.root / 'ide/tracked').mkdir(parents=True)
        (self.root / 'ide/tracked/file.txt').write_text('tracked fixture')
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)
        subprocess.run(['git', '-C', str(self.root), 'add', '.'], check=True)
        self.archive = self.base / 'source.tar'

    def test_regular_modified_untracked_and_deleted(self):
        (self.root / 'ide/tracked/file.txt').write_text('modified')
        (self.root / 'ide/new.txt').write_text('new')
        snapshot(self.root, self.archive)
        with tarfile.open(self.archive) as archive:
            self.assertEqual(archive.extractfile('tracked/file.txt').read(), b'modified')
            self.assertEqual(archive.extractfile('new.txt').read(), b'new')
        (self.root / 'ide/tracked/file.txt').unlink()
        snapshot(self.root, self.archive)
        with tarfile.open(self.archive) as archive:
            self.assertEqual(archive.getnames(), ['new.txt'])

    def test_rejects_each_symlink_component_before_archive(self):
        for relative in ['ide/tracked/file.txt', 'ide/tracked', 'ide']:
            with self.subTest(relative=relative):
                source = self.root / relative
                backup = self.base / 'backup'
                source.rename(backup)
                source.symlink_to(backup, target_is_directory=backup.is_dir())
                try:
                    with self.assertRaisesRegex(ValueError, 'Symlink requires explicit review'):
                        snapshot(self.root, self.archive)
                    self.assertFalse(self.archive.exists())
                finally:
                    source.unlink()
                    backup.rename(source)


if __name__ == '__main__':
    unittest.main()
