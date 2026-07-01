import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CoachCancelButton } from "@/components/coach/CoachCancelButton";
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="时间段详情" description="教练端可查看完整预约信息。" />
      <Link className="text-sm text-blue-600" href="/coach/dashboard">
        返回教练后台
      </Link>

      <section className="mt-4 rounded border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold">{slot.startText}</h2>
        <p className="mt-1 text-sm text-gray-600">结束：{slot.endText}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge text={slot.statusText} />
          <StatusBadge text={`课型：${slot.courseTypeText}`} />
          <StatusBadge text={`人数：${slot.activeCount}/${slot.capacity ?? "未定"}`} />
        </div>
        <div className="mt-4">
          {slot.canBook ? (
            <Link className="inline-flex rounded bg-blue-600 px-4 py-2 text-sm text-white" href={`/coach/slots/${slot.id}/book`}>
              手动添加预约
            </Link>
          ) : (
            <p className="text-sm text-gray-600">当前时间段不可添加预约。</p>
          )}
        </div>
      </section>

      <section className="mt-4 space-y-3">
        {slot.bookings.length === 0 ? (
          <p className="rounded bg-white p-4 text-gray-600">暂无预约记录。</p>
        ) : (
          slot.bookings.map((booking) => (
            <article key={booking.id} className="rounded border border-gray-200 bg-white p-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>学员姓名：{booking.studentName}</div>
                <div>联系方式：{booking.contactPhone}</div>
                <div>课程类型：{COURSE_LABELS[booking.courseType]}</div>
                <div>预约状态：{booking.status === "ACTIVE" ? "有效" : "已取消"}</div>
                <div>报名时间：{new Date(booking.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</div>
                <div>取消时间：{booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }) : "无"}</div>
                <div>取消原因：{booking.cancelReason ?? "无"}</div>
                <div>备注：{booking.remark ?? "无"}</div>
              </div>
              {booking.status === "ACTIVE" ? (
                <div className="mt-4">
                  <CoachCancelButton bookingId={booking.id} />
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>
    </main>
  );
}
