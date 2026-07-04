# ADR Completion Process Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure every completed spec implementation in this repository includes an explicit review for significant architecture decisions and documents them as ADRs when needed.

**Architecture:** Add the completion rule to `AGENTS.md`, because it is the repository-level instruction file all agents should read before working here. Add `docs/adrs/README.md` so the ADR directory has concrete naming and content rules.

**Tech Stack:** Markdown documentation only.

## Global Constraints

- The rule applies to every spec implementation in this repository, including future work by any agent.
- ADRs live under `docs/adrs/`.
- ADR filenames use the pattern `adr_01_astro.md`: next available two-digit number plus short lowercase topic.
- ADR content may be sparse; include reasons only when known from the spec, implementation, or conversation.
- Do not invent rationale.
- Skip ADRs for routine implementation details.
- Mention whether ADRs were added or not in the completion summary.

---

### Task 1: Repository ADR Process Guidance

**Files:**
- Modify: `AGENTS.md`
- Create: `docs/adrs/README.md`

**Interfaces:**
- Consumes: Existing repository guidance in `AGENTS.md`.
- Produces: A repository-level ADR completion rule and ADR directory guidance.

- [ ] **Step 1: Add the ADR process section to `AGENTS.md`**

Add this section after the existing Architecture section and before Style conventions:

```markdown
## Spec-driven work and ADRs

- For every completed spec implementation, review the work for significant architecture decisions before considering the task done.
- Document significant architecture decisions in `docs/adrs/` when they are not already covered by an existing ADR.
- ADR filenames use the next available two-digit number plus a short lowercase topic, e.g. `adr_01_astro.md`.
- Keep ADRs concise. Include reasons only when they are known from the spec, implementation, or conversation; do not invent rationale.
- Skip ADRs for routine implementation details, small refactors, or decisions already documented elsewhere.
- In the completion summary, state whether ADRs were added or why none were needed.
```

- [ ] **Step 2: Create `docs/adrs/README.md`**

Create the file with this content:

````markdown
# Architecture Decision Records

This directory contains ADRs for significant architecture decisions made while implementing specs in this repository.

Create an ADR when a completed spec implementation introduces or confirms a significant architecture decision that is not already documented. Do not create ADRs for routine implementation details, small refactors, or decisions already covered by an existing ADR.

## Filenames

Use the next available two-digit number and a short lowercase topic:

```text
adr_01_astro.md
adr_02_contentful_loader.md
```

## Content

ADRs may be sparse. Include only rationale that is known from the spec, implementation, or conversation. Do not invent reasons to make the record look complete.

Use this shape when creating a new ADR:

```markdown
# ADR 01: Decision Title

## Status

Accepted

## Context

Briefly describe the situation that required a decision.

## Decision

State the decision.

## Consequences

List known consequences. If no consequences are known yet, say so.
```
````

- [ ] **Step 3: Verify documentation consistency**

Run: read `AGENTS.md` and `docs/adrs/README.md`.

Expected: both files describe the same ADR trigger, filename pattern, sparse-content rule, and no-invented-rationale rule.

- [ ] **Step 4: Run repository verification**

Run: `npm run lint`

Expected: PASS. This is a documentation-only change, but repository guidance says to run lint before considering work done.

- [ ] **Step 5: Completion summary**

Report the modified files, the lint result, and whether ADRs were added. This process change creates the ADR directory README but does not add an ADR for itself because it does not record an application architecture decision.
