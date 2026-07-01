import { afterEach, describe, expect, it } from "vitest";
import {
  createCoachSessionValue,
  getCoachSessionCookieOptions,
  isValidCoachSessionValue,
  shouldUseSecureCoachCookie,
  verifyCoachPassword,
} from "../lib/coach-auth";

const originalPassword = process.env.COACH_LOGIN_PASSWORD;
const originalCookieSecure = process.env.COACH_COOKIE_SECURE;

afterEach(() => {
  process.env.COACH_LOGIN_PASSWORD = originalPassword;
  process.env.COACH_COOKIE_SECURE = originalCookieSecure;
});

describe("coach auth", () => {
  it("rejects a wrong coach password", () => {
    process.env.COACH_LOGIN_PASSWORD = "secret-pass";
    expect(verifyCoachPassword("wrong-pass")).toBe(false);
  });

  it("accepts the configured coach password", () => {
    process.env.COACH_LOGIN_PASSWORD = "secret-pass";
    expect(verifyCoachPassword("secret-pass")).toBe(true);
  });

  it("creates a signed httpOnly-cookie session value that can be verified server-side", () => {
    process.env.COACH_LOGIN_PASSWORD = "secret-pass";
    const session = createCoachSessionValue(Date.now());
    expect(isValidCoachSessionValue(session)).toBe(true);
  });

  it("rejects tampered or expired coach sessions", () => {
    process.env.COACH_LOGIN_PASSWORD = "secret-pass";
    const session = createCoachSessionValue(Date.now()).replace(/.$/, "x");
    const expired = createCoachSessionValue(Date.now() - 8 * 24 * 60 * 60 * 1000);

    expect(isValidCoachSessionValue(session)).toBe(false);
    expect(isValidCoachSessionValue(expired)).toBe(false);
  });

  it("does not mark coach session cookies secure by default", () => {
    delete process.env.COACH_COOKIE_SECURE;

    expect(shouldUseSecureCoachCookie()).toBe(false);
    expect(getCoachSessionCookieOptions().secure).toBe(false);
  });

  it("marks coach session cookies secure when COACH_COOKIE_SECURE is true", () => {
    process.env.COACH_COOKIE_SECURE = "true";

    expect(shouldUseSecureCoachCookie()).toBe(true);
    expect(getCoachSessionCookieOptions().secure).toBe(true);
  });
});
