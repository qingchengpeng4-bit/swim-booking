import { SlotStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
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

  it("hides custom weekly blocked labels from parent-facing summaries", () => {
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
      "李力",
    );

    expect(summary.status).toBe("CLOSED");
    expect(summary.statusText).toBe("已占用");
    expect(summary.blockedLabel).toBe("已占用");
    expect(summary.canBook).toBe(false);
    expect(JSON.stringify(summary)).not.toContain("李力");
  });

  it("can expose custom weekly blocked labels for coach-only views", () => {
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
      "李力",
      { exposeBlockedLabel: true },
    );

    expect(summary.status).toBe("CLOSED");
    expect(summary.statusText).toBe("李力");
    expect(summary.blockedLabel).toBe("李力");
    expect(summary.canBook).toBe(false);
  });
});
