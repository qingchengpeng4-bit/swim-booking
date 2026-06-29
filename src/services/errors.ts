import { APP_ERRORS, type AppErrorDefinition } from "@/lib/app-errors";

export class BusinessError extends Error {
  code: AppErrorDefinition["code"] | "BUSINESS_ERROR";
  status: number;

  constructor(error: AppErrorDefinition | string, status = 400) {
    const definition: AppErrorDefinition | null = typeof error === "string" ? null : error;
    const message = definition?.message ?? String(error);
    super(message);
    this.name = "BusinessError";
    this.code = definition?.code ?? "BUSINESS_ERROR";
    this.status = definition?.status ?? status;
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof BusinessError) {
    return Response.json(
      {
        code: error.code,
        error: error.message,
      },
      { status: error.status },
    );
  }

  console.error(error);
  return Response.json(
    {
      code: APP_ERRORS.DATABASE_UNAVAILABLE.code,
      error: APP_ERRORS.DATABASE_UNAVAILABLE.message,
    },
    { status: APP_ERRORS.DATABASE_UNAVAILABLE.status },
  );
}
