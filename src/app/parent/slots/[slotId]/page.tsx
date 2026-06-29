import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getSlotDetail } from "@/services/slot.service";

export const dynamic = "force-dynamic";

type SlotDetailPageProps = {
  params: Promise<{
    slotId: string;
  }>;
};

export default async function SlotDetailPage({ params }: SlotDetailPageProps) {
  const { slotId } = await params;
  const slot = await getSlotDetail(slotId);

  if (!slot) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="时间段详情" />

      <section className="rounded border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold">{slot.startText}</h2>
        <p className="mt-1 text-sm text-gray-600">结束：{slot.endText}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge text={slot.statusText} />
          <StatusBadge text={`课型：${slot.courseTypeText}`} />
          <StatusBadge text={`人数：${slot.activeCount}/${slot.capacity ?? "未定"}`} />
          <StatusBadge text={`剩余：${slot.remaining ?? "未定"}`} />
        </div>

        {slot.reminder ? (
          <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-800">{slot.reminder}</p>
        ) : null}

        {slot.registeredStudentNames.length > 0 ? (
          <div className="mt-4">
            <h3 className="font-medium">已报名学员姓名</h3>
            <ul className="mt-2 list-inside list-disc text-sm text-gray-700">
              {slot.registeredStudentNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {slot.canBook ? (
          <Link className="mt-6 block rounded bg-blue-600 px-4 py-3 text-center text-white" href={`/parent/slots/${slot.id}/book`}>
            去预约
          </Link>
        ) : (
          <p className="mt-6 rounded bg-gray-50 p-3 text-sm text-gray-700">
            当前状态不可在线预约。
          </p>
        )}
      </section>
    </main>
  );
}
