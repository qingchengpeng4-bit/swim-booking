import Link from "next/link";
import { CoachScheduleClient } from "@/components/coach/CoachScheduleClient";
import { PageHeader } from "@/components/common/PageHeader";
import { WeekNavigator } from "@/components/parent/WeekNavigator";
import { buildCoachWeeklySchedule } from "@/lib/coach-schedule";
import { getDateKey, getScheduleWeek } from "@/lib/schedule";

type CoachSchedulePageProps = {
  week?: string;
};

export function CoachSchedulePage({ week }: CoachSchedulePageProps) {
  const scheduleWeek = getScheduleWeek(week, new Date(), "/coach/calendar");
  const shellSchedule = buildCoachWeeklySchedule({
    slots: [],
    weekStart: scheduleWeek.weekStart,
    weekEnd: scheduleWeek.weekEnd,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader title="教练课表" description="查看一周内每节课的预约人数、课型和学员姓名。" />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link className="rounded border border-gray-300 bg-white px-3 py-2 text-sm" href="/coach/dashboard">
          列表视图
        </Link>
      </div>

      <WeekNavigator
        weekRangeText={shellSchedule.weekRangeText}
        previousWeekHref={scheduleWeek.previousWeekHref}
        nextWeekHref={scheduleWeek.nextWeekHref}
      />

      <CoachScheduleClient weekStartKey={getDateKey(scheduleWeek.weekStart)} />
    </main>
  );
}
