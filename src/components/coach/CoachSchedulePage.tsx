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
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">教练课表</h1>
            <p className="mt-1 text-sm text-gray-600">查看一周内每节课的预约人数、课型和学员姓名。</p>
          </div>
          <Link
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 transition hover:bg-sky-100 hover:shadow-sm"
            href="/coach/dashboard"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            列表视图
          </Link>
        </div>
      </div>

      <div className="mt-5">
        <WeekNavigator
          weekRangeText={shellSchedule.weekRangeText}
          previousWeekHref={scheduleWeek.previousWeekHref}
          nextWeekHref={scheduleWeek.nextWeekHref}
        />
      </div>

      <CoachScheduleClient weekStartKey={getDateKey(scheduleWeek.weekStart)} />
    </main>
  );
}
