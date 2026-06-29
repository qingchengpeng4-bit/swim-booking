import { PageHeader } from "@/components/common/PageHeader";
import { SlotList } from "@/components/parent/SlotList";
import { getOpenSlots } from "@/services/slot.service";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const slots = await getOpenSlots();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title="预约日历"
        description="v0.1 使用预置测试时间段，先验证核心预约规则。"
      />
      <SlotList slots={slots} />
    </main>
  );
}
