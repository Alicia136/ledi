# Spaceli

Norwegian parking and storage space marketplace. Lets anyone earn money on idle parking/storage space by renting it to others.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/spaceli run dev` — run the frontend (port 18362, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate React Query hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (Tailwind v4, shadcn/ui, framer-motion, wouter)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (SESSION_SECRET), token stored in `localStorage` as `ledi_token`, auto-injected via `setAuthTokenGetter` in main.tsx
- Auth library: bcryptjs (NOT bcrypt — native build issues)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/spaceli/src/pages/` — frontend pages (home, login, register, dashboard, my-bookings, admin, legal)
- `artifacts/spaceli/src/components/` — SpaceCard, BookingModal, RegisterSpacePanel, MapPlaceholder, Navbar
- `artifacts/spaceli/src/lib/auth-context.tsx` — AuthProvider + useAuth hook
- `artifacts/api-server/src/routes/` — auth, spaces, bookings, reviews, admin, smartpris, health
- `artifacts/api-server/src/lib/auth.ts` — requireAuth, requireAdmin, getUser, signToken, verifyToken
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/api.ts` — generated hooks (do not edit manually)
- `lib/db/src/schema.ts` — DB schema (users, spaces, prices, bookings, reviews)

## Architecture decisions

- JWT auth stored in localStorage as `ledi_token`. `setAuthTokenGetter(() => localStorage.getItem("ledi_token"))` wires the auth into every generated API hook automatically.
- Fee model: 8% from utleier + 8% serviceavgift from leietaker = 16% total platform take.
- Smart Pris is a purple-badge feature: utleier picks a bydel, platform suggests dynamic market pricing.
- No Stripe, no Google Maps API — map is a stylized SVG placeholder with price pins.
- bcryptjs replaces bcrypt everywhere due to native module build issues in the sandbox.

## Product

- Homepage: hero + search + filter tabs + placeholder map with price pins + space cards with price grids
- Space cards: type badge, Smart Pris badge, multi-period price grid (BEST highlighted)
- Booking modal: period selection, availability days, price breakdown with 8% fee, one-click booking
- Register panel (slide-in): 2-step form — space info + free/smart pricing
- Login / Register pages with demo account hints
- Utleier dashboard: earnings stats, recent bookings, my spaces list
- Leietaker: my bookings page with cancellation
- Admin: stats, approve pending spaces, all bookings table
- Legal: Personvern, Vilkår, Standard Leiekontrakt pages

## Demo accounts

All password: `passord123`

- Leietaker: demo@leietaker.no
- Utleier: demo@utleier.no
- Admin: admin@spaceli.no

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`.
- bcrypt won't install; use bcryptjs only.
- TanStack Query v5 + Orval: when passing `{ query: { enabled: ... } }`, TypeScript requires `queryKey`. Workaround: cast as `any`.
- The auth token getter must be set in `main.tsx` before the app renders, using `setAuthTokenGetter`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
