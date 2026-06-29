import { createBookingSchema } from "@/lib/validators";
import { createBooking } from "@/services/booking.service";
import { toErrorResponse } from "@/services/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = createBookingSchema.parse(body);
    const booking = await createBooking(input);
    return Response.json({ booking });
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return Response.json({ error: "表单信息不正确", details: error }, { status: 400 });
    }
    return toErrorResponse(error);
  }
}
