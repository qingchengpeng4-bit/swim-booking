import { BookingStatus, SlotStatus, type CourseType } from "@prisma/client";
import { getCourseCapacity } from "@/lib/course";
import { canParentCancelBooking } from "@/lib/slot-status";
import { prisma } from "@/lib/db";
import { BusinessError } from "@/services/errors";
import { refreshSlotCourseState } from "@/services/slot.service";
import { isTodayInShanghai } from "@/lib/dates";

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

export async function createBooking(input: CreateBookingInput) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({
      where: { id: input.slotId },
    });

    if (!slot) {
      throw new BusinessError("时间段不存在", 404);
    }

    if (slot.status !== SlotStatus.OPEN) {
      throw new BusinessError("该时间段暂不可预约");
    }

    if (isTodayInShanghai(slot.startAt)) {
      throw new BusinessError("今日课程不可在线预约，请联系教练");
    }

    const duplicate = await tx.booking.findFirst({
      where: {
        slotId: slot.id,
        contactPhone: input.contactPhone,
        status: BookingStatus.ACTIVE,
      },
    });

    if (duplicate) {
      throw new BusinessError("该手机号已预约此时间段，不能重复预约");
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
      throw new BusinessError("该时间段已锁定其他课程类型，不能选择不同课型");
    }

    const courseTypeToUse = lockedCourseType ?? input.courseType;
    const capacity = slot.capacity ?? getCourseCapacity(courseTypeToUse);

    if (activeCount >= capacity) {
      throw new BusinessError("该时间段已满员，不能继续预约");
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
  });
}

export async function cancelBooking(input: CancelBookingInput) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        slot: true,
      },
    });

    if (!booking) {
      throw new BusinessError("预约不存在", 404);
    }

    if (booking.contactPhone !== input.contactPhone) {
      throw new BusinessError("手机号不匹配，不能取消该预约", 403);
    }

    if (booking.status !== BookingStatus.ACTIVE) {
      throw new BusinessError("该预约已取消，不能重复取消");
    }

    if (!canParentCancelBooking(booking.slot)) {
      throw new BusinessError("今日课程不可在线取消，请联系教练");
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
