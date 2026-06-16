import { createRemoteJWKSet, jwtVerify } from "jose";
import type { NextFunction, Request, Response } from "express";
import type { AuthContext } from "./types.js";

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getSupabaseUrl() {
  const value = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!value) {
    throw new Error("SUPABASE_URL is not configured");
  }
  return value.replace(/\/$/, "");
}

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${getSupabaseUrl()}/auth/v1/.well-known/jwks.json`));
  }
  return jwks;
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: `${getSupabaseUrl()}/auth/v1`
  });

  const userId = typeof payload.sub === "string" ? payload.sub : "";
  if (!userId) {
    throw new Error("Invalid token subject");
  }

  return {
    userId,
    email: typeof payload.email === "string" ? payload.email : undefined
  } satisfies AuthContext;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      res.status(401).json({ message: "Missing authorization token" });
      return;
    }

    const auth = await verifyAccessToken(token);
    (req as AuthenticatedRequest).auth = auth;
    next();
  } catch (error) {
    res.status(401).json({
      message: error instanceof Error ? error.message : "Unauthorized"
    });
  }
}
