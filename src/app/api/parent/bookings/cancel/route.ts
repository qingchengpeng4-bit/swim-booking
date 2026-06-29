import { cancelBookingSchema } from "@/lib/validators";
import { cancelParentBooking } from "@/services/booking.service";
import { toErrorResponse } from "@/services/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = cancelBookingSchema.parse(body);
    const booking = await cancelParentBooking(input);
    return Response.json({ booking });
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return Response.json({ code: "VALIDATION_ERROR", error: "表单信息不正确", details: error }, { status: 400 });
    }
    return toErrorResponse(error);
  }
}
