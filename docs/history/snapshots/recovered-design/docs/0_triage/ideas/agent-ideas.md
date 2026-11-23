# Chronicler

A "history writer" bot who monitors the performance, velocity and effectiveness of all AI sessions.

Use of Chronicler is optional, and the Chronicler will "cache but not commit" session data right away.
The cached sessions can be deleted up to N hours (default 48) of "grace period", whereupon they will be automatically committed to "the knowledge base".
User can also instruct Chronicler directly to save-on-demand or auto-commit.

Each theia workspace will store a persistent "knowledge base",
which will be an evolving structured document store,
in order to enable quick lookup for facts / instructions how to lookup facts.

The Chronicler will, by default, separate "domain specific", "system specific" and "session specific" information.

System specific covers general tool usage, errors, failures, successful patterns; `/postmortem` will "file a report" of some kind of issue with the system described by user in the moment.

Domain specific knowledge base will be some kind of subject-based index of facts, requirements, links to other docs, etc.
It needs to be stored in a format that is sensible to a human, but has machine-indexing for fast lookups.

Domain specific categories can be seeded by the Chronicler, but updated by the user identifying a "Domain Category" (like "TLS", "Legal Writing", "Database Queries", etc)
The same fact can be linked into many categories, and some kind of weighting / professional indexing should be used (MCP-friendly).

Session Specific information should be used like a "domain specific overlay" which only lasts / is visible within the current session.

The Chronicler (or other agents) can still lookup all the global knowledge base, but they can write to non-persistent "cache" and delete it upon session completion.

All knowledge base data should have timestamps, so "period refresh" or "periodic expiry / compression" can happen.

All knowledge persisted should undergo a "sensitivity check", and potentially be flagged as "locked" (cannot leave local agent swarm).
Locked knowledge base material will not be readable by internet-enabled bots.

# Warden

The Warden's job is to protect the user's data.

It must strictly abide by the user's safety protocols,
and is used to scan any input received from Internet-enabled AI backends for exfiltration attempts.

It will also be responsible for deciding whether information committed to the knowledge base should be locked or not (including reason).

Finally, the warden will listen for requests from other bots to request a knowledge unlock for any "potentially relevant, locked knowledge base material",
an unlock request can be issued for the user to grant session-wide access to particular knowledge base items.

In high security mode, the Warden can also proofread prompts going out to Internet-enabled backends,
to flag any potential exfiltration. Medium security mode, only responses from the Internet are filtered (nothing senstive to hide); low security allows knowledge unlocks to apply to all bots and sessions until the process is restarted, or the security mode changes.

# Guru

A Guru type bot is the only bot allowed a connection to the Internet.

There is one by default, but you can spawn more as their context will get polluted over time.

As such, it must have strict exfiltration protection mechansims in place.

It's role is to answer questions about poorly understood subjects;
The Guru bot can:
peruse the user's current "meta session" (ask other bots questions)
peruse the unlocked portions of the knowledge base
ask internet-enabled AI APIs (openai for now) questions and get back "smarter results" - These "backend sessions" should be long-lived; user will need to spawn new Gurus manually.
ask the Warden to sanitize any output received from the internet before reading it.
ask the Warden if there is any locked knowledge base data which may be helpful, in order to request a user unlock

When a guru is asked a question from a bot, that bot transfers the "knowledge it has in use", and the knowledge of any other bots currently working together.
The guru will assess the question, lookup related knowledge, query other bots, and then it will give a "tentative reply" from the "safe knowledge" it already has,
while also crafting a query to send to an Internet-enabled "backend LLM", who can actually read online documentation.

Upon reciept of an answer from the Internet, a Guru will always send the response to The Warden for exfiltration checks.
It receives back the sanitized data, reads it, and either re-queries the backend, or notifies its client of a "final response";
Guru will correct anything that was wrong with the "tentative reply", fill in as many details as possible,
and then deliver a "strictly factual official reply, with confidence levels and cited source links";
the Guru will be under strict requirements that it must never issue any instructions of any kind,
at best it can describe the consequences of a particular action as a means to recommend A or B, but it must never reply with specific instructions. 

Any time an exfiltration check fails, or a Guru/Warden santizes + throws away information, it should be recorded in quarantine (which no machine may ever read).
I fully expect useful things will get culled, and I'll want to periodically review the quarantine myself, if I feel like useful things are being wrongly filtered.