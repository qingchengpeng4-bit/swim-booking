import { notFound, redirect } from "next/navigation";
import { PendingNavigationLink } from "@/components/common/PendingNavigationLink";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { isCoachAuthenticated } from "@/lib/coach-auth";
import { getCoachSlots } from "@/services/slot.service";

export const dynamic = "force-dynamic";

export default async function CoachDashboardPage() {
  if (!(await isCoachAuthenticated())) {
    redirect("/coach/login");
  }

  const slots = await getCoachSlots();

  if (!slots) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="教练后台" description="查看所有时间段和预约状态。" />

      <div className="space-y-3">
        {slots.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 text-center text-sm text-gray-500">
            暂无时间段数据。
          </div>
        ) : (
          slots.map((slot) => (
            <article key={slot.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-gray-950">{slot.startText}</div>
                  <div className="mt-0.5 text-sm text-gray-600">结束：{slot.endText}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <StatusBadge text={slot.statusText} />
                    <StatusBadge text={`课型：${slot.courseTypeText}`} />
                    <StatusBadge text={`人数：${slot.activeCount}/${slot.capacity ?? "未定"}`} />
                    <StatusBadge text={slot.status === "FULL" ? "已满" : "未满"} />
                  </div>
                </div>
                <PendingNavigationLink
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-cyan-600 hover:shadow-md active:scale-[0.98]"
                  href={`/coach/slots/${slot.id}`}
                  pendingLabel="正在打开课程详情..."
                >
                  查看详情
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </PendingNavigationLink>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
