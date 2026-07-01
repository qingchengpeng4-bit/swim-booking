import { Prisma } from "@prisma/client";

export function isRetryableTransactionError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && ["P2028", "P2034"].includes(error.code);
}

export function isDatabaseConnectionError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001";
}
