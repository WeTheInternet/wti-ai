"""Check strace syscall variants without requiring a particular CPU or tracer."""
import unittest
from probe_write_scope import verify_replace_cleanup


class WriteScopeTests(unittest.TestCase):
    def test_linux_syscall_variants(self):
        for rename in ('rename("/x/.mail-a", "/x/own.md")',
                       'renameat(AT_FDCWD, "/x/.mail-a", AT_FDCWD, "/x/own.md")',
                       'renameat2(3</x>, "/x/.mail-a", 4</x>, "/x/own.md", 0)'):
            for unlink in ('unlink("/x/.mail-a")', 'unlinkat(AT_FDCWD, "/x/.mail-a", 0)'):
                with self.subTest(rename=rename, unlink=unlink):
                    verify_replace_cleanup(f'123 {rename} = 0',
                        f'123 {unlink} = -1 ENOENT (No such file or directory)', '/x/.mail-a', '/x/own.md')

    def test_wrong_path_failed_replace_or_successful_cleanup_rejected(self):
        rename = 'rename("/x/.mail-a", "/x/own.md") = 0'
        unlink = 'unlink("/x/.mail-a") = -1 ENOENT (No such file or directory)'
        cases = [(rename.replace('own.md', 'peer.md'), unlink),
                 (rename.replace('.mail-a', '.mail-b'), unlink),
                 (rename.replace('= 0', '= -1 EACCES'), unlink),
                 (rename, unlink.replace('.mail-a', '.mail-b')),
                 (rename, unlink.replace('-1 ENOENT', '0'))]
        for replace, cleanup in cases:
            with self.subTest(replace=replace, cleanup=cleanup), self.assertRaises(RuntimeError):
                verify_replace_cleanup(replace, cleanup, '/x/.mail-a', '/x/own.md')


if __name__ == '__main__':
    unittest.main()
