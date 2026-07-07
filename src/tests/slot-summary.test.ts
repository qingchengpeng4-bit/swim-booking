import { describe, expect, it } from "vitest";
import { SlotStatus } from "@prisma/client";
import { getSlotPublicSummary } from "../services/slot.service";

describe("slot public summary", () => {
  it("handles an empty slot with null course type and capacity", () => {
    const startAt = new Date("2026-06-30T02:00:00.000Z");
    const endAt = new Date("2026-06-30T03:00:00.000Z");

    const summary = getSlotPublicSummary(
      {
        id: "slot-1",
        startAt,
        endAt,
        status: SlotStatus.OPEN,
        courseType: null,
        capacity: null,
      },
      0,
    );

    expect(summary.courseType).toBeNull();
    expect(summary.courseTypeText).toBe("未锁定");
    expect(summary.capacity).toBeNull();
    expect(summary.remaining).toBeNull();
    expect(summary.activeCount).toBe(0);
  });

  it("marks custom weekly blocked slots as unavailable without changing stored slot status", () => {
    const startAt = new Date("2026-06-30T02:00:00.000Z");
    const endAt = new Date("2026-06-30T03:00:00.000Z");

    const summary = getSlotPublicSummary(
      {
        id: "slot-1",
        startAt,
        endAt,
        status: SlotStatus.OPEN,
        courseType: null,
        capacity: null,
      },
      0,
      "大班课",
    );

    expect(summary.status).toBe("CLOSED");
    expect(summary.statusText).toBe("大班课");
    expect(summary.blockedLabel).toBe("大班课");
    expect(summary.canBook).toBe(false);
  });
});
