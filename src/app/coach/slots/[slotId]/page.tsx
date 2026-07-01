import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CoachCancelButton } from "@/components/coach/CoachCancelButton";
import { PendingNavigationLink } from "@/components/common/PendingNavigationLink";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { isCoachAuthenticated } from "@/lib/coach-auth";
import { COURSE_LABELS } from "@/lib/course";
import { getCoachSlotDetail } from "@/services/slot.service";

export const dynamic = "force-dynamic";

type CoachSlotPageProps = {
  params: Promise<{
    slotId: string;
  }>;
};

export default async function CoachSlotPage({ params }: CoachSlotPageProps) {
  if (!(await isCoachAuthenticated())) {
    redirect("/coach/login");
  }

  const { slotId } = await params;
  const slot = await getCoachSlotDetail(slotId);

  if (!slot) {
    notFound();
  }

  const activeBookings = slot.bookings.filter((b) => b.status === "ACTIVE");
  const cancelledBookings = slot.bookings.filter((b) => b.status !== "ACTIVE");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="时间段详情" />

      {/* Back link */}
      <Link className="mb-4 inline-flex items-center gap-1 text-sm text-sky-600 transition hover:text-sky-800" href="/coach/dashboard">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回教练后台
      </Link>

      {/* Info card */}
      <section className="rounded-xl border border-cyan-200 bg-gradient-to-b from-cyan-50 to-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-950">{slot.startText}</h2>
            <p className="mt-1 text-sm text-gray-600">结束：{slot.endText}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge text={slot.statusText} />
            <StatusBadge text={`课型：${slot.courseTypeText}`} />
            <StatusBadge text={`人数：${slot.activeCount}/${slot.capacity ?? "未定"}`} />
          </div>
        </div>
      </section>

      {/* Action */}
      <section className="mt-4">
        {slot.canBook ? (
          <PendingNavigationLink
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-cyan-600 hover:shadow-md active:scale-[0.98]"
            href={`/coach/slots/${slot.id}/book`}
            pendingLabel="正在打开添加预约页面..."
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            手动添加预约
          </PendingNavigationLink>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center text-sm text-gray-600">
            当前时间段不可添加预约。
          </div>
        )}
      </section>

      {/* Active bookings */}
      <section className="mt-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-950">
          有效预约
          <span className="ml-2 text-sm font-normal text-gray-500">（{activeBookings.length}）</span>
        </h3>
        {activeBookings.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-500">
            暂无有效预约记录。
          </div>
        ) : (
          <div className="space-y-3">
            {activeBookings.map((booking) => (
              <article key={booking.id} className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
                <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <div><span className="text-gray-500">学员姓名</span><div className="font-medium">{booking.studentName}</div></div>
                  <div><span className="text-gray-500">联系方式</span><div className="font-medium">{booking.contactPhone}</div></div>
                  <div><span className="text-gray-500">课程类型</span><div className="font-medium">{COURSE_LABELS[booking.courseType]}</div></div>
                  <div><span className="text-gray-500">报名时间</span><div className="font-medium">{new Date(booking.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</div></div>
                  {booking.remark ? (
                    <div className="sm:col-span-2"><span className="text-gray-500">备注</span><div className="font-medium">{booking.remark}</div></div>
                  ) : null}
                </div>
                <div className="mt-4">
                  <CoachCancelButton bookingId={booking.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Cancelled bookings */}
      {cancelledBookings.length > 0 ? (
        <section className="mt-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-950">
            已取消预约
            <span className="ml-2 text-sm font-normal text-gray-500">（{cancelledBookings.length}）</span>
          </h3>
          <div className="space-y-3">
            {cancelledBookings.map((booking) => (
              <article key={booking.id} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <div><span className="text-gray-500">学员姓名</span><div>{booking.studentName}</div></div>
                  <div><span className="text-gray-500">联系方式</span><div>{booking.contactPhone}</div></div>
                  <div><span className="text-gray-500">课程类型</span><div>{COURSE_LABELS[booking.courseType]}</div></div>
                  <div><span className="text-gray-500">取消时间</span><div>{booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }) : "无"}</div></div>
                  <div className="sm:col-span-2"><span className="text-gray-500">取消原因</span><div>{booking.cancelReason ?? "无"}</div></div>
                  {booking.remark ? (
                    <div className="sm:col-span-2"><span className="text-gray-500">备注</span><div>{booking.remark}</div></div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
