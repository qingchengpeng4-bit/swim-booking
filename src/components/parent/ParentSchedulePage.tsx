import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { ParentScheduleClient } from "@/components/parent/ParentScheduleClient";
import { WeekNavigator } from "@/components/parent/WeekNavigator";
import { buildWeeklySchedule, getScheduleWeek } from "@/lib/schedule";

type ParentSchedulePageProps = {
  week?: string;
};

export function ParentSchedulePage({ week }: ParentSchedulePageProps) {
  const scheduleWeek = getScheduleWeek(week);
  const shellSchedule = buildWeeklySchedule({
    slots: [],
    weekStart: scheduleWeek.weekStart,
    weekEnd: scheduleWeek.weekEnd,
    previousWeekHref: scheduleWeek.previousWeekHref,
    nextWeekHref: scheduleWeek.nextWeekHref,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader
        title="游泳课预约"
        description="请选择可预约时间。1v2 / 1v3 是固定拼团课程，请先和同伴及教练沟通好再报名。"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 transition hover:bg-sky-100 hover:shadow-sm"
          href="/parent/my-bookings"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          我的预约
        </Link>
      </div>

      <WeekNavigator
        weekRangeText={shellSchedule.weekRangeText}
        previousWeekHref={shellSchedule.previousWeekHref}
        nextWeekHref={shellSchedule.nextWeekHref}
      />

      <ParentScheduleClient weekStartKey={shellSchedule.weekStartKey} />

      <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-sm text-sky-800">
        <p>已开始或已过去的课程不可预约。</p>
        <p className="mt-1">当天课程不可在线取消，请联系教练。</p>
        <p className="mt-1">多人课会显示已报名学员姓名，用于确认是否加入正确拼团。</p>
      </div>
    </main>
  );
}
