# Agent Commit Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add repository-level guidance telling agents how to identify, create, and message cohesive commits in this repository.

**Architecture:** `AGENTS.md` is the repository-level instruction file that all agents should read before working here. Add a focused `## Commits` section there so the policy applies to all agents and stays close to the existing spec-driven workflow guidance.

**Tech Stack:** Markdown documentation only.

## Global Constraints

- The policy applies to all agents working in this repository, not only opencode-specific agents.
- Agents should identify cohesive changes that warrant commits while executing implementation plans.
- Agents must commit completed changes when finishing a spec.
- Commit boundaries should favor meaningful units of work, often aligned with implementation-plan steps when those steps are independently coherent.
- Avoid tiny mechanical commits that do not help review or history.
- Avoid broad commits that mix unrelated steps or concerns.
- Match existing repository commit style: short active-voice subjects, no conventional commit prefixes.
- Use commit bodies when helpful to summarize the change, explain reasoning, or include the verbatim prompt that led to the change.
- Before committing, inspect status, diff, and recent log; stage only intended files; and avoid committing secrets or unrelated user changes.

---

### Task 1: Repository Commit Guidance

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: Existing repository guidance in `AGENTS.md`, especially the `## Spec-driven work and ADRs` section.
- Produces: A repository-level `## Commits` section used by future agents before making commits.

- [ ] **Step 1: Add the commits section to `AGENTS.md`**

Add this section after `## Spec-driven work and ADRs` and before `## Style conventions`:

```markdown
## Commits

- As part of spec-driven work, identify cohesive changes that warrant commits while executing implementation plans.
- When completing a spec, commit the completed changes before considering the work done.
- Prefer meaningful commit boundaries. Implementation-plan steps are often suitable commit boundaries when they represent independently coherent changes.
- Avoid tiny mechanical commits that do not help review or history.
- Avoid broad commits that mix unrelated steps or concerns.
- Match existing repository commit messages: short active-voice subjects, no conventional commit prefixes.
- Use commit bodies when helpful to summarize the change, explain reasoning, or include the verbatim prompt that led to the change.
- Before committing, inspect `git status`, `git diff`, and `git log --oneline -10`; stage only intended files; never commit secrets or unrelated user changes.
```

- [ ] **Step 2: Verify documentation consistency**

Run: read `AGENTS.md`.

Expected: `AGENTS.md` contains a `## Commits` section that states agents should identify cohesive commit boundaries, must commit when completing a spec, should match existing active-voice non-conventional commit style, may include useful commit bodies, and must inspect status/diff/log before committing.

- [ ] **Step 3: Run repository verification**

Run: `npm run lint`

Expected: PASS. This is a documentation-only change, but repository guidance says to run lint before considering work done.

- [ ] **Step 4: Review for ADR need**

Review the completed work against the `## Spec-driven work and ADRs` section in `AGENTS.md`.

Expected: no ADR is needed, because this changes repository process guidance and does not introduce an application architecture decision.

- [ ] **Step 5: Commit the completed spec**

Run: `git status --short`, `git diff`, and `git log --oneline -10`.

Expected: only intended documentation changes are staged.

Then run:

```bash
git add AGENTS.md docs/superpowers/specs/2026-07-04-agent-commit-guidance-design.md docs/superpowers/plans/2026-07-04-agent-commit-guidance.md
git commit -m "Add agent commit guidance" -m "Document how agents should identify cohesive commit boundaries, write commit messages, and commit completed spec work."
```

Expected: commit succeeds with the subject `Add agent commit guidance`.

- [ ] **Step 6: Completion summary**

Report the modified files, lint result, commit hash, and that no ADR was added because this is process guidance rather than an application architecture decision.
