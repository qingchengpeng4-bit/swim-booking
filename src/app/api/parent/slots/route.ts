import { getOpenSlots, getParentSlotDetail } from "@/services/slot.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slotId = searchParams.get("slotId");

  if (slotId) {
    const slot = await getParentSlotDetail(slotId);
    if (!slot) {
      return Response.json({ code: "SLOT_NOT_FOUND", error: "时间段不存在" }, { status: 404 });
    }
    return Response.json({ slot });
  }

  const slots = await getOpenSlots();
  return Response.json({ slots });
}
