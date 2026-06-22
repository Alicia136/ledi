---
name: Dashboard live status card
description: The liveStatus array returned by GET /dashboard/owner and how the frontend renders it.
---

# Dashboard Live Status

**Rule:** The `GET /dashboard/owner` API returns a `liveStatus` array alongside the existing stats. It is not defined in the OpenAPI spec, so access it as `(dashboard as any)?.liveStatus`.

**Why:** Adding it to the OpenAPI spec would require regenerating hooks and could conflict with the existing generated `DashboardResponse` type. The `as any` cast is a known pragmatic trade-off here.

**Shape per item:**
```ts
{
  spaceId: number;
  tittel: string;
  status: "available" | "reserved" | "booked";
  booking?: {
    leietakerNavn: string | null;
    sluttDato: string;    // ISO datetime
    totalPris: number;
  } | null;
}
```

**How to apply:** The `LiveStatusCard` component in `dashboard.tsx` renders a countdown of remaining time for active bookings (updates every second via `useEffect` + `setInterval`). Colour coding: green = available, amber = reserved, red = booked.
