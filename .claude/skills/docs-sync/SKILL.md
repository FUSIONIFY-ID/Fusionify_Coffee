---
name: docs-sync
description: Synchronize Fusionify Coffee documentation with actual implementation changes.
---

# Documentation Sync

1. Inspect the implementation diff.
2. Identify affected product, architecture, platform, security, privacy, and integration docs.
3. Update only documents whose facts changed.
4. Update `PROJECT_STATE.md` if state changed.
5. Add/update an ADR for durable architecture changes.
6. Do not rewrite unrelated docs for style.
7. Do not turn plans into completed claims.
8. Keep provider-specific details under `docs/integrations/`.
