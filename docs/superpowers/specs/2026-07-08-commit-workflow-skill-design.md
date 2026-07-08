# Commit Workflow Skill Design

Create a local `commit-workflow` skill as the single detailed source of truth for agent-created commits in this repository. `AGENTS.md` should only tell agents to invoke the skill before committing.

## Decision

Use a local skill for detailed commit workflow guidance. Replace detailed commit instructions in `AGENTS.md` with a short instruction to use `commit-workflow` before creating any commit.

The skill applies to every agent-created commit, but it should scale its process to the situation. Simple one-commit fixes should stay lightweight. Spec-driven work, multi-step changes, and stacked PR work should receive more structure.

## Scope

This change covers repository process guidance only:

- How agents choose commit boundaries.
- How agents inspect and stage changes before committing.
- How agents write commit messages.
- How agents handle spec-driven commits.
- How agents create, update, and land stacked diffs for ordered milestone work.

This change does not alter application architecture, build behavior, deployment behavior, or content modeling.

## Repository Guidance

`AGENTS.md` should keep only a concise commit trigger:

```markdown
## Commits

- Use the local `commit-workflow` skill before creating any commit in this repository.
```

The detailed existing commit rules should move into the skill so commit mechanics have one source of truth.

## Skill Location

Create the skill at:

```text
.agents/skills/commit-workflow/SKILL.md
```

The skill description should make it mandatory before any agent-created commit in this repository.

## Skill Behavior

The skill should define four paths.

### Simple Commit Path

Use this for small, cohesive changes that should become one commit.

Required behavior:

- Inspect `git status`, `git diff`, and `git log --oneline -10` before committing.
- Confirm the diff only includes intended files.
- Run required verification where appropriate, including repository-required lint before considering work done.
- Stage only intended files.
- Write a short active-voice commit subject matching repository history, without conventional commit prefixes.
- Use a commit body only when it helps summarize the change, explain reasoning, or preserve the relevant prompt.
- Never commit secrets or unrelated user changes.

### Spec-Driven Path

Use this when completing a written spec or implementation plan.

Required behavior:

- Identify cohesive commit boundaries while executing the plan.
- Prefer meaningful commits aligned with independently coherent implementation-plan steps.
- Avoid tiny mechanical commits that do not help review or history.
- Avoid broad commits that mix unrelated concerns.
- Commit completed spec work before considering the spec done.
- Include verification results and ADR status in the completion summary.

### Multi-Step Path

Use this for work that is not necessarily spec-driven but naturally contains multiple coherent phases.

Required behavior:

- Decide whether one commit or multiple commits will make review and history clearer.
- Prefer fewer meaningful commits over many mechanical commits.
- Keep each commit internally coherent and buildable where feasible.
- Re-run relevant verification after the final commit boundary is assembled.

### Stacked Diff Path

Use this for spec-driven work split into ordered dependent milestones.

Required behavior:

- Prefer stacked PRs by default for ordered milestone work.
- Create each milestone branch from the previous milestone branch.
- Open each milestone PR against the previous milestone branch, with the first PR targeting `master`.
- Keep each PR reviewable on its own: one milestone, cohesive commits, clear verification notes.
- Update stacks with rebase-based workflows when necessary, using `--force-with-lease` for rebased stack branches.
- Land stacks bottom-up.
- After merging the lowest PR into `master`, rebase the next branch onto `master`, push with `--force-with-lease`, and retarget that PR to `master`.
- Do not delete intermediate branches until downstream PRs have been rebased or retargeted.
- Check PR base/head relationships with `gh pr view` before retargeting or landing.

## Safety Rules

The skill should explicitly prohibit:

- Destructive commands such as `git reset --hard` or `git checkout --` unless the user explicitly requests or approves them.
- Amending commits unless explicitly requested.
- Force-pushing except with `--force-with-lease` after intentional rebase of a branch owned by the current task.
- Staging unrelated user changes.
- Committing `.env` files, credentials, generated secrets, or unrelated local artifacts.

## Verification

This implementation is documentation and skill configuration. Verification should include:

- Reading `AGENTS.md` to confirm detailed commit guidance was replaced by the skill trigger.
- Reading `.agents/skills/commit-workflow/SKILL.md` to confirm it covers simple commits, spec-driven commits, multi-step commits, stacked diffs, and safety rules.
- Running `pnpm lint`, because repository guidance requires lint before considering work done.

## ADR Review

No ADR is expected. This is repository process guidance and a local agent skill, not an application architecture decision.
