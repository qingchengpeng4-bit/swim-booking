import Link from "next/link";
import { StatusBadge } from "@/components/common/StatusBadge";

type SlotListProps = {
  slots: Array<{
    id: string;
    startText: string;
    endText: string;
    statusText: string;
    courseTypeText: string;
    activeCount: number;
    capacity: number | null;
    canBook: boolean;
  }>;
};

export function SlotList({ slots }: SlotListProps) {
  if (slots.length === 0) {
    return <p className="rounded bg-white p-4 text-gray-600">暂无可查看时间段。</p>;
  }

  return (
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
                <StatusBadge
                  text={`人数：${slot.activeCount}/${slot.capacity ?? "未定"}`}
                />
              </div>
            </div>
            <Link className="rounded bg-blue-600 px-4 py-2 text-center text-white" href={`/parent/slots/${slot.id}`}>
              查看详情
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
