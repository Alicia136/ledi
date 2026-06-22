---
name: pnpm overrides literal versions
description: pnpm.overrides in root package.json must use literal version strings, not $catalog refs
---

Root `package.json` `pnpm.overrides` does NOT support `"$react"` catalog-ref syntax.

**Why:** pnpm resolves `$react` as a version from direct root dependencies, but root has no `react` dep — install fails with "Cannot resolve version $react in overrides. The direct dependencies don't have dependency 'react'".

**How to apply:** Use the exact catalog version string:
```json
"pnpm": {
  "overrides": {
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```
Look up the version from `pnpm-workspace.yaml` catalog section.
