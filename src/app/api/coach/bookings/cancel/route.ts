import { isCoachAuthenticated } from "@/lib/coach-auth";
import { revalidateScheduleViews } from "@/lib/schedule-cache";
import { cancelCoachBooking } from "@/services/booking.service";
import { toErrorResponse } from "@/services/errors";

export async function POST(request: Request) {
  if (!(await isCoachAuthenticated())) {
    return Response.json({ code: "COACH_UNAUTHORIZED", error: "请先登录教练后台" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const bookingId = typeof body?.bookingId === "string" ? body.bookingId : "";
    const reason = typeof body?.reason === "string" ? body.reason : "教练手动取消";
    const booking = await cancelCoachBooking({ bookingId, reason });
    revalidateScheduleViews(booking.slotId);
    return Response.json({ booking });
  } catch (error) {
    return toErrorResponse(error);
  }
}
