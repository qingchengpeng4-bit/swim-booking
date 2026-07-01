import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { APP_ERRORS } from "@/lib/app-errors";
import { isDatabaseConnectionError, isRetryableTransactionError } from "@/lib/prisma-errors";

function prismaKnownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("Test Prisma error", {
    code,
    clientVersion: "test",
  });
}

describe("Prisma error classification", () => {
  it("treats P2028 and P2034 as retryable transaction conflicts", () => {
    expect(isRetryableTransactionError(prismaKnownError("P2028"))).toBe(true);
    expect(isRetryableTransactionError(prismaKnownError("P2034"))).toBe(true);
  });

  it("does not treat P1001 database outages as booking conflicts", () => {
    const error = prismaKnownError("P1001");

    expect(isDatabaseConnectionError(error)).toBe(true);
    expect(isRetryableTransactionError(error)).toBe(false);
  });

  it("shows a system busy message for database outages", () => {
    expect(APP_ERRORS.DATABASE_UNAVAILABLE.message).toBe("系统暂时繁忙，请稍后再试。");
  });
});
