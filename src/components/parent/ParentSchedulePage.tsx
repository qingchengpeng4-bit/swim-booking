import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { WeekNavigator } from "@/components/parent/WeekNavigator";
import { WeeklyScheduleGrid } from "@/components/parent/WeeklyScheduleGrid";
import { buildWeeklySchedule, getScheduleWeek } from "@/lib/schedule";
import { getParentWeeklySlots } from "@/services/slot.service";

type ParentSchedulePageProps = {
  week?: string;
};

export async function ParentSchedulePage({ week }: ParentSchedulePageProps) {
  const scheduleWeek = getScheduleWeek(week);
  const slots = await getParentWeeklySlots(scheduleWeek.weekStart, scheduleWeek.queryEnd);
  const schedule = buildWeeklySchedule({
    slots,
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

      <div className="mb-4 flex flex-wrap gap-2">
        <Link className="rounded border border-gray-300 bg-white px-3 py-2 text-sm" href="/parent/my-bookings">
          我的预约
        </Link>
      </div>

      <WeekNavigator
        weekRangeText={schedule.weekRangeText}
        previousWeekHref={schedule.previousWeekHref}
        nextWeekHref={schedule.nextWeekHref}
      />
      <WeeklyScheduleGrid schedule={schedule} />

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <p>已开始或已过去的课程不可预约。</p>
        <p className="mt-1">当天课程不可在线取消，请联系教练。</p>
        <p className="mt-1">多人课会显示已报名学员姓名，用于确认是否加入正确拼团。</p>
      </div>
    </main>
  );
}
