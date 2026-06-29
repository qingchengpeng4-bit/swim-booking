import { contactPhoneSchema } from "@/lib/validators";
import { getBookingsByContactPhone } from "@/services/booking.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contactPhone = searchParams.get("contactPhone") ?? "";
  const parsed = contactPhoneSchema.safeParse(contactPhone);

  if (!parsed.success) {
    return Response.json({ error: "请填写正确的家长手机号" }, { status: 400 });
  }

  const bookings = await getBookingsByContactPhone(parsed.data);
  return Response.json({ bookings });
}
