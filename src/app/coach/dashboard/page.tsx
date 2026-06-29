import Link from "next/link";
import { redirect } from "next/navigation";
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="教练后台" description="查看所有时间段和预约状态。" />

      <div className="space-y-3">
        {slots.map((slot) => (
          <article key={slot.id} className="rounded border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">{slot.startText}</div>
                <div className="mt-1 text-sm text-gray-600">结束：{slot.endText}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge text={slot.statusText} />
                  <StatusBadge text={`课型：${slot.courseTypeText}`} />
                  <StatusBadge text={`人数：${slot.activeCount}/${slot.capacity ?? "未定"}`} />
                  <StatusBadge text={slot.status === "FULL" ? "已满" : "未满"} />
                </div>
              </div>
              <Link className="rounded bg-blue-600 px-4 py-2 text-center text-white" href={`/coach/slots/${slot.id}`}>
                查看详情
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
