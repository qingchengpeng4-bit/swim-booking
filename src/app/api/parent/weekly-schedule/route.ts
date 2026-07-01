import { buildWeeklySchedule, getScheduleWeek } from "@/lib/schedule";
import { getParentWeeklySlots } from "@/services/slot.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleWeek = getScheduleWeek(searchParams.get("week") ?? undefined);
    const slots = await getParentWeeklySlots(scheduleWeek.weekStart, scheduleWeek.queryEnd);
    const schedule = buildWeeklySchedule({
      slots,
      weekStart: scheduleWeek.weekStart,
      weekEnd: scheduleWeek.weekEnd,
      previousWeekHref: scheduleWeek.previousWeekHref,
      nextWeekHref: scheduleWeek.nextWeekHref,
    });

    return Response.json({ schedule });
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
