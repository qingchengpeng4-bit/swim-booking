import { notFound } from "next/navigation";
import { PendingNavigationLink } from "@/components/common/PendingNavigationLink";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getParentSlotDetail } from "@/services/slot.service";

export const dynamic = "force-dynamic";

type SlotDetailPageProps = {
  params: Promise<{
    slotId: string;
  }>;
};

export default async function SlotDetailPage({ params }: SlotDetailPageProps) {
  const { slotId } = await params;
  const slot = await getParentSlotDetail(slotId);

  if (!slot) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="课程详情" />

      {/* Time hero */}
      <section className="rounded-xl border border-cyan-200 bg-gradient-to-b from-cyan-50 to-white p-6 shadow-sm">
        <div className="text-2xl font-bold text-gray-950">{slot.startText}</div>
        <p className="mt-1 text-sm text-gray-600">结束 {slot.endText}</p>
      </section>

      {/* Info card */}
      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <StatusBadge text={slot.statusText} />
          <StatusBadge text={`课型：${slot.courseTypeText}`} />
          <StatusBadge text={`人数：${slot.activeCount}/${slot.capacity ?? "未定"}`} />
          <StatusBadge text={`剩余：${slot.remaining ?? "未定"}`} />
        </div>

        {slot.reminder ? (
          <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
            {slot.reminder}
          </div>
        ) : null}

        {slot.registeredStudentNames.length > 0 ? (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-700">已报名学员</h3>
            <ul className="mt-2 space-y-1">
              {slot.registeredStudentNames.map((name) => (
                <li key={name} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="inline-block h-6 w-6 rounded-full bg-sky-100 text-center text-xs leading-6 text-sky-700">
                    {name.charAt(0)}
                  </span>
                  {name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* Action */}
      <section className="mt-4">
        {slot.canBook ? (
          <PendingNavigationLink
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-4 text-center text-base font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-cyan-600 hover:shadow-md active:scale-[0.99]"
            href={`/parent/slots/${slot.id}/book`}
            pendingLabel="正在打开预约表单..."
          >
            去预约
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </PendingNavigationLink>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 text-center text-sm text-gray-600">
            当前状态不可在线预约
          </div>
        )}
      </section>
    </main>
  );
}
