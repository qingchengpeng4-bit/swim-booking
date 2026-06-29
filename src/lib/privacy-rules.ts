import { BookingStatus, CourseType, SlotStatus } from "@prisma/client";
import { isGroupCourse } from "@/lib/course";
import { getSlotPublicSummary } from "@/services/slot.service";

type PublicSlotLike = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: SlotStatus;
  courseType: CourseType | null;
  capacity: number | null;
};

type ParentBookingLike = {
  studentName: string;
};

type CoachBookingLike = {
  id: string;
  studentName: string;
  contactPhone: string;
  courseType: CourseType;
  status: BookingStatus;
  remark: string | null;
  createdAt: Date;
  cancelledAt: Date | null;
  cancelReason: string | null;
};

export function toParentSlotDetail(slot: PublicSlotLike, activeBookings: ParentBookingLike[]) {
  const summary = getSlotPublicSummary(slot, activeBookings.length);

  return {
    ...summary,
    registeredStudentNames: isGroupCourse(slot.courseType)
      ? activeBookings.map((booking) => booking.studentName)
      : [],
    reminder: isGroupCourse(slot.courseType) || slot.courseType === null
      ? "1v2 / 1v3 为固定拼团课程，请确认你已和同伴及教练沟通好，再报名。若截止时间前未满员，课程将自动取消。"
      : null,
  };
}

export function toCoachBookingView(booking: CoachBookingLike) {
  return {
    ...booking,
    createdAt: booking.createdAt.toISOString(),
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
  };
}

export function toCoachSlotDetail(slot: PublicSlotLike, bookings: CoachBookingLike[]) {
  const activeCount = bookings.filter((booking) => booking.status === BookingStatus.ACTIVE).length;

  return {
    ...getSlotPublicSummary(slot, activeCount),
    bookings: bookings.map(toCoachBookingView),
  };
}

export function toParentBookingView<T extends {
  id: string;
  slotId: string;
  studentName: string;
  courseType: CourseType;
  status: BookingStatus;
  slot: {
    startAt: Date;
    endAt: Date;
  };
}>(booking: T, canCancel: boolean, cancelHint: string | null) {
  return {
    id: booking.id,
    slotId: booking.slotId,
    studentName: booking.studentName,
    courseType: booking.courseType,
    status: booking.status,
    startAt: booking.slot.startAt.toISOString(),
    endAt: booking.slot.endAt.toISOString(),
    canCancel,
    cancelHint,
  };
}
