---
name: Orval codegen api-zod index.ts conflict fix
description: Orval split mode regenerates lib/api-zod/src/index.ts on every codegen run, causing TS2308 name conflicts between Zod validators (api.ts) and TS types (types/).
---

## The rule

After orval codegen runs, `lib/api-zod/src/index.ts` is regenerated to re-export from both `./generated/api` (Zod schemas) AND `./generated/types` (TS interfaces). For endpoints with both path params AND query params, orval gives the same name (e.g. `GetAvailableTimesParams`) to both — causing TS2308 "already exported a member" error.

**Fix:** The codegen script in `lib/api-spec/package.json` overwrites the generated index.ts after orval runs, keeping only the Zod validators export:

```json
"codegen": "orval --config ./orval.config.ts && node -e \"require('fs').writeFileSync('../api-zod/src/index.ts', \\\"export * from './generated/api';\\\\n\\\")\" && pnpm -w run typecheck:libs"
```

**Why:** The `types/` directory exports TypeScript interfaces, which are redundant — all types can be inferred from Zod schemas via `z.infer<>`. The only real consumer of `@workspace/api-zod` is the backend, which needs the Zod `.parse()` validators from `api.ts`.

**How to apply:** Any time you change `lib/api-spec/openapi.yaml` and run codegen, this patch runs automatically. If you add a new endpoint with both path and query params, the existing fix will still handle it.
