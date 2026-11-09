#!/usr/bin/env python3
"""Build a deterministic portable package, excluding all live coordination data."""

import argparse
import contextlib
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent
FILES = [
    "plugin.json", "provenance.json", "README.md", "OPERATIONS.md", "DESIGN.md", "package.py",
    "skills/wti-ai-msg/LICENSE", "skills/wti-ai-msg/NOTICE.md",
    "skills/wti-ai-msg/references/XAPI-LICENSE.txt", "evals/test_package.py",
    "evals/test_write_scope.py", "evals/test_mailbox.py", "evals/test_dispatch.py", "evals/probe_write_scope.py", "evals/scenarios.md", "evals/prompts.json",
    "skills/wti-ai-msg/SKILL.md", "skills/wti-ai-msg/agents/openai.yaml",
    "skills/wti-ai-msg/references/mail.md", "skills/wti-ai-msg/references/protocol.md",
    "skills/wti-ai-msg/references/templates.md",
    "skills/wti-ai-msg/references/authority-proposal.md",
    "skills/wti-ai-msg/references/pushed-review.md",
    "skills/wti-ai-msg/references/review-request.json",
    "skills/wti-ai-msg/references/write-scope.md",
    "skills/wti-ai-msg/references/environment.md",
    "skills/wti-ai-msg/references/recovery.md",
    "skills/wti-ai-msg/scripts/mailbox.py",
    "skills/wti-ai-msg/scripts/dispatch.py",
    "skills/wti-ai-msg/references/local-workflow.md",
    "skills/wti-ai-msg/references/chatgpt-workflow.md",
]


def require(condition, explanation):
    """Publication checks must survive optimized Python execution."""
    if not condition:
        raise ValueError(explanation)


def source_bytes(relative):
    """Reject symlink components before reading allowlisted package inputs."""
    path = ROOT
    for part in Path(relative).parts:
        require(part not in ("..", "/"), f"Invalid package path: {relative}")
        path = path / part
        require(not path.is_symlink(), f"Symlink package input: {path}")
    require(path.is_file(), f"Missing regular package input: {relative}")
    return path.read_bytes()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    # Validate and package the same captured bytes; no second source read.
    payloads = {relative: source_bytes(relative) for relative in FILES}
    provenance = json.loads(payloads["provenance.json"])
    for name in ("protocol", "templates"):
        actual = hashlib.sha256(payloads[f"skills/wti-ai-msg/references/{name}.md"]).hexdigest()
        require(actual == provenance[f"parent_{name}_sha256"], f"Parent {name} checksum mismatch")
    packaged = {(ROOT / relative).resolve() for relative in FILES}
    # Only inline Markdown ](target) links are checked; this is not a Markdown parser.
    for relative, data in payloads.items():
        source = ROOT / relative
        if source.suffix == ".md":
            for target in re.findall(r"\]\(([^)]+)\)", data.decode("utf-8")):
                if not re.match(r"[a-z]+://", target) and not target.startswith("#"):
                    resolved = (source.parent / target.split("#")[0]).resolve()
                    require(resolved in packaged, f"Unpackaged link: {relative}: {target}")
    # Publish the private temp mode (normally 0600 on POSIX), not prior output ACLs/mode.
    # Sharing the archive is a separate explicit publication step; see README.md.
    fd, temporary = tempfile.mkstemp(prefix=".wti-package-", dir=args.output.parent)
    os.close(fd)
    try:
        with zipfile.ZipFile(temporary, "w", zipfile.ZIP_DEFLATED) as archive:
            for relative in sorted(FILES):
                info = zipfile.ZipInfo(relative, (1980, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, payloads[relative])
        with zipfile.ZipFile(temporary) as archive:
            require(archive.testzip() is None, "Archive integrity failure")
            require(sorted(archive.namelist()) == sorted(FILES), "Archive contents mismatch")
        os.replace(temporary, args.output)
    finally:
        with contextlib.suppress(FileNotFoundError):
            os.unlink(temporary)
    print(json.dumps({"archive": str(args.output), "sha256": hashlib.sha256(args.output.read_bytes()).hexdigest(),
                      "files": len(FILES)}, indent=2))


if __name__ == "__main__":
    main()
