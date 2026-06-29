export class BusinessError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "BusinessError";
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof BusinessError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  return Response.json({ error: "服务器错误，请稍后再试" }, { status: 500 });
}
