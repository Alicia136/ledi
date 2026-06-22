import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { signToken, requireAuth, getUser } from "../lib/auth";
import { sendEmailVerificationEmail, sendPasswordResetEmail } from "../lib/email";

function userPayload(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    navn: user.navn,
    epost: user.epost,
    rolle: user.rolle,
    bankidVerifisert: user.bankidVerifisert,
    emailVerifisert: user.emailVerifisert,
    vippsNummer: user.vippsNummer,
    personnummer: user.personnummer ?? null,
    kontonummer: user.kontonummer ?? null,
    opprettetDato: user.opprettetDato?.toISOString(),
  };
}

function getBaseUrl(req: import("express").Request): string {
  const host = req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "ledi.no";
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  return `${proto}://${host}`;
}

const router = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { navn, epost, passord, rolle, vippsNummer, personnummer } = req.body;
  if (!navn || !epost || !passord || !rolle) {
    res.status(400).json({ error: "Mangler påkrevde felt" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.epost, epost)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "E-post er allerede registrert" });
    return;
  }

  const passordHash = await bcrypt.hash(passord, 10);
  const verificationToken = randomBytes(32).toString("hex");

  const [user] = await db.insert(usersTable).values({
    navn,
    epost,
    passordHash,
    rolle,
    vippsNummer: vippsNummer ?? null,
    personnummer: personnummer ?? null,
    emailVerifisert: false,
    verificationToken,
  }).returning();

  const verifyUrl = `${getBaseUrl(req)}/bekreft-epost?token=${verificationToken}`;
  void sendEmailVerificationEmail({ to: epost, navn, verifyUrl }).catch(() => {});

  const token = signToken({ userId: user.id, rolle: user.rolle });
  res.status(201).json({ token, user: userPayload(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { epost, passord } = req.body;
  if (!epost || !passord) {
    res.status(400).json({ error: "Mangler e-post eller passord" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.epost, epost)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Feil e-post eller passord" });
    return;
  }

  const ok = await bcrypt.compare(passord, user.passordHash);
  if (!ok) {
    res.status(401).json({ error: "Feil e-post eller passord" });
    return;
  }

  const token = signToken({ userId: user.id, rolle: user.rolle });
  res.json({ token, user: userPayload(user) });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const authUser = getUser(req);
  if (!authUser) { res.status(401).json({ error: "Ikke autentisert" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, authUser.userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Bruker ikke funnet" }); return; }

  res.json(userPayload(user));
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ message: "Logget ut" });
});

// ── Update profile ───────────────────────────────────────────────────────────
router.put("/auth/profil", requireAuth, async (req, res): Promise<void> => {
  const authUser = getUser(req);
  if (!authUser) { res.status(401).json({ error: "Ikke autentisert" }); return; }

  const { personnummer, kontonummer, vippsNummer } = req.body as {
    personnummer?: string | null;
    kontonummer?: string | null;
    vippsNummer?: string | null;
  };

  const updates: Record<string, unknown> = {};
  if (personnummer !== undefined) updates.personnummer = personnummer ?? null;
  if (kontonummer !== undefined) updates.kontonummer = kontonummer ?? null;
  if (vippsNummer !== undefined) updates.vippsNummer = vippsNummer ?? null;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, authUser.userId)).returning();
  if (!updated) { res.status(404).json({ error: "Bruker ikke funnet" }); return; }

  res.json(userPayload(updated));
});

// ── Forgot password ──────────────────────────────────────────────────────────
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { epost } = req.body as { epost?: string };
  if (!epost) { res.json({ message: "Hvis e-posten finnes vil du motta en tilbakestillingslenke." }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.epost, epost)).limit(1);
  if (user) {
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await db.update(usersTable).set({ resetToken, resetTokenExpiry }).where(eq(usersTable.id, user.id));
    const resetUrl = `${getBaseUrl(req)}/nytt-passord?token=${resetToken}`;
    void sendPasswordResetEmail({ to: user.epost, navn: user.navn, resetUrl }).catch(() => {});
  }

  res.json({ message: "Hvis e-posten finnes vil du motta en tilbakestillingslenke." });
});

// ── Reset password ───────────────────────────────────────────────────────────
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, nyttPassord } = req.body as { token?: string; nyttPassord?: string };
  if (!token || !nyttPassord) { res.status(400).json({ error: "Mangler token eller nytt passord" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.resetToken, token)).limit(1);
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    res.status(400).json({ error: "Ugyldig eller utløpt tilbakestillingslenke" });
    return;
  }

  const passordHash = await bcrypt.hash(nyttPassord, 10);
  await db.update(usersTable).set({ passordHash, resetToken: null, resetTokenExpiry: null }).where(eq(usersTable.id, user.id));
  res.json({ message: "Passordet er oppdatert. Du kan nå logge inn." });
});

// ── Verify email ─────────────────────────────────────────────────────────────
router.get("/auth/verify-email", async (req, res): Promise<void> => {
  const token = req.query["token"] as string | undefined;
  if (!token) { res.status(400).json({ error: "Mangler token" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.verificationToken, token)).limit(1);
  if (!user) { res.status(400).json({ error: "Ugyldig bekreftelseslenke" }); return; }

  await db.update(usersTable).set({ emailVerifisert: true, verificationToken: null }).where(eq(usersTable.id, user.id));
  res.json({ message: "E-postadressen er bekreftet!" });
});

// ── Resend verification ──────────────────────────────────────────────────────
router.post("/auth/resend-verification", requireAuth, async (req, res): Promise<void> => {
  const authUser = getUser(req);
  if (!authUser) { res.status(401).json({ error: "Ikke autentisert" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, authUser.userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Bruker ikke funnet" }); return; }
  if (user.emailVerifisert) { res.json({ message: "E-posten er allerede bekreftet." }); return; }

  const verificationToken = randomBytes(32).toString("hex");
  await db.update(usersTable).set({ verificationToken }).where(eq(usersTable.id, user.id));

  const verifyUrl = `${getBaseUrl(req)}/bekreft-epost?token=${verificationToken}`;
  void sendEmailVerificationEmail({ to: user.epost, navn: user.navn, verifyUrl }).catch(() => {});
  res.json({ message: "Bekreftelseslenke sendt til " + user.epost });
});

export default router;
