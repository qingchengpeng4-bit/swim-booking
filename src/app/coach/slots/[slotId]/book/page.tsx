import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CoachManualBookingForm } from "@/components/coach/CoachManualBookingForm";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { isCoachAuthenticated } from "@/lib/coach-auth";
import { getCoachSlotDetail } from "@/services/slot.service";

export const dynamic = "force-dynamic";

type CoachManualBookingPageProps = {
  params: Promise<{
    slotId: string;
  }>;
};

export default async function CoachManualBookingPage({ params }: CoachManualBookingPageProps) {
  if (!(await isCoachAuthenticated())) {
    redirect("/coach/login");
  }

  const { slotId } = await params;
  const slot = await getCoachSlotDetail(slotId);

  if (!slot) {
    notFound();
  }

  const lockedCourseType = slot.activeCount > 0 ? slot.courseType : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader title="手动添加预约" description="教练可为家长电话或线下沟通后的课程补录预约。" />
      <Link className="text-sm text-blue-600" href={`/coach/slots/${slot.id}`}>
        返回时间段详情
      </Link>

      <section className="mt-4 rounded border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold">{slot.startText}</h2>
        <p className="mt-1 text-sm text-gray-600">结束：{slot.endText}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge text={slot.statusText} />
          <StatusBadge text={`课型：${slot.courseTypeText}`} />
          <StatusBadge text={`人数：${slot.activeCount}/${slot.capacity ?? "未定"}`} />
        </div>
      </section>

      <section className="mt-4">
        {slot.canBook ? (
          <CoachManualBookingForm slotId={slot.id} lockedCourseType={lockedCourseType} />
        ) : (
          <p className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            当前时间段不可添加预约。
          </p>
        )}
      </section>
    </main>
  );
}
