# Publication scope and trust boundary

This describes the current Linux helper, not a new permission grant. Bind the actor
to its concrete outbox using existing role records. Let `E` be the approved exchange
directory and `A` be `provider__host-label__session-id`. Peer outboxes remain
protocol-read-only. Do not infer sandbox authority from Unix ownership.

## Smallest operation footprint

| Target | Operations needed |
| --- | --- |
| Toolkit/helper, body input and path ancestors | Read inputs; traverse paths. No writes to toolkit or inputs. |
| `E` and existing `E/*.md` | List/read messages and referenced receipts; stat/validate files. Read commands do not publish. |
| `E/A.lock` | Create if absent, open read/write, acquire/release advisory exclusive `flock`. Lock remains for later calls. |
| `E/.mail-<random>` | Create a fresh exclusive temporary file, write full replacement history, flush and fsync it. Name is chosen at runtime, so one fixed temporary filename is insufficient. |
| That temporary file → `E/A.md` | Atomic rename/replace, including creation when the outbox is absent. Requires directory-entry authority, not just permission to write existing file contents. |
| `E` | Open directory read-only and fsync metadata after replacement. Filesystem permissions still require traversal and entry mutation for create/rename/unlink. |
| This invocation's temporary file | Unlink on failure. After successful rename, cleanup sees that temporary name is already absent. Never remove another writer's temp or lock. |

Identical retries still open/lock `A.lock` and read the old outbox but create no
replacement temp file. `send`, `ack`, `accept-execution`, `finish`, `delivery` and `accept` all publish
through the same append path. A forced process death may leave an orphan temporary
file; readers ignore it, and cleanup requires identifying its owner before removal.

## Authorization versus enforcement

An exact-file-only write grant for `E/A.md` is **insufficient**. On ordinary Linux
filesystems, write/search permission on `E` permits mutation of directory entries,
potentially including deletion/replacement of a peer's file even when its file
content is read-only. A broad sandbox directory grant can have the same problem.
Same-UID actors, private modes, checksums and advisory locks do not isolate peers
or authenticate authors. The helper's actor checks prevent mistakes, not hostile
processes. Latest-user-instruction precedence is likewise an agent protocol rule;
the helper does not know the current user conversation or enforce task cancellation.

Prefer an existing supported **approval for the concrete command**: pin the reviewed
helper hash, exact actor/exchange, verb, message identity and input/evidence. Disclose
the lock, random temp, own-outbox replace, cleanup and directory fsync footprint.
That constrains the authorized action; it is not a claim that the OS restricts an
arbitrary process to those paths. The helper/code and input must remain the reviewed
versions, and the action must stay within the current user scope.

If the host only offers a directory-wide writable grant, report its peer-entry
capability and obtain the required approval before changing it. Do not advertise
an exclusion for peers unless that host policy actually enforces and has tested it.
If strict isolation is required and unsupported, leave publication blocked; a
separately designed actor-private layout or supported broker would be future work,
not a silent migration in this trial. No chmod, ACL, sandbox, service or credential
changes are part of this package.

## Verification and honest limits

`evals/probe_write_scope.py` uses existing `strace` on synthetic first publication,
replacement and identical retry. It checks exact write-open/rename/unlink targets,
file/directory fsync, advisory locking and unchanged peer outbox bytes. Its output
contains the command, helper hash, fixture identity, trace and assertions. If tracing
is unavailable or denied, report that limitation; do not install or bypass it.

Focused regression tests inject denied temporary creation and denied replacement;
they require the prior own/peer outboxes to remain unchanged and no temp leak.
These are simulated failures, not a test of real sandbox permissions. The syscall
trace establishes the helper's operation footprint on that local filesystem; it
does not establish an OS policy isolating same-UID peers. Independently test any
proposed persistent permission policy before calling it enforced.

The optional foreground adapter adds only its sender-owned `E/A.dispatch.lock`
(create/read/write/flock, retained). See [local workflow](local-workflow.md) for
its exact scope, queue subprocess and publication-versus-execution distinction.
