import { BookingStatus, SlotStatus, type CourseType } from "@prisma/client";
import { getCourseCapacity } from "@/lib/course";
import { canParentCancelBooking } from "@/lib/slot-status";
import { prisma } from "@/lib/db";
import { BusinessError } from "@/services/errors";
import { refreshSlotCourseState } from "@/services/slot.service";
import { isTodayInShanghai } from "@/lib/dates";
import { APP_ERRORS } from "@/lib/app-errors";

export type CreateBookingInput = {
  slotId: string;
  studentName: string;
  contactPhone: string;
  courseType: CourseType;
  remark?: string;
};

export type CancelBookingInput = {
  bookingId: string;
  contactPhone: string;
};

export type CoachCancelBookingInput = {
  bookingId: string;
  reason?: string;
};

export async function createParentBooking(input: CreateBookingInput) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({
      where: { id: input.slotId },
    });

    if (!slot) {
      throw new BusinessError(APP_ERRORS.SLOT_NOT_FOUND);
    }

    if (slot.status !== SlotStatus.OPEN) {
      throw new BusinessError(APP_ERRORS.SLOT_CLOSED);
    }

    if (isTodayInShanghai(slot.startAt)) {
      throw new BusinessError(APP_ERRORS.TODAY_BOOKING_NOT_ALLOWED);
    }

    const duplicate = await tx.booking.findFirst({
      where: {
        slotId: slot.id,
        contactPhone: input.contactPhone,
        status: BookingStatus.ACTIVE,
      },
    });

    if (duplicate) {
      throw new BusinessError(APP_ERRORS.DUPLICATE_BOOKING);
    }

    const activeBookings = await tx.booking.findMany({
      where: {
        slotId: slot.id,
        status: BookingStatus.ACTIVE,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        courseType: true,
      },
    });

    const activeCount = activeBookings.length;
    const lockedCourseType = slot.courseType ?? activeBookings[0]?.courseType ?? null;

    if (lockedCourseType && lockedCourseType !== input.courseType) {
      throw new BusinessError(APP_ERRORS.COURSE_TYPE_MISMATCH);
    }

    const courseTypeToUse = lockedCourseType ?? input.courseType;
    const capacity = slot.capacity ?? getCourseCapacity(courseTypeToUse);

    if (activeCount >= capacity) {
      throw new BusinessError(APP_ERRORS.SLOT_ALREADY_FULL);
    }

    if (!slot.courseType || slot.capacity === null) {
      await tx.slot.update({
        where: { id: slot.id },
        data: {
          courseType: courseTypeToUse,
          capacity,
        },
      });
    }

    return tx.booking.create({
      data: {
        slotId: slot.id,
        coachId: slot.coachId,
        studentName: input.studentName,
        contactPhone: input.contactPhone,
        courseType: courseTypeToUse,
        remark: input.remark?.trim() || null,
      },
      select: {
        id: true,
        studentName: true,
        contactPhone: true,
        courseType: true,
        status: true,
        slotId: true,
        createdAt: true,
      },
    });
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
}

export async function cancelParentBooking(input: CancelBookingInput) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        slot: true,
      },
    });

    if (!booking) {
      throw new BusinessError(APP_ERRORS.BOOKING_NOT_FOUND);
    }

    if (booking.contactPhone !== input.contactPhone) {
      throw new BusinessError(APP_ERRORS.BOOKING_PHONE_MISMATCH);
    }

    if (booking.status !== BookingStatus.ACTIVE) {
      throw new BusinessError(APP_ERRORS.BOOKING_ALREADY_CANCELLED);
    }

    if (!canParentCancelBooking(booking.slot)) {
      throw new BusinessError(APP_ERRORS.TODAY_PARENT_CANCEL_NOT_ALLOWED);
    }

    const cancelled = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: "家长自行取消",
        cancelledAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        cancelledAt: true,
      },
    });

    await refreshSlotCourseState(tx, booking.slotId);

    return cancelled;
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
}

export async function cancelCoachBooking(input: CoachCancelBookingInput) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        slot: true,
      },
    });

    if (!booking) {
      throw new BusinessError(APP_ERRORS.BOOKING_NOT_FOUND);
    }

    if (booking.status !== BookingStatus.ACTIVE) {
      throw new BusinessError(APP_ERRORS.BOOKING_ALREADY_CANCELLED);
    }

    const cancelled = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: input.reason?.trim() || "Coach cancelled",
        cancelledAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        cancelledAt: true,
      },
    });

    await refreshSlotCourseState(tx, booking.slotId);

    return cancelled;
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
}

export async function getBookingsByContactPhone(contactPhone: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      contactPhone,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      slot: true,
    },
  });

  return bookings.map((booking) => ({
    id: booking.id,
    slotId: booking.slotId,
    studentName: booking.studentName,
    courseType: booking.courseType,
    status: booking.status,
    startAt: booking.slot.startAt.toISOString(),
    endAt: booking.slot.endAt.toISOString(),
    canCancel:
      booking.status === BookingStatus.ACTIVE && canParentCancelBooking(booking.slot),
    cancelHint:
      booking.status === BookingStatus.ACTIVE && !canParentCancelBooking(booking.slot)
        ? "今日课程不可在线取消，请联系教练"
        : null,
  }));
}
