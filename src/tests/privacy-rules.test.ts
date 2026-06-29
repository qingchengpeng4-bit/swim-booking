import { describe, expect, it } from "vitest";
import { BookingStatus, CourseType, SlotStatus } from "@prisma/client";
import { toCoachSlotDetail, toParentBookingView, toParentSlotDetail } from "../lib/privacy-rules";

const slot = {
  id: "slot-privacy",
  startAt: new Date("2026-07-01T02:00:00.000Z"),
  endAt: new Date("2026-07-01T03:00:00.000Z"),
  status: SlotStatus.OPEN,
  courseType: CourseType.ONE_TO_TWO,
  capacity: 2,
};

describe("privacy rules", () => {
  it("returns group student names to parents without sensitive fields", () => {
    const detail = toParentSlotDetail(slot, [
      { studentName: "Student A" },
      { studentName: "Student B" },
    ]);
    const serialized = JSON.stringify(detail);

    expect(detail.registeredStudentNames).toEqual(["Student A", "Student B"]);
    expect(serialized).not.toContain("contactPhone");
    expect(serialized).not.toContain("remark");
    expect(serialized).not.toContain("createdAt");
  });

  it("returns complete booking information to coach view", () => {
    const detail = toCoachSlotDetail(slot, [
      {
        id: "booking-1",
        studentName: "Student A",
        contactPhone: "19900000001",
        courseType: CourseType.ONE_TO_TWO,
        status: BookingStatus.ACTIVE,
        remark: "Private remark",
        createdAt: new Date("2026-06-30T01:00:00.000Z"),
        cancelledAt: null,
        cancelReason: null,
      },
    ]);

    expect(detail.bookings[0]).toMatchObject({
      studentName: "Student A",
      contactPhone: "19900000001",
      remark: "Private remark",
      createdAt: "2026-06-30T01:00:00.000Z",
    });
  });

  it("returns only parent-safe booking fields for my bookings", () => {
    const view = toParentBookingView(
      {
        id: "booking-1",
        slotId: "slot-1",
        studentName: "Student A",
        courseType: CourseType.ONE_TO_ONE,
        status: BookingStatus.ACTIVE,
        contactPhone: "19900000001",
        remark: "Private remark",
        createdAt: new Date("2026-06-30T01:00:00.000Z"),
        slot: {
          startAt: new Date("2026-07-01T02:00:00.000Z"),
          endAt: new Date("2026-07-01T03:00:00.000Z"),
        },
      },
      true,
      null,
    );
    const serialized = JSON.stringify(view);

    expect(view.studentName).toBe("Student A");
    expect(serialized).not.toContain("19900000001");
    expect(serialized).not.toContain("Private remark");
    expect(serialized).not.toContain("createdAt");
  });
});
