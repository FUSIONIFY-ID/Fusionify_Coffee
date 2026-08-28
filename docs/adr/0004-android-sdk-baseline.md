# ADR 0004: Android API 28 Minimum and API 36 Target Baseline

Date: 2026-08-28
Status: Accepted

## Context

Fusionify Coffee is a consumer application where unnecessarily excluding Android 9–11 users has little product benefit, while the project must also meet current modern Android/Play expectations.

## Decision

Initial Android baseline:
- minSdk 28
- compileSdk 36
- targetSdk 36
- no maxSdk

## Consequences

Dependencies must support API 28.

New Android behavior associated with the selected target SDK must be tested intentionally.

Target/compile SDK may increase later without automatically raising minSdk.

## Alternatives Considered

minSdk 31 was considered but rejected for the initial product because it would unnecessarily reduce device coverage.
