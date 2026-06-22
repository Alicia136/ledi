---
name: Composite tsconfig for lib project references
description: lib/* packages referenced from artifact tsconfigs must have composite:true set
---

When an artifact (e.g. spaceli) has a `references` entry pointing to a `lib/*` package in its `tsconfig.json`, that lib must declare `"composite": true` (plus `declaration`, `declarationMap`, `emitDeclarationOnly`) or tsc throws TS6306: "Referenced project must have setting 'composite': true".

**Why:** TypeScript project references require the referenced project to be a composite project so tsc can build it incrementally and find its declaration output.

**How to apply:** When adding a new lib/* to `references` in an artifact tsconfig, always also:
1. Add `composite`, `declaration`, `declarationMap`, `emitDeclarationOnly` to the lib's `tsconfig.json`
2. Add the lib to the root `tsconfig.json` references array (for `typecheck:libs` to build it)
3. Run `pnpm run typecheck:libs` to emit declarations before leaf typecheck
