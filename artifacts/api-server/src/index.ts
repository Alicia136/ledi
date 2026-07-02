import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { setIo, emitSpaceReleased, emitSpaceReserved, emitSpaceBooked, emitActivityFeed, tickLiveStats, adjustCityStat } from "./lib/io";
import { verifyToken } from "./lib/auth";
import { db, bookingsTable } from "@workspace/db";
import { and, eq, lt } from "drizzle-orm";
import { startPayoutRetryScheduler } from "./routes/vipps";
import { startDac7Scheduler } from "./lib/dac7Scheduler";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  path: "/api/socket.io",
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

setIo(io);

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Socket.io client connected");

  socket.on("authenticate", (token: unknown) => {
    if (typeof token !== "string") return;
    try {
      const payload = verifyToken(token);
      if (payload?.userId) {
        socket.join(`user:${payload.userId}`);
        socket.emit("authenticated", { userId: payload.userId });
      }
    } catch {
      // ignore invalid tokens
    }
  });

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Socket.io client disconnected");
  });
});

// ── Live stats: broadcast city counts every 1 second ─────────────────────────
setInterval(() => { tickLiveStats(); }, 1_000);

// ── Demo simulator: cycle random map pins through reserved→booked→released ───
// These spaceIds match the PINS array in MapPlaceholder.tsx
const DEMO_PINS = [
  { spaceId: 1,  by: "Oslo",      tittel: "Garasjeplass Frogner" },
  { spaceId: 2,  by: "Oslo",      tittel: "Bod Grünerløkka" },
  { spaceId: 3,  by: "Oslo",      tittel: "Bedriftsplass Sentrum" },
  { spaceId: 4,  by: "Oslo",      tittel: "Smart Pris Majorstua" },
  { spaceId: 20, by: "Oslo",      tittel: "Hengerplass Alna" },
  { spaceId: 21, by: "Oslo",      tittel: "Hengerplass Grefsen" },
  { spaceId: 5,  by: "Bergen",    tittel: "Parkeringsplass Sentrum" },
  { spaceId: 6,  by: "Trondheim", tittel: "Parkering Midtbyen" },
  { spaceId: 7,  by: "Stavanger", tittel: "Parkering Stavanger S" },
  { spaceId: 8,  by: "Tromsø",    tittel: "Parkering Giæverbukta" },
];

// Track which pins are currently being simulated
const _simulating = new Set<number>();

function simulateRandomPin() {
  // Pick a random pin that is not already being simulated
  const available = DEMO_PINS.filter(p => !_simulating.has(p.spaceId));
  if (available.length === 0) return;

  const pin = available[Math.floor(Math.random() * available.length)];
  _simulating.add(pin.spaceId);

  // Phase 1: reserved (yellow) — betaling pågår
  const expiresAt = new Date(Date.now() + 25_000).toISOString();
  emitSpaceReserved(pin.spaceId, expiresAt);
  emitActivityFeed(pin.spaceId, pin.by, "reserved");
  adjustCityStat(pin.by, -1);

  // Phase 2: booked (red) after 6-10s
  const bookDelay = 6_000 + Math.random() * 4_000;
  setTimeout(() => {
    emitSpaceBooked(pin.spaceId);
    emitActivityFeed(pin.spaceId, pin.by, "booked");
  }, bookDelay);

  // Phase 3: released (green) after 12-22s total
  const releaseDelay = bookDelay + 6_000 + Math.random() * 6_000;
  setTimeout(() => {
    emitSpaceReleased(pin.spaceId);
    emitActivityFeed(pin.spaceId, pin.by, "released");
    adjustCityStat(pin.by, 1);
    _simulating.delete(pin.spaceId);
  }, releaseDelay);
}

// Trigger a new simulation every 8–16 seconds
function scheduleNextSim() {
  const delay = 8_000 + Math.random() * 8_000;
  setTimeout(() => {
    simulateRandomPin();
    scheduleNextSim();
  }, delay);
}
// Start first simulation after 3s so the server is ready
setTimeout(() => {
  simulateRandomPin();
  scheduleNextSim();
}, 3_000);

// ── Payout scheduler: mark bookings as paid when utbetalingTidspunkt passes ───
setInterval(async () => {
  try {
    const pending = await db
      .select({ id: bookingsTable.id, plassId: bookingsTable.plassId })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.status, "confirmed"),
          eq(bookingsTable.payoutStatus, "venter"),
          lt(bookingsTable.utbetalingTidspunkt, new Date())
        )
      );
    for (const b of pending) {
      await db
        .update(bookingsTable)
        .set({ payoutStatus: "utbetalt", utbetaltDato: new Date() })
        .where(eq(bookingsTable.id, b.id));
      logger.info({ bookingId: b.id }, "Payout processed automatically");
    }
  } catch (err) {
    logger.error({ err }, "Error in payout scheduler");
  }
}, 60_000);

// Release expired reservations every 30 seconds
setInterval(async () => {
  try {
    const expired = await db
      .select({ id: bookingsTable.id, plassId: bookingsTable.plassId })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.status, "reserved"),
          lt(bookingsTable.lockedUntil, new Date())
        )
      );

    for (const b of expired) {
      await db
        .update(bookingsTable)
        .set({ status: "expired" })
        .where(eq(bookingsTable.id, b.id));
      emitSpaceReleased(b.plassId);
      logger.info({ bookingId: b.id, spaceId: b.plassId }, "Released expired reservation");
    }
  } catch (err) {
    logger.error({ err }, "Error releasing expired reservations");
  }
}, 30_000);

httpServer.on("error", (err: NodeJS.ErrnoException) => {
  logger.error({ err }, "HTTP server error");
  process.exit(1);
});

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
  void startPayoutRetryScheduler();
  startDac7Scheduler();
});
