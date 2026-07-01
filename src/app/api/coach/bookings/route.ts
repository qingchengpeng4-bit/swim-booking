import { isCoachAuthenticated } from "@/lib/coach-auth";
import { createCoachBookingSchema } from "@/lib/validators";
import { createCoachBooking } from "@/services/booking.service";
import { toErrorResponse } from "@/services/errors";

export async function POST(request: Request) {
  if (!(await isCoachAuthenticated())) {
    return Response.json({ code: "COACH_UNAUTHORIZED", error: "请先登录教练后台" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const input = createCoachBookingSchema.parse(body);
    const booking = await createCoachBooking(input);
    return Response.json({ booking });
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      const issues = Array.isArray(error.issues) ? error.issues : [];
      const firstIssue = issues[0] ?? null;
      return Response.json(
        { code: "VALIDATION_ERROR", error: firstIssue?.message ?? "表单信息不正确", issues },
        { status: 400 },
      );
    }

    return toErrorResponse(error);
  }
}
