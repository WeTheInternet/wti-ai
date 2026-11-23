# Retrieval and Deephaven Notes (Critical Early Review)

## Purpose

This file captures a critical review of the speculative Deephaven retrieval design notes supplied during discussion.

The idea is promising, but several parts are too eager to hard-code implementation details before the product workflow is proven.

## What is good in the proposal

The proposal correctly notices that the system may eventually need:

- graph-shaped retrieval
- temporal awareness
- conflict/invalidation support
- multiple levels of detail
- constraint joins
- prompt-fragment compilation for downstream workers

Those are all real needs.

## Main critique: do not let storage shape the product too early

The biggest risk is accidentally making the physical data model become the conceptual product model.

Examples of overfitting risk:
- treating graph N-hop retrieval as the main reasoning primitive
- assuming the best prompt is always the graph neighborhood
- assuming full AST retrieval for direct targets is usually wise
- defining system behavior too tightly around one exact table layout

The product needs to answer human workflow questions first.
The storage/query layer should serve that.

## Specific critique of the proposed operations

### "Neighborhood Search" (N-Hop Join)

Promising idea:
- related items do matter
- local graph traversal will likely be needed

Critical note:
- raw N-hop expansion is often too blunt
- most tasks want "active authoritative state plus one or two supporting summaries," not every reachable node
- status and supersession filters matter more than hop-count purity

Recommendation:
- start with staged retrieval driven by active object type and summary layers
- keep graph expansion as a fallback or drill-down tool

### "Dead Intent" filtering

Promising idea:
- superseded/rejected state should not poison active context

Critical note:
- "dead" is domain-relative
- rejected proposals may still be highly relevant during deep review
- archive should be hidden by default, not destroyed

Recommendation:
- think in terms of active / superseded / archived / drill-down-needed
- preserve discoverability even when excluded from default context

### "LOD Filter"

Promising idea:
- different items need different resolution

Critical note:
- LOD should not be driven only by graph distance
- importance, authority, current activity, and summary availability matter more than hop count alone

Recommendation:
- prefer a retrieval policy like:
  - current authoritative object at highest useful detail
  - approved summaries for nearby branches
  - global constraints at compact rule form
  - deep/raw source only on demand

### "Temporal Conflict" Detection

Promising idea:
- a session can become stale when governing truth changes

Critical note:
- full bi-temporal precision is powerful but expensive
- you do not need perfect temporal algebra on day one to get useful invalidation

Recommendation:
- preserve timestamps and supersession links now
- surface "context may be stale" warnings
- build more formal temporal conflict logic later if the workflow proves it necessary

### "Constraint Intersection" Join

Promising idea:
- file or artifact changes should be checkable against system-wide constraints

Critical note:
- this is very likely useful
- but it should be driven by human-facing concepts too, not just filenames

Recommendation:
- model constraints in both human and machine-legible forms
- support joins by file/module/component/spec area when available

## Critique of the "Constitution beats Proposal" rule

The principle is sound:
higher-order governing constraints should outrank lower-order proposals.

The danger is pretending hierarchy is always obvious.

Recommendation:
- keep the concept
- avoid fully automatic silent override until hierarchy and provenance are reliable

## Gradle/build-system analogy critique

The intuition that deliberation invalidation feels like a build graph is useful.

What is useful in the analogy:
- dependency edges
- incremental recomputation
- dirty marking
- summaries as built artifacts

What is risky:
- implementing a giant reactive build engine before the product's human workflow is proven
- assuming every change must eagerly cascade
- making the system feel like infrastructure instead of guidance

Recommendation:
- borrow the mental model
- do not prematurely rebuild the whole project as Gradle-in-disguise

## Working rule

Use Deephaven and graph logic to serve governed retrieval.
Do not let retrieval mechanics become the product.
