import { setCoachSessionCookie, verifyCoachPassword } from "@/lib/coach-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!verifyCoachPassword(password)) {
    return Response.json({ code: "COACH_LOGIN_FAILED", error: "密码不正确" }, { status: 401 });
  }

  await setCoachSessionCookie();
  return Response.json({ ok: true });
}
