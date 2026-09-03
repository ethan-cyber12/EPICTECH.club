# Agent coordination

These rules apply to Codex, Claude, and any other coding agent working in this repository.

## Shared workflow

- Inspect git status before editing.
- Work on a dedicated branch or worktree. Never commit directly to main.
- Own a disjoint file set for each active task. If another agent has modified a target file, stop and coordinate before editing it.
- Preserve unrecognized working-tree changes. Never reset, discard, overwrite, or reformat another agent's work.
- Keep changes task-sized and run the nearest focused tests before the full suite.
- Record findings and unfinished work in the task response or a dedicated handoff file; do not use source comments as a coordination channel.

## Security boundaries

- Never read, expose, copy, log, or commit secret values.
- Cloudflare deployment, DNS, custom-domain, secret, rate-limit, and account-permission changes require owner approval at the final action.
- GitHub merge, branch-protection, environment-secret, and publication changes require owner approval.
- Do not submit Contact or Review forms, send email, publish reviews, or exercise another external side effect without explicit authorization.
- Treat dashboard-managed code as production evidence, not as permission to modify it.

## Current lanes

- Codex owns worker/, tests/intake-worker-security.test.mjs, and the intake security documentation until its current patch is handed off.
- Claude may review those files read-only. Claude should implement unrelated site work only in a separate branch/worktree and must not deploy this Worker.

## Required verification

~~~powershell
npm run test:worker
npm run worker:check
node --test tests/*.test.mjs
python -m unittest discover -s tests -v
npm run site:build
git diff --check
~~~
