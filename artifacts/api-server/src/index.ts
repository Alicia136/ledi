import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { setIo, emitSpaceReleased, tickLiveStats } from "./lib/io";
import { verifyToken } from "./lib/auth";
import { db, bookingsTable, runMigrations } from "@workspace/db";
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

async function start() {
  try {
    await runMigrations();
    logger.info("Database migrations applied");
  } catch (err) {
    logger.error({ err }, "Failed to run migrations");
    process.exit(1);
  }

  httpServer.listen(port, () => {
    logger.info({ port }, "Server listening");
    void startPayoutRetryScheduler();
    startDac7Scheduler();
  });
}

void start();
