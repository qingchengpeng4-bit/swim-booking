import crypto from "node:crypto";
import { cookies } from "next/headers";

export const COACH_SESSION_COOKIE = "coach_session";

const SESSION_VERSION = "v1";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getCoachPassword() {
  return process.env.COACH_LOGIN_PASSWORD ?? "";
}

function signSession(payload: string) {
  return crypto.createHmac("sha256", getCoachPassword()).update(payload).digest("hex");
}

export function verifyCoachPassword(password: string) {
  const configuredPassword = getCoachPassword();
  if (!configuredPassword || password.length !== configuredPassword.length) return false;
  return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(configuredPassword));
}

export function createCoachSessionValue(now = Date.now()) {
  const payload = `${SESSION_VERSION}.${now}`;
  return `${payload}.${signSession(payload)}`;
}

export function isValidCoachSessionValue(value: string | undefined) {
  if (!value || !getCoachPassword()) return false;

  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [version, issuedAtText, signature] = parts;
  if (version !== SESSION_VERSION) return false;

  const issuedAt = Number(issuedAtText);
  if (!Number.isFinite(issuedAt)) return false;

  const ageSeconds = (Date.now() - issuedAt) / 1000;
  if (ageSeconds < 0 || ageSeconds > SESSION_MAX_AGE_SECONDS) return false;

  const payload = `${version}.${issuedAtText}`;
  const expectedSignature = signSession(payload);
  if (signature.length !== expectedSignature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

export async function isCoachAuthenticated() {
  const cookieStore = await cookies();
  return isValidCoachSessionValue(cookieStore.get(COACH_SESSION_COOKIE)?.value);
}

export async function setCoachSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COACH_SESSION_COOKIE, createCoachSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearCoachSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COACH_SESSION_COOKIE);
}
