import { isCoachAuthenticated } from "@/lib/coach-auth";
import { getCoachSlotDetail } from "@/services/slot.service";

type CoachSlotApiProps = {
  params: Promise<{
    slotId: string;
  }>;
};

export async function GET(_request: Request, { params }: CoachSlotApiProps) {
  if (!(await isCoachAuthenticated())) {
    return Response.json({ code: "COACH_UNAUTHORIZED", error: "请先登录教练后台" }, { status: 401 });
  }

  const { slotId } = await params;
  const slot = await getCoachSlotDetail(slotId);
  if (!slot) {
    return Response.json({ code: "SLOT_NOT_FOUND", error: "时间段不存在" }, { status: 404 });
  }

  return Response.json({ slot });
}
