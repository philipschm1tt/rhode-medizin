# Agent Commit Guidance Design

Add repository-level guidance so agents know how to split and write commits in this repository, especially when completing spec-driven work.

## Decision

Use `AGENTS.md` as the source of truth for commit guidance. The policy applies to all agents working in this repository, not only opencode-specific agents.

## Scope

The guidance applies whenever agents commit changes in this repository. It specifically extends the spec-driven process: agents should identify cohesive changes that warrant commits while executing implementation plans, and they must commit completed changes when finishing a spec.

## Required Behavior

Agents should:

- Identify cohesive changes that warrant commits while executing implementation plans.
- Commit completed changes when finishing a spec.
- Prefer meaningful commit boundaries, often aligned with implementation-plan steps when those steps are independently coherent.
- Avoid tiny mechanical commits that do not help review or history.
- Avoid broad commits that mix unrelated steps or concerns.
- Match existing repository commit style: short active-voice subjects, no conventional commit prefixes.
- Use commit bodies when helpful to summarize the change, explain reasoning, or include the verbatim prompt that led to the change.
- Before committing, inspect status, diff, and recent log; stage only intended files; and avoid committing secrets or unrelated user changes.

## Verification

This change is documentation-only. Verification is reading `AGENTS.md` to confirm the commit policy is clear and consistent, then running `npm run lint` because repository guidance requires lint before considering work done.
