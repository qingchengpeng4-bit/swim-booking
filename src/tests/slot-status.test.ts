import { describe, expect, it } from "vitest";
import { CourseType, SlotStatus } from "@prisma/client";
import {
  calculateSlotDisplayStatus,
  canParentBookSlot,
  canParentCancelBooking,
} from "../lib/slot-status";

function futureDate(dayOffset: number, hour = 10) {
  const date = new Date("2026-06-29T02:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour - 8, 0, 0, 0);
  return date;
}

const now = new Date("2026-06-29T04:00:00.000Z");

describe("slot status", () => {
  it("marks an empty future open slot as available", () => {
    const status = calculateSlotDisplayStatus(
      {
        status: SlotStatus.OPEN,
        startAt: futureDate(1),
        endAt: futureDate(1, 11),
        courseType: null,
        capacity: null,
      },
      0,
      now,
    );

    expect(status).toBe("AVAILABLE");
  });

  it("marks a partially filled 1v2 slot as locked but not full", () => {
    const status = calculateSlotDisplayStatus(
      {
        status: SlotStatus.OPEN,
        startAt: futureDate(1),
        endAt: futureDate(1, 11),
        courseType: CourseType.ONE_TO_TWO,
        capacity: 2,
      },
      1,
      now,
    );

    expect(status).toBe("LOCKED_NOT_FULL");
  });

  it("marks a full 1v2 slot as full", () => {
    const status = calculateSlotDisplayStatus(
      {
        status: SlotStatus.OPEN,
        startAt: futureDate(1),
        endAt: futureDate(1, 11),
        courseType: CourseType.ONE_TO_TWO,
        capacity: 2,
      },
      2,
      now,
    );

    expect(status).toBe("FULL");
  });

  it("blocks parent booking for today", () => {
    const slot = {
      status: SlotStatus.OPEN,
      startAt: futureDate(0, 15),
      endAt: futureDate(0, 16),
      courseType: null,
      capacity: null,
    };

    expect(calculateSlotDisplayStatus(slot, 0, now)).toBe("TODAY_LOCKED");
    expect(canParentBookSlot(slot, 0, now)).toBe(false);
  });

  it("blocks parent cancellation for today", () => {
    expect(
      canParentCancelBooking(
        {
          startAt: futureDate(0, 15),
          endAt: futureDate(0, 16),
        },
        now,
      ),
    ).toBe(false);
  });

  it("allows parent cancellation for a future slot", () => {
    expect(
      canParentCancelBooking(
        {
          startAt: futureDate(1),
          endAt: futureDate(1, 11),
        },
        now,
      ),
    ).toBe(true);
  });
});
