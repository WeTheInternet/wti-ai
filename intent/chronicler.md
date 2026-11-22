# Chronicler and Commit Discipline

## Purpose

Chronicler records what happened and helps turn in-memory progress into durable records.

The project discussion sharpened an important distinction:
- logging should be broad
- authority should be explicit

## Two recording modes

### 1. Chronological recording

Chronicler should be able to record the full story:
- prompts
- turns
- agent comments
- branch activity
- proposed summaries
- work reports
- unresolved concerns

This is non-authoritative by default.

### 2. Authoritative commits

Authoritative state should only be written when intentionally committed.

Examples:
- commit accepted intent
- commit fact
- commit spec
- commit branch summary
- archive superseded branch
- promote knowledge candidate

The user specifically asked for something like a `commit idea` action.
That fits well here.

## Why this matters

Without this separation, one of two failures happens:

### Failure A: nothing useful is preserved
Important thoughts evaporate when sessions end.

### Failure B: everything becomes accidental truth
A stray idea in a conversation poisons downstream retrieval.

The system must avoid both.

## Good chronicler actions

Likely explicit actions include:
- record conversation
- save idea
- commit accepted intent
- commit fact
- commit branch summary
- archive branch
- promote knowledge
- deprecate active record

## Relationship to deliberation

Chronicler should not decide the content of deliberation.

It should:
- capture it
- summarize candidates
- help package it for commit
- preserve links between summary and full thread

## Relationship to graveyard

When authoritative material is replaced, Chronicler should help move the old material to archive/graveyard with:
- forward links
- replacement pointers
- timestamps
- optional rationale pointer

## Working rule

Record generously.
Promote deliberately.
