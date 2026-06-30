import { SlotStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildSlotSeedPlan, isFixedGroupClass } from "@/lib/slot-seed-plan";

function shanghaiDateAt(dateOnly: string, hour: number) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 8, 0, 0));
}

describe("slot seed plan", () => {
  it("generates eight one-hour slots per day in the configured date range", () => {
    const plan = buildSlotSeedPlan(shanghaiDateAt("2026-06-30", 9), "2026-07-02");

    expect(plan).toHaveLength(24);
    expect(plan[0].startAt.toISOString()).toBe(shanghaiDateAt("2026-06-30", 12).toISOString());
    expect(plan[7].startAt.toISOString()).toBe(shanghaiDateAt("2026-06-30", 19).toISOString());
    expect(plan[23].startAt.toISOString()).toBe(shanghaiDateAt("2026-07-02", 19).toISOString());
  });

  it("marks fixed group class times as closed slots", () => {
    expect(isFixedGroupClass(shanghaiDateAt("2026-06-30", 19))).toBe(true);
    expect(isFixedGroupClass(shanghaiDateAt("2026-07-04", 19))).toBe(true);
    expect(isFixedGroupClass(shanghaiDateAt("2026-07-05", 12))).toBe(true);
    expect(isFixedGroupClass(shanghaiDateAt("2026-07-05", 13))).toBe(false);
  });

  it("includes fixed group classes as CLOSED and normal times as OPEN", () => {
    const plan = buildSlotSeedPlan(shanghaiDateAt("2026-06-30", 9), "2026-06-30");
    const groupClass = plan.find((slot) => slot.startAt.getTime() === shanghaiDateAt("2026-06-30", 19).getTime());
    const normalClass = plan.find((slot) => slot.startAt.getTime() === shanghaiDateAt("2026-06-30", 18).getTime());

    expect(groupClass?.status).toBe(SlotStatus.CLOSED);
    expect(groupClass?.label).toBe("GROUP_CLASS");
    expect(normalClass?.status).toBe(SlotStatus.OPEN);
    expect(normalClass?.label).toBe("OPEN");
  });
});
