import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const SECRET = process.env.SESSION_SECRET ?? "spaceli-secret-key";

export function signToken(payload: { userId: number; rolle: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: number; rolle: string } | null {
  try {
    return jwt.verify(token, SECRET) as { userId: number; rolle: string };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Ikke autentisert" });
    return;
  }
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Ugyldig token" });
    return;
  }
  (req as Request & { user: { userId: number; rolle: string } }).user = payload;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const user = (req as Request & { user: { userId: number; rolle: string } }).user;
    if (user.rolle !== "admin") {
      res.status(403).json({ error: "Krever admin-tilgang" });
      return;
    }
    next();
  });
}

export function getUser(req: Request): { userId: number; rolle: string } | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}
