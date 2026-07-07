import { isCoachAuthenticated } from "@/lib/coach-auth";
import { revalidateScheduleViews } from "@/lib/schedule-cache";
import {
  addCoachWeeklyBlockedRule,
  getCoachWeeklyBlockedRules,
  SYSTEM_WEEKLY_BLOCKED_SLOTS,
} from "@/services/weekly-blocked-slots.service";
import { toErrorResponse } from "@/services/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isCoachAuthenticated())) {
    return Response.json({ code: "COACH_UNAUTHORIZED", error: "请先登录教练后台" }, { status: 401 });
  }

  const customRules = await getCoachWeeklyBlockedRules();
  return Response.json({
    systemRules: SYSTEM_WEEKLY_BLOCKED_SLOTS,
    customRules,
  });
}

export async function POST(request: Request) {
  if (!(await isCoachAuthenticated())) {
    return Response.json({ code: "COACH_UNAUTHORIZED", error: "请先登录教练后台" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rule = await addCoachWeeklyBlockedRule(body);
    revalidateScheduleViews();
    return Response.json({ rule });
  } catch (error) {
    return toErrorResponse(error);
  }
}
