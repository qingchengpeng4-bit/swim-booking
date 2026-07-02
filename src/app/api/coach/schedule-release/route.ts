import { isCoachAuthenticated } from "@/lib/coach-auth";
import { revalidateScheduleViews } from "@/lib/schedule-cache";
import { releaseNextParentScheduleWindow } from "@/services/schedule-release.service";
import { toErrorResponse } from "@/services/errors";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isCoachAuthenticated())) {
    return Response.json({ code: "COACH_UNAUTHORIZED", error: "请先登录教练后台" }, { status: 401 });
  }

  try {
    const result = await releaseNextParentScheduleWindow();
    revalidateScheduleViews();
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
