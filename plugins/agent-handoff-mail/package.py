#!/usr/bin/env python3
"""Build a deterministic portable package, excluding all live coordination data."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parent
FILES = [
    "plugin.json", "provenance.json", "README.md", "OPERATIONS.md", "package.py",
    "skills/handoff-mail/LICENSE", "skills/handoff-mail/NOTICE.md",
    "skills/handoff-mail/references/XAPI-LICENSE.txt", "evals/test_package.py",
    "evals/test_mailbox.py", "evals/test_dispatch.py", "evals/probe_write_scope.py", "evals/scenarios.md", "evals/prompts.json",
    "skills/handoff-mail/SKILL.md", "skills/handoff-mail/agents/openai.yaml",
    "skills/handoff-mail/references/mail.md", "skills/handoff-mail/references/protocol.md",
    "skills/handoff-mail/references/templates.md",
    "skills/handoff-mail/references/authority-proposal.md",
    "skills/handoff-mail/references/pushed-review.md",
    "skills/handoff-mail/references/review-request.json",
    "skills/handoff-mail/references/write-scope.md",
    "skills/handoff-mail/references/environment.md",
    "skills/handoff-mail/references/recovery.md",
    "skills/handoff-mail/scripts/mailbox.py",
    "skills/handoff-mail/scripts/dispatch.py",
    "skills/handoff-mail/references/local-workflow.md",
    "skills/handoff-mail/references/chatgpt-workflow.md",
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    provenance = json.loads((ROOT / "provenance.json").read_text())
    protocol = ROOT / "skills/handoff-mail/references/protocol.md"
    assert hashlib.sha256(protocol.read_bytes()).hexdigest() == provenance["parent_protocol_sha256"]
    templates = ROOT / "skills/handoff-mail/references/templates.md"
    assert hashlib.sha256(templates.read_bytes()).hexdigest() == provenance["parent_templates_sha256"]
    for relative in FILES:
        source = ROOT / relative
        assert source.is_file() and not source.is_symlink(), relative
        if source.suffix == ".md":
            for target in re.findall(r"\]\(([^)]+)\)", source.read_text()):
                if not re.match(r"[a-z]+://", target) and not target.startswith("#"):
                    assert (source.parent / target.split("#")[0]).is_file(), (relative, target)
    with zipfile.ZipFile(args.output, "w", zipfile.ZIP_DEFLATED) as archive:
        for relative in sorted(FILES):
            info = zipfile.ZipInfo(relative, (1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, (ROOT / relative).read_bytes())
    with zipfile.ZipFile(args.output) as archive:
        assert archive.testzip() is None
        assert sorted(archive.namelist()) == sorted(FILES)
    print(json.dumps({"archive": str(args.output), "sha256": hashlib.sha256(args.output.read_bytes()).hexdigest(),
                      "files": len(FILES)}, indent=2))


if __name__ == "__main__":
    main()
