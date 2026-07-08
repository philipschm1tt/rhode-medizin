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

Create branches from the previous milestone branch:

```bash
git checkout master
git pull --ff-only
git checkout -b feature-name

git checkout -b feature-name-m2

git checkout -b feature-name-m3
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
