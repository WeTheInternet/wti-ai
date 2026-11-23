"""Snapshot Git-known IDE files without following repository symlinks."""
import pathlib
import subprocess
import sys
import tarfile


def snapshot(root, destination):
    root = pathlib.Path(root)
    paths = subprocess.check_output([
        'git', '-C', str(root), 'ls-files', '-z', '--cached', '--others',
        '--exclude-standard', '--', 'ide/'
    ]).split(b'\0')
    sources = []
    for name in sorted(set(paths)):
        if not name:
            continue
        relative = pathlib.Path(name.decode())
        # Check EVERY component before is_file/archive.add can follow a parent.
        source = root
        for component in relative.parts:
            source = source / component
            if source.is_symlink():
                raise ValueError(f'Symlink requires explicit review before container inclusion: {source.relative_to(root)}')
        if source.is_file():
            sources.append((source, str(relative.relative_to('ide'))))
    # Validate the entire list before opening the archive or reading file contents.
    with tarfile.open(destination, 'w') as archive:
        for source, name in sources:
            archive.add(source, arcname=name, recursive=False)


if __name__ == '__main__':
    snapshot(sys.argv[1], sys.argv[2])
