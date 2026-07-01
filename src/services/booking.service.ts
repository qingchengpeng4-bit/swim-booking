import { BookingStatus, Prisma, SlotStatus, type CourseType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BusinessError } from "@/services/errors";
import { refreshSlotCourseState } from "@/services/slot.service";
import { APP_ERRORS } from "@/lib/app-errors";
import { canCancelActiveBooking, canJoinSlot } from "@/lib/booking-rules";
import { toParentBookingView } from "@/lib/privacy-rules";
import { isDatabaseConnectionError, isRetryableTransactionError } from "@/lib/prisma-errors";
import { canCoachAddBookingByTime, canParentBookByTime, canParentCancelByTime } from "@/lib/slot-time-rules";

export type CreateBookingInput = {
  slotId: string;
  studentName: string;
  contactPhone: string;
  courseType: CourseType;
  remark?: string;
};

export type CreateCoachBookingInput = {
  slotId: string;
  studentName: string;
  contactPhone?: string | null;
  courseType: CourseType;
  remark?: string | null;
};

export type CancelBookingInput = {
  bookingId: string;
  contactPhone: string;
};

export type CoachCancelBookingInput = {
  bookingId: string;
  reason?: string;
};

const CREATE_BOOKING_MAX_RETRIES = 2;

async function createParentBookingOnce(input: CreateBookingInput) {
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

    if (!canParentBookByTime(slot)) {
      throw new BusinessError(APP_ERRORS.SLOT_ALREADY_STARTED);
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
        status: true,
        courseType: true,
      },
    });

    const joinResult = canJoinSlot({
      slot,
      activeBookings,
      requestedCourseType: input.courseType,
    });

    if (!joinResult.ok) {
      throw new BusinessError(joinResult.error ?? APP_ERRORS.SLOT_CLOSED);
    }

    if (!slot.courseType || slot.capacity === null) {
      await tx.slot.update({
        where: { id: slot.id },
        data: {
          courseType: joinResult.lockedCourseType,
          capacity: joinResult.capacity,
        },
      });
    }

    return tx.booking.create({
      data: {
        slotId: slot.id,
        coachId: slot.coachId,
        studentName: input.studentName,
        contactPhone: input.contactPhone,
        courseType: joinResult.lockedCourseType,
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
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10000,
    timeout: 20000,
  });
}

export async function createParentBooking(input: CreateBookingInput) {
  let retryCount = 0;
  let lastRetryableError: "database" | "transaction" | null = null;

  while (retryCount <= CREATE_BOOKING_MAX_RETRIES) {
    try {
      return await createParentBookingOnce(input);
    } catch (error) {
      if (error instanceof BusinessError && error.code === APP_ERRORS.SLOT_ALREADY_FULL.code && retryCount > 0) {
        throw new BusinessError(APP_ERRORS.SLOT_JUST_FILLED);
      }

      if (isDatabaseConnectionError(error)) {
        lastRetryableError = "database";
        retryCount += 1;
        continue;
      }

      if (isRetryableTransactionError(error)) {
        lastRetryableError = "transaction";
        retryCount += 1;
        continue;
      }

      throw error;
    }
  }

  throw new BusinessError(lastRetryableError === "database" ? APP_ERRORS.DATABASE_UNAVAILABLE : APP_ERRORS.BOOKING_CONFLICT_RETRY_LATER);
}

export async function createCoachBooking(input: CreateCoachBookingInput) {
  const studentName = input.studentName.trim();
  if (!studentName) {
    throw new BusinessError(APP_ERRORS.STUDENT_NAME_REQUIRED);
  }

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

    if (!canCoachAddBookingByTime(slot)) {
      throw new BusinessError(APP_ERRORS.SLOT_ALREADY_STARTED);
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
        status: true,
        courseType: true,
      },
    });

    const joinResult = canJoinSlot({
      slot,
      activeBookings,
      requestedCourseType: input.courseType,
    });

    if (!joinResult.ok) {
      throw new BusinessError(joinResult.error ?? APP_ERRORS.SLOT_CLOSED);
    }

    if (!slot.courseType || slot.capacity === null) {
      await tx.slot.update({
        where: { id: slot.id },
        data: {
          courseType: joinResult.lockedCourseType,
          capacity: joinResult.capacity,
        },
      });
    }

    return tx.booking.create({
      data: {
        slotId: slot.id,
        coachId: slot.coachId,
        studentName,
        contactPhone: input.contactPhone?.trim() ?? "",
        courseType: joinResult.lockedCourseType,
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
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
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

    if (!canCancelActiveBooking(booking)) {
      throw new BusinessError(APP_ERRORS.BOOKING_ALREADY_CANCELLED);
    }

    if (!canParentCancelByTime(booking.slot)) {
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

    if (!canCancelActiveBooking(booking)) {
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

  return bookings.map((booking) => {
    const canCancel = booking.status === BookingStatus.ACTIVE && canParentCancelByTime(booking.slot);
    const cancelHint =
      booking.status === BookingStatus.ACTIVE && !canParentCancelByTime(booking.slot)
        ? APP_ERRORS.TODAY_PARENT_CANCEL_NOT_ALLOWED.message
        : null;

    return toParentBookingView(booking, canCancel, cancelHint);
  });
}
