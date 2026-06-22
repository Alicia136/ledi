---
name: Ledi project (formerly Spaceli)
description: Key decisions, gotchas, and architecture for the Ledi Norwegian parking/storage marketplace.
---

## Brand
- Name: **Ledi** (not Spaceli — the old name)
- Logo: "Ledi" in Syne font, white text, with turquoise (#00B4D8) location-pin SVG replacing the dot of the "i" (dotless ı + absolutely-positioned pin). Component: `src/components/LediLogo.tsx`
- Domain: ledi.no · Email: hei@ledi.no
- Utleier slogan: "Ledig plass? Tjen penger."
- Leietaker slogan: "Finn ledig plass nær deg."

## Auth pattern
JWT stored in localStorage as `spaceli_token`. `setAuthTokenGetter(() => localStorage.getItem("spaceli_token"))` must be called in `main.tsx` before the app renders to wire auth into all Orval-generated hooks automatically.

**Why:** The generated `customFetch` in `lib/api-client-react/src/custom-fetch.ts` uses a module-level getter — setting it once at startup covers every hook.

## bcryptjs not bcrypt
Use `bcryptjs` everywhere. `bcrypt` fails to install due to native build script approval issues in the Replit sandbox.

## TanStack Query v5 + Orval: `queryKey` required
When passing `{ query: { enabled: ... } }` to generated hooks, TypeScript requires `queryKey` (a TQ v5 breaking change). Workaround: cast as `any`:
```typescript
{ query: { enabled: !!user } as any }
```

## Vite Fast Refresh: mixed exports
Exporting both a component (`AuthProvider`) and a hook (`useAuth`) from the same file causes the Fast Refresh "incompatible export" warning. The file still works; HMR does a full reload instead of a partial update.

**How to apply:** Split into separate files if clean HMR matters, or accept the warning.

## Fee model
8% from utleier (they receive 92% of list price) + 8% serviceavgift billed to leietaker. Total platform take: ~16%.

## Smart Pris
Purple badge feature (`#8B5CF6`). Utleier selects a bydel (district), platform suggests market-rate pricing from `smartpris` route. Hardcoded districts in `artifacts/api-server/src/routes/smartpris.ts`.

## Map
No Google Maps API key. Stylized SVG grid placeholder with hardcoded price pins — sufficient for demo/MVP.

## Demo accounts (password: passord123)
- demo@leietaker.no (leietaker)
- demo@utleier.no (utleier)  
- admin@spaceli.no (admin)
