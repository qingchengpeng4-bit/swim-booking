import { BookingStatus, SlotStatus, type CourseType, type Prisma } from "@prisma/client";
import { COURSE_LABELS, getCourseCapacity } from "@/lib/course";
import { formatShanghaiDateTime } from "@/lib/dates";
import {
  calculateSlotDisplayStatus,
  canParentBookSlot,
  slotStatusText,
} from "@/lib/slot-status";
import { prisma } from "@/lib/db";
import { getSlotCourseStateAfterCancel } from "@/lib/booking-rules";
import { toCoachSlotDetail, toParentSlotDetail } from "@/lib/privacy-rules";

type TxClient = Prisma.TransactionClient;

export async function refreshSlotCourseState(tx: TxClient, slotId: string) {
  const activeBookings = await tx.booking.findMany({
    where: {
      slotId,
      status: BookingStatus.ACTIVE,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      status: true,
      courseType: true,
    },
  });

  const nextCourseState = getSlotCourseStateAfterCancel(activeBookings);
  return tx.slot.update({
    where: { id: slotId },
    data: nextCourseState,
  });
}

export async function getSlotActiveBookingCount(slotId: string, tx: TxClient | typeof prisma = prisma) {
  return tx.booking.count({
    where: {
      slotId,
      status: BookingStatus.ACTIVE,
    },
  });
}

export async function getOpenSlots() {
  const slots = await prisma.slot.findMany({
    where: {
      status: {
        in: [SlotStatus.OPEN, SlotStatus.CANCELLED],
      },
    },
    orderBy: {
      startAt: "asc",
    },
    include: {
      bookings: {
        where: {
          status: BookingStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return slots.map((slot) => getSlotPublicSummary(slot, slot.bookings.length));
}

export async function getCoachSlots() {
  const slots = await prisma.slot.findMany({
    orderBy: {
      startAt: "asc",
    },
    include: {
      bookings: {
        where: {
          status: BookingStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return slots.map((slot) => getSlotPublicSummary(slot, slot.bookings.length));
}

export async function getParentSlotDetail(slotId: string) {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: {
      bookings: {
        where: {
          status: BookingStatus.ACTIVE,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          studentName: true,
        },
      },
    },
  });

  if (!slot) return null;

  return toParentSlotDetail(slot, slot.bookings);
}

export async function getCoachSlotDetail(slotId: string) {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: {
      bookings: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          studentName: true,
          contactPhone: true,
          courseType: true,
          status: true,
          remark: true,
          createdAt: true,
          cancelledAt: true,
          cancelReason: true,
        },
      },
    },
  });

  if (!slot) return null;

  return toCoachSlotDetail(slot, slot.bookings);
}

export function getSlotPublicSummary(
  slot: {
    id: string;
    startAt: Date;
    endAt: Date;
    status: SlotStatus;
    courseType: CourseType | null;
    capacity: number | null;
  },
  activeCount: number,
) {
  const displayStatus = calculateSlotDisplayStatus(slot, activeCount);
  const capacity = slot.capacity ?? (slot.courseType ? getCourseCapacity(slot.courseType) : null);

  return {
    id: slot.id,
    startAt: slot.startAt.toISOString(),
    endAt: slot.endAt.toISOString(),
    startText: formatShanghaiDateTime(slot.startAt),
    endText: formatShanghaiDateTime(slot.endAt),
    status: displayStatus,
    statusText: slotStatusText(displayStatus),
    courseType: slot.courseType,
    courseTypeText: slot.courseType ? COURSE_LABELS[slot.courseType] : "未锁定",
    activeCount,
    capacity,
    remaining: capacity === null ? null : Math.max(capacity - activeCount, 0),
    canBook: canParentBookSlot(slot, activeCount),
  };
}
