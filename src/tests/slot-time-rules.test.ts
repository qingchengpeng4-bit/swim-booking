import { describe, expect, it } from "vitest";
import {
  canCoachAddBookingByTime,
  canCoachCancelByTime,
  canParentBookByTime,
  canParentCancelByTime,
  isSlotStarted,
  isSlotToday,
} from "@/lib/slot-time-rules";

function shanghaiSlot(dateOnly: string, startHour: number, endHour: number) {
  const [year, month, day] = dateOnly.split("-").map(Number);

  return {
    startAt: new Date(Date.UTC(year, month - 1, day, startHour - 8, 0, 0)),
    endAt: new Date(Date.UTC(year, month - 1, day, endHour - 8, 0, 0)),
  };
}

describe("slot time rules", () => {
  const now = new Date("2026-07-01T15:30:00+08:00");

  it("allows parents to book a later slot today", () => {
    const slot = shanghaiSlot("2026-07-01", 16, 17);

    expect(isSlotToday(slot, now)).toBe(true);
    expect(isSlotStarted(slot, now)).toBe(false);
    expect(canParentBookByTime(slot, now)).toBe(true);
  });

  it("blocks parents from booking a slot that has already started today", () => {
    const slot = shanghaiSlot("2026-07-01", 15, 16);

    expect(isSlotStarted(slot, now)).toBe(true);
    expect(canParentBookByTime(slot, now)).toBe(false);
  });

  it("blocks parents from booking a slot that has already ended today", () => {
    const slot = shanghaiSlot("2026-07-01", 12, 13);

    expect(isSlotStarted(slot, now)).toBe(true);
    expect(canParentBookByTime(slot, now)).toBe(false);
  });

  it("allows parents to book a slot tomorrow", () => {
    const slot = shanghaiSlot("2026-07-02", 12, 13);

    expect(isSlotToday(slot, now)).toBe(false);
    expect(canParentBookByTime(slot, now)).toBe(true);
  });

  it("blocks parents from booking exactly at the slot start time", () => {
    const slot = shanghaiSlot("2026-07-01", 16, 17);
    const exactStart = new Date("2026-07-01T16:00:00+08:00");

    expect(isSlotStarted(slot, exactStart)).toBe(true);
    expect(canParentBookByTime(slot, exactStart)).toBe(false);
  });

  it("blocks parent cancellation for any course today", () => {
    const futureToday = shanghaiSlot("2026-07-01", 20, 21);

    expect(isSlotToday(futureToday, now)).toBe(true);
    expect(canParentCancelByTime(futureToday, now)).toBe(false);
  });

  it("allows parent cancellation for a future-date course", () => {
    const tomorrow = shanghaiSlot("2026-07-02", 12, 13);

    expect(canParentCancelByTime(tomorrow, now)).toBe(true);
  });

  it("blocks parent cancellation after a course has started", () => {
    const started = shanghaiSlot("2026-07-01", 15, 16);

    expect(canParentCancelByTime(started, now)).toBe(false);
  });

  it("does not limit coach cancellation by date", () => {
    const today = shanghaiSlot("2026-07-01", 12, 13);
    const tomorrow = shanghaiSlot("2026-07-02", 12, 13);

    expect(canCoachCancelByTime(today, now)).toBe(true);
    expect(canCoachCancelByTime(tomorrow, now)).toBe(true);
  });

  it("allows coach add-booking only before the slot starts", () => {
    const laterToday = shanghaiSlot("2026-07-01", 16, 17);
    const startedToday = shanghaiSlot("2026-07-01", 15, 16);

    expect(canCoachAddBookingByTime(laterToday, now)).toBe(true);
    expect(canCoachAddBookingByTime(startedToday, now)).toBe(false);
  });
});
