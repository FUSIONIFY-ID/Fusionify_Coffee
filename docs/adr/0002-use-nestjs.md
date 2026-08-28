# ADR 0002: Use NestJS and PostgreSQL for the Backend

Date: 2026-08-28
Status: Accepted

## Context

The product needs structured APIs and business logic across ordering, payment, rewards, outlets, and future operations.

## Decision

Use:
- NestJS + TypeScript for the application API
- PostgreSQL for relational persistence
- Prisma for database access/schema tooling

## Consequences

Business rules should be centralized server-side where authority matters, including checkout totals, payment state, rewards, and inventory.

Do not create generic layers purely to demonstrate architecture.

## Alternatives Considered

Other backend/database stacks may be viable but are not selected for the initial implementation.
