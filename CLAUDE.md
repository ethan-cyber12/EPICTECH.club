# Claude repository guidance

Read and follow [AGENTS.md](AGENTS.md) before making changes.

Use a separate branch or worktree, keep file ownership disjoint from active Codex work, and leave production Cloudflare operations to an explicitly approved deployment step. For the current intake hardening task, review worker/ and tests/intake-worker-security.test.mjs without editing them unless ownership is formally handed over.
