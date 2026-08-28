# Contributing

Thank you for contributing to Fusionify Coffee.

## Before You Start

Read:
- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- Relevant documentation and ADRs

## Branching

Use focused branches when practical:

- `feat/<scope>`
- `fix/<scope>`
- `docs/<scope>`
- `refactor/<scope>`
- `chore/<scope>`

Keep a branch focused on one meaningful change.

## Commit Style

Prefer Conventional Commit-style messages:

- `feat: add product modifier selection`
- `fix: prevent duplicate payment settlement`
- `docs: document Android signing policy`
- `refactor: extract payment provider adapter`
- `test: cover rewards ledger reversal`

## Pull Requests

A pull request should explain:
- What changed
- Why it changed
- How it was validated
- Any user-visible behavior change
- Any architecture/security/privacy impact
- Any docs or ADR updated

## Quality Rules

Do not:
- Submit fake functionality
- Add arbitrary design values
- Add gradients
- Commit secrets or keystores
- Introduce dependencies without a reason
- Rewrite working architecture without an accepted reason
- Mark future work as implemented

## Validation

Run checks relevant to the changed area. Examples once the applications exist:

Flutter:
```bash
dart format --set-exit-if-changed .
flutter analyze
flutter test
```

Backend:
```bash
npm run lint
npm test
npm run build
```

If a check cannot be run, state `NOT RUN` and the reason.

## Documentation

Update `docs/PROJECT_STATE.md` when implementation state or next steps materially change.

Create an ADR when changing a durable architecture decision.
