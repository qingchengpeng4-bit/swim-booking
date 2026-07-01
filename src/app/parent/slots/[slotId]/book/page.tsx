import { notFound, redirect } from "next/navigation";
import { BookingForm } from "@/components/parent/BookingForm";
import { PageHeader } from "@/components/common/PageHeader";
import { getParentSlotDetail } from "@/services/slot.service";

export const dynamic = "force-dynamic";

type BookPageProps = {
  params: Promise<{
    slotId: string;
  }>;
};

export default async function BookPage({ params }: BookPageProps) {
  const { slotId } = await params;
  const slot = await getParentSlotDetail(slotId);

  if (!slot) {
    notFound();
  }

  if (!slot.canBook) {
    redirect(`/parent/slots/${slot.id}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader title="提交预约" />
      <div className="mb-6 rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-sm text-sky-800">
        <span className="font-medium">{slot.startText}</span>
        <span className="mx-1.5 text-sky-300">·</span>
        <span>{slot.courseTypeText}</span>
        <span className="mx-1.5 text-sky-300">·</span>
        <span>剩余 {slot.remaining ?? "未定"} 个名额</span>
      </div>
      <BookingForm slotId={slot.id} lockedCourseType={slot.courseType} />
    </main>
  );
}
