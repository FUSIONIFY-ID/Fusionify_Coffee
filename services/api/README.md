# Fusionify Coffee API

NestJS backend for Fusionify Coffee.

## Stack

- Node.js 24 LTS
- NestJS 11
- TypeScript
- PostgreSQL
- Prisma 7

## Current Scope

Milestone 0.1 currently includes:
- `GET /v1/health`
- `GET /v1/catalog/preview`
- Initial Prisma schema for outlet, category, product, modifier group, and modifier option
- Preview catalog tests

The preview endpoint is development data and is not connected to PostgreSQL yet.

## Development

```bash
npm ci
npm run start:dev
```

## Validation

```bash
npm run lint
npm test -- --runInBand
npm run test:e2e
npm run build
```

## Security

Provider credentials, payment secrets, database credentials, and signing material must not be committed.

Payment-provider integrations belong behind the server-side provider adapter described in `../../docs/integrations/PAYMENTS.md`.

## Repository Rules

Read the root `AGENTS.md` and `docs/PROJECT_STATE.md` before material changes.
