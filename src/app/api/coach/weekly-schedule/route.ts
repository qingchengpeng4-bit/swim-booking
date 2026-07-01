import { buildCoachWeeklySchedule } from "@/lib/coach-schedule";
import { isCoachAuthenticated } from "@/lib/coach-auth";
import { getScheduleWeek } from "@/lib/schedule";
import { getCoachWeeklySlots } from "@/services/slot.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isCoachAuthenticated())) {
    return Response.json(
      {
        code: "UNAUTHORIZED",
        error: "请先登录教练后台。",
      },
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const scheduleWeek = getScheduleWeek(searchParams.get("week") ?? undefined, new Date(), "/coach/calendar");
    const slots = await getCoachWeeklySlots(scheduleWeek.weekStart, scheduleWeek.queryEnd);
    const schedule = buildCoachWeeklySchedule({
      slots,
      weekStart: scheduleWeek.weekStart,
      weekEnd: scheduleWeek.weekEnd,
    });

    return Response.json({ schedule });
  } catch (error) {
    console.error(error);
    return Response.json(
      {
        code: "COACH_WEEKLY_SCHEDULE_UNAVAILABLE",
        error: "课表加载失败，请重试。",
      },
      { status: 503 },
    );
  }
}
