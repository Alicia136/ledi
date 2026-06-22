---
name: Socket.io booking lock flow
description: How the 10-min reservation lock, confirm endpoint, and socket events are wired together.
---

# Socket.io Booking Lock Flow

**Rule:** `POST /bookings` creates a `reserved` booking with `lockedUntil = now + 10min`. Only on `POST /bookings/:id/confirm` does it become `confirmed`. Auto-approval spaces skip straight to `confirmed` in the same `POST /bookings` call.

**Why:** Prevents double-booking while giving users time to "pay" (Vipps simulation). A background interval in `index.ts` cleans expired reservations every 30s and emits `space:released`.

**How to apply:**
- `emitSpaceReserved / emitSpaceBooked / emitSpaceReleased` in `lib/io.ts` broadcast to room `space:<id>`.
- Frontend `useSpaceSocket` joins the room and updates map pin colours (green/yellow/red).
- `BookingModal` checks `data.status === "confirmed"` on the create response; if `"reserved"` it shows the 10-min countdown screen with a Vipps confirm button.
- The confirm endpoint validates `booking.lockedUntil > now` before confirming; returns `{ code: "EXPIRED" }` if not.
- `req.params["id"]` is typed `string | string[]` in Express 5 — always cast: `parseInt(String(req.params["id"] ?? ""), 10)`.
