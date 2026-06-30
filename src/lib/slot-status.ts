import { CourseType, SlotStatus } from "@prisma/client";
import { getCourseCapacity } from "@/lib/course";
import { canParentBookByTime, canParentCancelByTime } from "@/lib/slot-time-rules";

export type SlotDisplayStatus =
  | "CLOSED"
  | "AVAILABLE"
  | "LOCKED_NOT_FULL"
  | "FULL"
  | "TODAY_LOCKED"
  | "EXPIRED"
  | "CANCELLED";

export type SlotStatusInput = {
  status: SlotStatus;
  startAt: Date;
  endAt: Date;
  courseType: CourseType | null;
  capacity: number | null;
};

export function calculateSlotDisplayStatus(
  slot: SlotStatusInput,
  activeCount: number,
  now = new Date(),
): SlotDisplayStatus {
  if (slot.status === SlotStatus.CANCELLED) return "CANCELLED";
  if (slot.status === SlotStatus.CLOSED) return "CLOSED";
  if (!canParentBookByTime(slot, now)) return "EXPIRED";

  if (!slot.courseType || activeCount === 0) return "AVAILABLE";

  const capacity = slot.capacity ?? getCourseCapacity(slot.courseType);
  return activeCount >= capacity ? "FULL" : "LOCKED_NOT_FULL";
}

export function canParentBookSlot(slot: SlotStatusInput, activeCount: number, now = new Date()) {
  const status = calculateSlotDisplayStatus(slot, activeCount, now);
  return status === "AVAILABLE" || status === "LOCKED_NOT_FULL";
}

export function canParentCancelBooking(slot: Pick<SlotStatusInput, "startAt" | "endAt">, now = new Date()) {
  return canParentCancelByTime(slot, now);
}

export function slotStatusText(status: SlotDisplayStatus) {
  const text: Record<SlotDisplayStatus, string> = {
    CLOSED: "未开放",
    AVAILABLE: "可预约",
    LOCKED_NOT_FULL: "可加入",
    FULL: "已满员",
    TODAY_LOCKED: "今日不可在线预约",
    EXPIRED: "已结束",
    CANCELLED: "已取消",
  };
  return text[status];
}
