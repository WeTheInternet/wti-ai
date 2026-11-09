# Environment and reachability preflight

Every participating agent must understand its own execution surface and the
recipient's reachable surfaces before sending a handoff. Record this compactly in
the existing request or role record; do not create a competing environment registry.

```text
actor/role: exact native identity, how verified (or unresolved)
surface: local CLI | desktop connector | remote ChatGPT | other verified surface
host/account/repository scope: observed identifiers; opaque labels are not endpoints
tools: actual available tool and scope; read / write / notify tested separately
resources: sender-local | verified shared filesystem | connected GitHub | approved private relay
evidence: operation, timestamp, result/object/version/hash, who observed it
knowledge: directly tested | reported by named participant/user | assumption | unavailable
route: each hop, actual writer/recipient, reachable content, return path
wake: tested mechanism or pending until recipient's next active turn
```

Never copy credentials, account secrets or sensitive content into coordination
notes, prompts or public artifacts. Refer to the authorized file/resource URI where
an intended participant may access it; the locator must not embed credentials,
signed access tokens or secret values. Keep sensitive locators on an approved
private surface and verify access separately. If the recipient cannot access the
resource, report that boundary instead of pasting the secret into the handoff.
Capability is per session and account, not guaranteed by an agent's model, title or
another agent's connector. Recheck after relevant changes.

## Choose a route that carries the work

| Resource | Valid handoff |
| --- | --- |
| Pushed code | Repository/issue/PR links and exact SHAs readable through the recipient's connected GitHub. Check actual access; a public-looking URL is not evidence. |
| Unpushed code, local logs or filesystem evidence | An authorized local agent reports the bounded evidence or publishes an approved snapshot through an already accessible private resource. Remote ChatGPT does not inspect Codex's filesystem by receiving its path. |
| File mailbox | Both sides demonstrate access to the same exchange/content; write and notification authority are verified separately. Matching absolute paths do not prove shared storage. |
| Desktop/private-resource relay | The authorized intermediary carries the actual envelope/body or accessible versioned object and the return evidence. It preserves sender, recipient, ID/revision/hash and per-hop attribution; it cannot ACK for the recipient. |
| Localhost URL or local file link | Sender-local context only, unless a specific shared/tunneled route has been independently verified and authorized. `localhost` denotes the consumer's own network environment. Do not guess ports, expose a service or grant access to make a link work. |

A ChatGPT desktop tool capable of reading a local session is a specific connector
capability. It does not mean every remote ChatGPT agent has a local shell, can open
`/opt/...` or `/var/tmp/...`, or can write the mailbox. Likewise, a CLI thread reader
scoped to one app server does not inherit a desktop connector's host selector.

Provide recipient-accessible instructions and evidence, not a prompt whose only
action is to open an inaccessible path. If no route exists, preserve the request
as pending/blocked and name the exact missing read/write/notification capability.
For a user relay, give a self-contained payload; for a supported intermediary,
use the existing private Git/filesystem/mail route rather than inventing a service.

For a human upload, separate the copy-paste prompt from the user's file instructions.
The remote prompt refers to the attachment by filename and, when available, hash,
or to its verified remote object/link. It must not ask the remote agent to open a
sender-local path. At the end of the user-facing turn, list the full absolute local
paths of referenced artifacts as plain text in a file footer, outside that prompt
(before any required session-identity trailer). A clickable local link alone is
insufficient for uploading. Include only paths appropriate for that user/surface;
never put credentials or private locators in a public footer.

## Return path and ownership

Confirm how the actual recipient authors and returns ACK and result. If it cannot
write local outboxes, retain its native response at its actual accessible resource
with author/object/version evidence. A relay may record an observation in its own
outbox but must not use the recipient's actor identity or manufacture a filesystem
ACK. The helper's ACK/result may remain unverified even when attributed native
evidence exists. State those limits explicitly; provider acceptance, recipient ACK,
work result and owner acceptance are different facts.

Loading the skill also requires reachability: an absolute installation path is
useful only on the host that can read it. Transfer the reviewed package through an
authorized accessible resource when needed. A local Markdown link in a sender's
report is not a portable installation or delivery mechanism.
