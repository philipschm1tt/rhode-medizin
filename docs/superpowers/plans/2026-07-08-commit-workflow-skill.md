# Commit Workflow Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a local commit workflow skill and make it mandatory before every agent-created commit in this repository.

**Architecture:** `AGENTS.md` remains the concise repository policy entry point. The detailed commit, staging, verification, and stacked diff procedure lives in `.agents/skills/commit-workflow/SKILL.md` as the single detailed source of truth. This avoids duplicating workflow mechanics between repository instructions and the skill.

**Tech Stack:** Markdown documentation and local OpenCode skill metadata.

## Global Constraints

- Use the design spec at `docs/superpowers/specs/2026-07-08-commit-workflow-skill-design.md` as the source of truth.
- The skill applies before every agent-created commit in this repository.
- `AGENTS.md` must not duplicate detailed commit workflow rules; it should only point agents to the skill.
- Simple one-commit fixes should remain lightweight.
- Spec-driven work, multi-step changes, and stacked PR work should receive more structure.
- Prefer stacked PRs by default for spec-driven work split into ordered dependent milestones.
- Do not alter application architecture, build behavior, deployment behavior, or content modeling.
- Run `pnpm lint` before considering work done.
- No ADR is expected because this is repository process guidance and a local agent skill, not an application architecture decision.

---

### Task 1: Commit Workflow Skill And Repository Trigger

**Files:**
- Create: `.agents/skills/commit-workflow/SKILL.md`
- Modify: `AGENTS.md`
- Existing spec: `docs/superpowers/specs/2026-07-08-commit-workflow-skill-design.md`

**Interfaces:**
- Consumes: Existing `AGENTS.md` sections `## Commits`, `## Spec-driven work and ADRs`, and repository command guidance.
- Produces: Local skill `commit-workflow`, mandatory before any agent-created commit; concise `AGENTS.md` commit trigger that references the skill.

- [ ] **Step 1: Create the skill directory**

Run:

```bash
mkdir -p .agents/skills/commit-workflow
```

Expected: command exits successfully and `.agents/skills/commit-workflow/` exists.

- [ ] **Step 2: Create `.agents/skills/commit-workflow/SKILL.md`**

Create `.agents/skills/commit-workflow/SKILL.md` with exactly this content:

```markdown
---
name: commit-workflow
description: |
  Mandatory before creating any commit in this repository. Use this skill to inspect changes, choose commit boundaries, stage intended files only, write repository-style commit messages, and handle stacked diffs for ordered milestone work.
---

# Commit Workflow

Use this skill before creating any commit in this repository.

The process scales to the change. Simple one-commit fixes should stay lightweight. Spec-driven work, multi-step changes, and stacked PR work require more structure.

## Required First Checks

Before staging or committing, inspect the current repository state:

```bash
git status --short
git diff
git log --oneline -10
```

Confirm:

- The worktree does not contain unrelated changes that would be staged accidentally.
- The diff contains only intended files for the commit being created.
- No `.env` files, credentials, generated secrets, or unrelated local artifacts are included.
- The commit message style matches recent repository history: short active-voice subjects, no conventional commit prefixes.

If unrelated user changes exist, leave them unstaged. If unrelated changes overlap with the files required for the commit, stop and ask the user how to proceed.

## Simple Commit Path

Use this path for small, cohesive changes that should become one commit.

1. Inspect repository state with the required first checks.
2. Run required verification for the files changed. If the work is ready to complete, run `pnpm lint` because the repository requires lint before considering work done.
3. Stage only intended files with explicit paths.
4. Commit with a short active-voice subject.
5. Add a commit body only when it helps summarize the change, explain reasoning, or preserve the relevant prompt.

Example:

```bash
git add AGENTS.md .agents/skills/commit-workflow/SKILL.md docs/superpowers/specs/2026-07-08-commit-workflow-skill-design.md docs/superpowers/plans/2026-07-08-commit-workflow-skill.md
git commit -m "Add commit workflow skill" -m "Document the required commit process for simple commits, spec-driven work, multi-step changes, and stacked diffs."
```

## Spec-Driven Path

Use this path when completing a written spec or implementation plan.

1. Identify cohesive commit boundaries while executing the plan.
2. Prefer meaningful commits aligned with independently coherent implementation-plan steps.
3. Avoid tiny mechanical commits that do not help review or history.
4. Avoid broad commits that mix unrelated concerns.
5. Run the verification commands required by the plan and repository guidance.
6. Review whether ADRs are needed under `docs/adrs/` before considering the spec done.
7. Commit completed spec work before reporting completion.
8. In the completion summary, state verification results and whether ADRs were added or why none were needed.

## Multi-Step Path

Use this path for work that is not necessarily spec-driven but naturally contains multiple coherent phases.

1. Decide whether one commit or multiple commits will make review and history clearer.
2. Prefer fewer meaningful commits over many mechanical commits.
3. Keep each commit internally coherent and buildable where feasible.
4. Inspect `git diff` before each commit boundary.
5. Re-run relevant verification after the final commit boundary is assembled.

## Stacked Diff Path

Use this path for spec-driven work split into ordered dependent milestones.

Prefer stacked PRs by default when milestones build on each other sequentially and each milestone can be reviewed independently. Do not use a stack for independent changes that can target `master` separately, small single-PR changes, or work where the user explicitly asks for a flat branch or PR.

### Creating A Stack

Use branch names that make order obvious, such as:

```text
feature-name
feature-name-m2
feature-name-m3
```

Create each next branch only after the previous milestone has been committed, so downstream branches contain the work they build on:

```bash
git checkout master
git pull --ff-only
git checkout -b feature-name
# implement and commit milestone 1 on feature-name

git checkout -b feature-name-m2
# implement and commit milestone 2 on feature-name-m2

git checkout -b feature-name-m3
# implement and commit milestone 3 on feature-name-m3
```

Open PRs bottom-up, with each PR targeting the previous branch:

```bash
gh pr create --base master --head feature-name --title "Feature M1: foundation" --body "Implements milestone 1."
gh pr create --base feature-name --head feature-name-m2 --title "Feature M2: follow-up" --body "Implements milestone 2."
gh pr create --base feature-name-m2 --head feature-name-m3 --title "Feature M3: completion" --body "Implements milestone 3."
```

Each stacked PR should contain one milestone, cohesive commits, verification notes, and ADR status when relevant.

### Updating A Stack

When review feedback changes a lower branch, rebase downstream branches as needed and push with `--force-with-lease`:

```bash
git checkout feature-name-m2
git rebase feature-name
git push --force-with-lease

git checkout feature-name-m3
git rebase feature-name-m2
git push --force-with-lease
```

Before retargeting or landing, inspect PR relationships:

```bash
gh pr view <number> --json baseRefName,headRefName,title
```

### Landing A Stack

Land stacks bottom-up.

After merging the lowest PR into `master`, rebase the next branch onto `master`, push with `--force-with-lease`, and retarget that PR to `master`:

```bash
git fetch origin
git checkout feature-name-m2
git rebase origin/master
git push --force-with-lease
gh pr edit <m2-pr-number> --base master
```

Then review and merge that PR, and repeat for the next branch.

Do not delete intermediate branches until downstream PRs have been rebased or retargeted.

## Safety Rules

- Do not use destructive commands such as `git reset --hard` or `git checkout --` unless the user explicitly requests or approves them.
- Do not amend commits unless explicitly requested.
- Do not force-push except with `--force-with-lease` after an intentional rebase of a branch owned by the current task.
- Do not stage unrelated user changes.
- Do not commit `.env` files, credentials, generated secrets, or unrelated local artifacts.
- Do not update git config, skip hooks, use interactive git commands, or create empty commits unless explicitly requested.
```

Expected: `.agents/skills/commit-workflow/SKILL.md` exists and contains frontmatter with `name: commit-workflow` and a description that says it is mandatory before creating any commit in this repository.

- [ ] **Step 3: Replace detailed commit guidance in `AGENTS.md`**

Replace the existing `## Commits` section in `AGENTS.md` with exactly this section:

```markdown
## Commits

- Use the local `commit-workflow` skill before creating any commit in this repository.
```

Expected: `AGENTS.md` still has a `## Commits` section, and that section contains only the skill trigger above.

- [ ] **Step 4: Read back the changed files**

Run the equivalent of reading these files:

```text
AGENTS.md
.agents/skills/commit-workflow/SKILL.md
```

Expected:

- `AGENTS.md` references `commit-workflow` before any commit and does not duplicate detailed commit mechanics.
- `.agents/skills/commit-workflow/SKILL.md` covers required first checks, simple commits, spec-driven commits, multi-step commits, stacked diffs, and safety rules.

- [ ] **Step 5: Run repository verification**

Run:

```bash
pnpm lint
```

Expected: PASS.

If `pnpm lint` fails because of formatting in the edited Markdown files, run:

```bash
pnpm format
pnpm lint
```

Expected after formatting: PASS.

- [ ] **Step 6: Review ADR need**

Review the completed work against the `## Spec-driven work and ADRs` section in `AGENTS.md`.

Expected: no ADR is added, because this change creates repository process guidance and a local agent skill, not an application architecture decision.

- [ ] **Step 7: Use the new commit workflow before committing**

Follow `.agents/skills/commit-workflow/SKILL.md` simple commit path.

Run:

```bash
git status --short
git diff
git log --oneline -10
```

Expected:

- `AGENTS.md` is modified.
- `.agents/skills/commit-workflow/SKILL.md` is new.
- `docs/superpowers/specs/2026-07-08-commit-workflow-skill-design.md` is new if it has not already been committed.
- `docs/superpowers/plans/2026-07-08-commit-workflow-skill.md` is new if it has not already been committed.
- No unrelated files, secrets, or local artifacts are staged.

- [ ] **Step 8: Commit intended files**

Stage only intended files:

```bash
git add AGENTS.md .agents/skills/commit-workflow/SKILL.md docs/superpowers/specs/2026-07-08-commit-workflow-skill-design.md docs/superpowers/plans/2026-07-08-commit-workflow-skill.md
```

Commit:

```bash
git commit -m "Add commit workflow skill" -m "Document the required commit process for simple commits, spec-driven work, multi-step changes, and stacked diffs."
```

Expected: commit succeeds with subject `Add commit workflow skill`.

- [ ] **Step 9: Completion summary**

Report:

- Modified files.
- Verification command result for `pnpm lint`.
- Commit hash.
- ADR status: no ADR added because this is repository process guidance and a local agent skill, not an application architecture decision.
