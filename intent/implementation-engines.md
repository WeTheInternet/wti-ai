# Implementation engines

## Purpose

Define how accepted intent becomes executed work through pluggable implementation engines.

## Finalize intent gate

Before any engine executes significant work, the Conductor should require a “Finalize intent” gate.

The gate confirms:
- the current intent text is sufficiently explicit for execution
- constraints and acceptance criteria are present when needed
- the user understands what will be acted upon

## ImplementationEngine

An ImplementationEngine is a pluggable executor that:
- consumes accepted intent (and optional spec/work plan)
- proposes or performs bounded actions
- produces artifacts for validation

Engines are chosen explicitly based on intent type and context.

## First engine: SoftwareImplementationEngine

The first engine targets software delivery:
- produces a work plan and/or bounded tasks
- edits code and tests within declared scope
- runs validations when authorized
- reports results with links back to intent and changes

## Future engines (non-binding)

- KnowledgeImplementationEngine
- LawImplementationEngine
- StoryImplementationEngine

## v0 acceptance criteria

- A SoftwareImplementationEngine exists as an identifiable engine.
- The Conductor requires a “Finalize intent” confirmation before the engine runs.
- Engine output is linkable back to the accepted intent and resulting artifacts.
