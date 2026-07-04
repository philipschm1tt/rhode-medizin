# ADR Completion Process Design

Add repository-level guidance so every completed spec implementation includes an explicit review for significant architecture decisions. Agents should document those decisions as ADRs in `docs/adrs/` when they exist.

## Decision

Use `AGENTS.md` as the source of truth for this repository's ADR completion process. Add a small `docs/adrs/README.md` to define the directory, filename pattern, and sparse-content expectations.

This is a project-specific completion gate, not a reusable cross-repository workflow. A custom skill is unnecessary unless the same ADR process should be enforced across multiple repositories.

## Scope

The rule applies to every spec implementation in this repository, including future work by any agent.

## Required Behavior

When finishing a spec implementation, the agent must:

- Review the completed work for significant architecture decisions.
- Add ADRs under `docs/adrs/` for significant decisions that are not already documented.
- Use filenames like `adr_01_astro.md`, with the next available two-digit number and a short lowercase topic.
- Keep ADR content sparse when necessary; include reasons only when the reason is known from the spec, implementation, or conversation.
- Avoid inventing rationale.
- Skip ADRs for routine implementation details.
- Mention whether ADRs were added or not in the completion summary.

## ADR Shape

ADRs should be Markdown files with at least:

- Title.
- Status.
- Context.
- Decision.
- Consequences.

Sections can be brief. Unknown rationale should be omitted or stated as not documented, rather than guessed.

## Verification

This change is documentation-only. Verification is reading `AGENTS.md` and `docs/adrs/README.md` to confirm the process is clear and consistent.
