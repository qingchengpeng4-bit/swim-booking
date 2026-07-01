import Link from "next/link";
import { Fragment } from "react";
import { PendingNavigationLink } from "@/components/common/PendingNavigationLink";
import type { WeeklySchedule, ScheduleCell } from "@/lib/schedule";

type WeeklyScheduleGridProps = {
  schedule: WeeklySchedule;
};

function cellClass(tone: ScheduleCell["tone"]) {
  const base =
    "block min-h-[80px] rounded-lg border p-1.5 text-left text-[11px] leading-snug transition sm:p-2 sm:text-xs";

  if (tone === "green") {
    return `${base} border-cyan-200 bg-cyan-50 text-cyan-900 hover:border-cyan-400 hover:bg-cyan-100`;
  }

  if (tone === "red") {
    return `${base} border-rose-200 bg-rose-50 text-rose-900`;
  }

  return `${base} border-gray-100 bg-gray-50 text-gray-400`;
}

function ScheduleCellView({ cell }: { cell: ScheduleCell }) {
  const content = (
    <>
      <div className="font-semibold">{cell.title}</div>
      {cell.subtitle ? <div className="mt-0.5 break-words">{cell.subtitle}</div> : null}
    </>
  );

  if (cell.href) {
    if (cell.tone === "green") {
      return (
        <PendingNavigationLink className={cellClass(cell.tone)} href={cell.href} pendingLabel="正在进入预约页...">
          {content}
        </PendingNavigationLink>
      );
    }

    return (
      <Link className={cellClass(cell.tone)} href={cell.href}>
        {content}
      </Link>
    );
  }

  return <div className={cellClass(cell.tone)}>{content}</div>;
}

export function WeeklyScheduleGrid({ schedule }: WeeklyScheduleGridProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 text-xs text-gray-500 sm:text-sm">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-cyan-200 bg-cyan-50" />
          可预约
        </span>
        <span className="ml-3 inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-rose-200 bg-rose-50" />
          已约满
        </span>
        <span className="ml-3 inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-gray-100 bg-gray-50" />
          不可预约
        </span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[56px_repeat(7,minmax(96px,1fr))] gap-1.5 sm:gap-2">
            <div className="sticky left-0 z-10 bg-white" />
            {schedule.days.map((day) => (
              <div key={day.key} className="rounded-lg bg-gray-50 p-2 text-center">
                <div className="text-sm font-semibold text-gray-950">{day.weekday}</div>
                <div className="text-xs text-gray-500">{day.dateText}</div>
              </div>
            ))}

            {schedule.rows.map((row) => (
              <Fragment key={row.timeLabel}>
                <div className="sticky left-0 z-10 flex min-h-[80px] items-start justify-center rounded-lg bg-white pt-2 text-xs font-medium text-gray-600">
                  {row.timeLabel}
                </div>
                {row.cells.map((cell) => (
                  <ScheduleCellView key={cell.key} cell={cell} />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
