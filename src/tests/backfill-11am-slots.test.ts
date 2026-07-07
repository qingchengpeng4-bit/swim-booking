import { SlotStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  applyMissingElevenAmSlots,
  buildElevenAmBackfillPlan,
  shanghaiDateAt,
  type ExistingBackfillSlot,
} from "../../scripts/backfill-11am-slots";

function slot(dateKey: string, hour: number, coachId = "coach-1"): ExistingBackfillSlot {
  const startAt = shanghaiDateAt(dateKey, hour);
  return {
    id: `${dateKey}-${hour}`,
    coachId,
    startAt,
    endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
  };
}

describe("11am slot backfill", () => {
  it("counts missing 11:00 slots in dry-run planning without mutating input", () => {
    const existingSlots = [
      slot("2026-07-06", 12),
      slot("2026-07-06", 13),
      slot("2026-07-07", 11),
      slot("2026-07-07", 12),
      slot("2026-07-08", 20),
    ];

    const plan = buildElevenAmBackfillPlan({
      existingSlots,
      todayKey: "2026-07-06",
      latestSlotDateKey: "2026-07-08",
    });

    expect(plan.checkedDates).toBe(3);
    expect(plan.existing).toBe(1);
    expect(plan.missing.map((item) => item.dateKey)).toEqual(["2026-07-06", "2026-07-08"]);
    expect(existingSlots).toHaveLength(5);
  });

  it("skips dates that already have an 11:00 slot", () => {
    const plan = buildElevenAmBackfillPlan({
      existingSlots: [slot("2026-07-06", 11), slot("2026-07-06", 12)],
      todayKey: "2026-07-06",
      latestSlotDateKey: "2026-07-06",
    });

    expect(plan.existing).toBe(1);
    expect(plan.missing).toHaveLength(0);
  });

  it("does not plan a create when a date has no coach to infer from", () => {
    const plan = buildElevenAmBackfillPlan({
      existingSlots: [slot("2026-07-06", 12)],
      todayKey: "2026-07-06",
      latestSlotDateKey: "2026-07-07",
    });

    expect(plan.missing.map((item) => item.dateKey)).toEqual(["2026-07-06"]);
    expect(plan.skippedNoCoach).toEqual(["2026-07-07"]);
  });

  it("apply creates only missing OPEN slots and is idempotent", async () => {
    const store: ExistingBackfillSlot[] = [];
    const startAt = shanghaiDateAt("2026-07-06", 11);
    const missing = [
      {
        dateKey: "2026-07-06",
        startAt,
        endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
        coachId: "coach-1",
      },
    ];
    const db = {
      slot: {
        async findFirst({ where }: { where: { startAt: Date; endAt: Date; coachId: string } }) {
          return store.find((item) => (
            item.coachId === where.coachId &&
            item.startAt.getTime() === where.startAt.getTime() &&
            item.endAt.getTime() === where.endAt.getTime()
          ))
            ? { id: "created" }
            : null;
        },
        async create({ data }: { data: { startAt: Date; endAt: Date; coachId: string; status: SlotStatus } }) {
          expect(data.status).toBe(SlotStatus.OPEN);
          store.push({
            id: "created",
            coachId: data.coachId,
            startAt: data.startAt,
            endAt: data.endAt,
          });
          return { id: "created" };
        },
      },
    };

    await expect(applyMissingElevenAmSlots(db, missing)).resolves.toEqual({
      created: 1,
      skippedExisting: 0,
    });
    await expect(applyMissingElevenAmSlots(db, missing)).resolves.toEqual({
      created: 0,
      skippedExisting: 1,
    });
    expect(store).toHaveLength(1);
  });
});
