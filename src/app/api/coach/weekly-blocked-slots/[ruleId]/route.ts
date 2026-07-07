import { isCoachAuthenticated } from "@/lib/coach-auth";
import { revalidateScheduleViews } from "@/lib/schedule-cache";
import { toErrorResponse } from "@/services/errors";
import { deleteCoachWeeklyBlockedRule } from "@/services/weekly-blocked-slots.service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    ruleId: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await isCoachAuthenticated())) {
    return Response.json({ code: "COACH_UNAUTHORIZED", error: "请先登录教练后台" }, { status: 401 });
  }

  try {
    const { ruleId } = await params;
    const result = await deleteCoachWeeklyBlockedRule(ruleId);
    revalidateScheduleViews();
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
