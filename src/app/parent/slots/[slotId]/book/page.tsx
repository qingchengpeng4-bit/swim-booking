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
      <PageHeader title="提交预约" description={`${slot.startText}，当前课型：${slot.courseTypeText}`} />
      <BookingForm slotId={slot.id} lockedCourseType={slot.courseType} />
    </main>
  );
}
