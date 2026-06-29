import { describe, expect, it } from "vitest";
import { BookingStatus, CourseType, SlotStatus } from "@prisma/client";
import {
  calculateSlotOccupancy,
  canCancelActiveBooking,
  canJoinSlot,
  countActiveBookings,
  getSlotCourseStateAfterCancel,
  isSlotFull,
} from "../lib/booking-rules";
import { APP_ERRORS } from "../lib/app-errors";

const openSlot = {
  status: SlotStatus.OPEN,
  courseType: null,
  capacity: null,
};

describe("slot booking rules", () => {
  it("counts only active bookings", () => {
    expect(
      countActiveBookings([
        { status: BookingStatus.ACTIVE },
        { status: BookingStatus.CANCELLED },
      ]),
    ).toBe(1);
  });

  it("calculates occupancy for empty and locked slots", () => {
    expect(calculateSlotOccupancy(openSlot, [])).toEqual({
      activeCount: 0,
      capacity: null,
      remaining: null,
      isFull: false,
    });

    expect(
      calculateSlotOccupancy(
        { courseType: CourseType.ONE_TO_TWO, capacity: 2 },
        [{ status: BookingStatus.ACTIVE }],
      ),
    ).toMatchObject({
      activeCount: 1,
      capacity: 2,
      remaining: 1,
      isFull: false,
    });
  });

  it("allows an empty slot to lock to a requested course type", () => {
    const result = canJoinSlot({
      slot: openSlot,
      activeBookings: [],
      requestedCourseType: CourseType.ONE_TO_THREE,
    });

    expect(result).toMatchObject({
      ok: true,
      lockedCourseType: CourseType.ONE_TO_THREE,
      capacity: 3,
      activeCount: 0,
    });
  });

  it("rejects joining with a mismatched locked course type", () => {
    const result = canJoinSlot({
      slot: { status: SlotStatus.OPEN, courseType: CourseType.ONE_TO_TWO, capacity: 2 },
      activeBookings: [{ status: BookingStatus.ACTIVE, courseType: CourseType.ONE_TO_TWO }],
      requestedCourseType: CourseType.ONE_TO_THREE,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe(APP_ERRORS.COURSE_TYPE_MISMATCH);
  });

  it("detects full slots and rejects additional joins", () => {
    const slot = { status: SlotStatus.OPEN, courseType: CourseType.ONE_TO_TWO, capacity: 2 };
    const bookings = [
      { status: BookingStatus.ACTIVE, courseType: CourseType.ONE_TO_TWO },
      { status: BookingStatus.ACTIVE, courseType: CourseType.ONE_TO_TWO },
    ];

    expect(isSlotFull(slot, bookings)).toBe(true);
    expect(
      canJoinSlot({
        slot,
        activeBookings: bookings,
        requestedCourseType: CourseType.ONE_TO_TWO,
      }).error,
    ).toBe(APP_ERRORS.SLOT_ALREADY_FULL);
  });

  it("allows cancelling only active bookings", () => {
    expect(canCancelActiveBooking({ status: BookingStatus.ACTIVE })).toBe(true);
    expect(canCancelActiveBooking({ status: BookingStatus.CANCELLED })).toBe(false);
  });

  it("keeps course state while active bookings remain and resets when empty", () => {
    expect(
      getSlotCourseStateAfterCancel([
        { status: BookingStatus.CANCELLED, courseType: CourseType.ONE_TO_TWO },
        { status: BookingStatus.ACTIVE, courseType: CourseType.ONE_TO_TWO },
      ]),
    ).toEqual({
      courseType: CourseType.ONE_TO_TWO,
      capacity: 2,
    });

    expect(
      getSlotCourseStateAfterCancel([
        { status: BookingStatus.CANCELLED, courseType: CourseType.ONE_TO_TWO },
      ]),
    ).toEqual({
      courseType: null,
      capacity: null,
    });
  });
});
