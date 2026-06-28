import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

// --- Configuration (all from environment, set in Cloud Run / GCP) ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "";
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const HUSBAND_EMAIL = (process.env.HUSBAND_EMAIL || "").trim().toLowerCase();
const WIFE_EMAIL = (process.env.WIFE_EMAIL || "").trim().toLowerCase();

const SESSION_COOKIE_NAME = "sanctuary_session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

if (!GOOGLE_CLIENT_ID) {
  console.warn(
    "[auth] GOOGLE_CLIENT_ID is not set. Google Sign-In will not work until this is configured."
  );
}
if (!SESSION_SECRET) {
  console.warn(
    "[auth] SESSION_SECRET is not set. Using an insecure fallback - set this in production!"
  );
}
if (ALLOWED_EMAILS.length === 0) {
  console.warn(
    "[auth] ALLOWED_EMAILS is empty. No one will be able to sign in until this is configured."
  );
}

const effectiveSecret = SESSION_SECRET || "dev-only-insecure-secret-change-me";

const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface SessionPayload {
  email: string;
  name: string;
  picture?: string;
  role?: "Him" | "Her";
}

/**
 * Verifies a Google ID token (sent from the frontend after Google Sign-In),
 * confirms the email is on the whitelist, and returns the verified identity.
 * Throws on any failure - callers should catch and respond with 401/403.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<SessionPayload> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Server is missing GOOGLE_CLIENT_ID configuration.");
  }

  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("Invalid Google token payload.");
  }

  // Google sets email_verified=false for unverified addresses - reject those.
  if (payload.email_verified === false) {
    throw new Error("Email is not verified with Google.");
  }

  const email = payload.email.toLowerCase();
  if (!ALLOWED_EMAILS.includes(email)) {
    throw new Error("This Google account is not authorized for this sanctuary.");
  }

  let role: "Him" | "Her" | undefined = undefined;
  if (email === HUSBAND_EMAIL) role = "Him";
  else if (email === WIFE_EMAIL) role = "Her";

  return {
    email,
    name: payload.name || email,
    picture: payload.picture,
    role
  };
}

/** Issues a signed, httpOnly session cookie for the given identity. */
export function issueSessionCookie(res: Response, session: SessionPayload) {
  const token = jwt.sign(session, effectiveSecret, {
    expiresIn: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });

  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
}

function readSession(req: Request): SessionPayload | null {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, effectiveSecret) as SessionPayload;
    // Defense in depth: re-check the whitelist on every request, in case it
    // was edited in GCP after the cookie was issued.
    if (!ALLOWED_EMAILS.includes(decoded.email.toLowerCase())) return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Express middleware: blocks the request unless a valid session cookie is present. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = readSession(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  (req as Request & { user?: SessionPayload }).user = session;
  next();
}

/** Non-blocking lookup, for the /api/auth/me endpoint. */
export function getSession(req: Request): SessionPayload | null {
  return readSession(req);
}
