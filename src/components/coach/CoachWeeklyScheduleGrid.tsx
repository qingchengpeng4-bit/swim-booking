"use client";

import { Fragment } from "react";
import { PendingNavigationLink } from "@/components/common/PendingNavigationLink";
import type { CoachScheduleCell, CoachWeeklySchedule } from "@/lib/coach-schedule";

type CoachWeeklyScheduleGridProps = {
  schedule: CoachWeeklySchedule;
};

function cellClass(tone: CoachScheduleCell["tone"]) {
  const base = "block min-h-[76px] rounded-md border p-2 text-left text-xs leading-snug transition";

  if (tone === "green") {
    return `${base} border-green-200 bg-green-50 text-green-900 hover:border-green-400`;
  }

  if (tone === "red") {
    return `${base} border-red-200 bg-red-50 text-red-900 hover:border-red-400`;
  }

  return `${base} border-gray-200 bg-gray-100 text-gray-700`;
}

function CoachScheduleCellView({ cell }: { cell: CoachScheduleCell }) {
  const content = (
    <>
      <div className="font-semibold">{cell.title}</div>
      {cell.subtitle ? <div className="mt-1 break-words">{cell.subtitle}</div> : null}
    </>
  );

  if (cell.href) {
    return (
      <PendingNavigationLink className={cellClass(cell.tone)} href={cell.href} pendingLabel="正在打开课程详情...">
        {content}
      </PendingNavigationLink>
    );
  }

  return <div className={cellClass(cell.tone)}>{content}</div>;
}

export function CoachWeeklyScheduleGrid({ schedule }: CoachWeeklyScheduleGridProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-3 text-sm text-gray-600">
        左右滑动查看一周课程。绿色为空闲或未满，红色为已满，灰色为大班课或不可预约。
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[64px_repeat(7,minmax(96px,1fr))] gap-2">
            <div className="sticky left-0 z-10 bg-white" />
            {schedule.days.map((day) => (
              <div key={day.key} className="rounded-md bg-gray-50 p-2 text-center">
                <div className="text-sm font-semibold text-gray-950">{day.weekday}</div>
                <div className="text-xs text-gray-500">{day.dateText}</div>
              </div>
            ))}

            {schedule.rows.map((row) => (
              <Fragment key={row.timeLabel}>
                <div className="sticky left-0 z-10 flex min-h-[76px] items-start justify-center rounded-md bg-white pt-2 text-xs font-medium text-gray-600">
                  {row.timeLabel}
                </div>
                {row.cells.map((cell) => (
                  <CoachScheduleCellView key={cell.key} cell={cell} />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
