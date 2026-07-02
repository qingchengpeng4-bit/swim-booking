import { buildWeeklySchedule, getDateKey, getScheduleWeek } from "@/lib/schedule";
import { getParentScheduleRelease } from "@/services/schedule-release.service";
import { getParentWeeklySlots } from "@/services/slot.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleWeek = getScheduleWeek(searchParams.get("week") ?? undefined);
    const releasedUntil = await getParentScheduleRelease();

    if (!releasedUntil || getDateKey(scheduleWeek.weekStart) > releasedUntil) {
      return Response.json({
        schedule: null,
        releasedUntil,
        message: "这周课表暂未开放，请等待教练开放。",
      });
    }

    const slots = await getParentWeeklySlots(scheduleWeek.weekStart, scheduleWeek.queryEnd, releasedUntil);
    const schedule = buildWeeklySchedule({
      slots,
      weekStart: scheduleWeek.weekStart,
      weekEnd: scheduleWeek.weekEnd,
      previousWeekHref: scheduleWeek.previousWeekHref,
      nextWeekHref: scheduleWeek.nextWeekHref,
    });

    return Response.json({ schedule, releasedUntil });
  } catch (error) {
    console.error(error);
    return Response.json(
      {
        code: "PARENT_WEEKLY_SCHEDULE_UNAVAILABLE",
        error: "课表加载失败，请重试。",
      },
      { status: 503 },
    );
  }
}
