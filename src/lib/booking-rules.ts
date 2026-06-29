import { BookingStatus, CourseType, SlotStatus } from "@prisma/client";
import { APP_ERRORS, type AppErrorDefinition } from "@/lib/app-errors";
import { getCourseCapacity } from "@/lib/course";

export type BookingLike = {
  status: BookingStatus;
  courseType: CourseType;
};

export type SlotLike = {
  status: SlotStatus;
  courseType: CourseType | null;
  capacity: number | null;
};

export function countActiveBookings(bookings: Array<Pick<BookingLike, "status">>) {
  return bookings.filter((booking) => booking.status === BookingStatus.ACTIVE).length;
}

export function calculateSlotOccupancy(slot: Pick<SlotLike, "courseType" | "capacity">, bookings: Array<Pick<BookingLike, "status">>) {
  const activeCount = countActiveBookings(bookings);
  const capacity = slot.capacity ?? (slot.courseType ? getCourseCapacity(slot.courseType) : null);

  return {
    activeCount,
    capacity,
    remaining: capacity === null ? null : Math.max(capacity - activeCount, 0),
    isFull: capacity !== null && activeCount >= capacity,
  };
}

export function isSlotFull(slot: Pick<SlotLike, "courseType" | "capacity">, activeBookings: Array<Pick<BookingLike, "status">>) {
  return calculateSlotOccupancy(slot, activeBookings).isFull;
}

export function canJoinSlot({
  slot,
  activeBookings,
  requestedCourseType,
}: {
  slot: SlotLike;
  activeBookings: BookingLike[];
  requestedCourseType: CourseType;
}): {
  ok: boolean;
  error?: AppErrorDefinition;
  lockedCourseType: CourseType;
  capacity: number;
  activeCount: number;
} {
  const activeCount = countActiveBookings(activeBookings);
  const lockedCourseType = slot.courseType ?? activeBookings.find((booking) => booking.status === BookingStatus.ACTIVE)?.courseType ?? null;

  if (slot.status !== SlotStatus.OPEN) {
    return {
      ok: false,
      error: APP_ERRORS.SLOT_CLOSED,
      lockedCourseType: lockedCourseType ?? requestedCourseType,
      capacity: lockedCourseType ? getCourseCapacity(lockedCourseType) : getCourseCapacity(requestedCourseType),
      activeCount,
    };
  }

  if (lockedCourseType && lockedCourseType !== requestedCourseType) {
    return {
      ok: false,
      error: APP_ERRORS.COURSE_TYPE_MISMATCH,
      lockedCourseType,
      capacity: slot.capacity ?? getCourseCapacity(lockedCourseType),
      activeCount,
    };
  }

  const courseTypeToUse = lockedCourseType ?? requestedCourseType;
  const capacity = slot.capacity ?? getCourseCapacity(courseTypeToUse);

  if (activeCount >= capacity) {
    return {
      ok: false,
      error: APP_ERRORS.SLOT_ALREADY_FULL,
      lockedCourseType: courseTypeToUse,
      capacity,
      activeCount,
    };
  }

  return {
    ok: true,
    lockedCourseType: courseTypeToUse,
    capacity,
    activeCount,
  };
}

export function canCancelActiveBooking(booking: Pick<BookingLike, "status">) {
  return booking.status === BookingStatus.ACTIVE;
}

export function getSlotCourseStateAfterCancel(activeBookingsAfterCancel: Array<Pick<BookingLike, "courseType" | "status">>) {
  const activeBookings = activeBookingsAfterCancel.filter((booking) => booking.status === BookingStatus.ACTIVE);

  if (activeBookings.length === 0) {
    return {
      courseType: null,
      capacity: null,
    };
  }

  const courseType = activeBookings[0].courseType;
  return {
    courseType,
    capacity: getCourseCapacity(courseType),
  };
}
