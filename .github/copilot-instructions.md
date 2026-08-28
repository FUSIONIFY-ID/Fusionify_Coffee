# GitHub Copilot Repository Instructions

Follow `AGENTS.md` as the primary repository instruction set.

Before material changes, inspect `docs/PROJECT_STATE.md`, the relevant product/architecture docs, and applicable ADRs.

Key constraints:
- No AI slop
- No vibe coding
- No AI-style overengineering
- No gradients
- No secrets or keystores in Git
- No payment-provider private API calls from Flutter
- Use design tokens instead of arbitrary visual values
- Preserve Android API 28+ compatibility while targeting API 36
- Do not claim tests passed unless they were executed
