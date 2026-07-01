import { BookingStatus, SlotStatus, type CourseType, type Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
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
import { COACH_WEEKLY_SCHEDULE_TAG, PARENT_WEEKLY_SCHEDULE_TAG } from "@/lib/schedule-cache";

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

async function queryParentWeeklySlots(weekStartIso: string, weekEndIso: string) {
  const slots = await prisma.slot.findMany({
    where: {
      startAt: {
        gte: new Date(weekStartIso),
        lt: new Date(weekEndIso),
      },
    },
    orderBy: {
      startAt: "asc",
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      courseType: true,
      capacity: true,
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

const getCachedParentWeeklySlots = unstable_cache(queryParentWeeklySlots, ["parent-weekly-slots"], {
  revalidate: 10,
  tags: [PARENT_WEEKLY_SCHEDULE_TAG],
});

export async function getParentWeeklySlots(weekStart: Date, weekEnd: Date) {
  return getCachedParentWeeklySlots(weekStart.toISOString(), weekEnd.toISOString());
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

async function queryCoachWeeklySlots(weekStartIso: string, weekEndIso: string) {
  const slots = await prisma.slot.findMany({
    where: {
      startAt: {
        gte: new Date(weekStartIso),
        lt: new Date(weekEndIso),
      },
    },
    orderBy: {
      startAt: "asc",
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      courseType: true,
      capacity: true,
      bookings: {
        where: {
          status: BookingStatus.ACTIVE,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          studentName: true,
          status: true,
        },
      },
    },
  });

  return slots.map((slot) => ({
    id: slot.id,
    startAt: slot.startAt.toISOString(),
    endAt: slot.endAt.toISOString(),
    status: slot.status,
    courseType: slot.courseType,
    capacity: slot.capacity ?? (slot.courseType ? getCourseCapacity(slot.courseType) : null),
    activeCount: slot.bookings.length,
    bookings: slot.bookings,
  }));
}

const getCachedCoachWeeklySlots = unstable_cache(queryCoachWeeklySlots, ["coach-weekly-slots"], {
  revalidate: 10,
  tags: [COACH_WEEKLY_SCHEDULE_TAG],
});

export async function getCoachWeeklySlots(weekStart: Date, weekEnd: Date) {
  return getCachedCoachWeeklySlots(weekStart.toISOString(), weekEnd.toISOString());
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
