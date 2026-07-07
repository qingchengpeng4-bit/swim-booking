import { PrismaClient, SlotStatus } from "@prisma/client";
import { pathToFileURL } from "node:url";

const BACKFILL_HOUR = 11;
const SHANGHAI_TIME_ZONE = "Asia/Shanghai";

export type ExistingBackfillSlot = {
  id?: string;
  startAt: Date;
  endAt: Date;
  coachId: string;
};

export type MissingElevenAmSlot = {
  dateKey: string;
  startAt: Date;
  endAt: Date;
  coachId: string;
};

export type ElevenAmBackfillPlan = {
  todayKey: string;
  latestSlotDateKey: string;
  checkedDates: number;
  existing: number;
  missing: MissingElevenAmSlot[];
  skippedNoCoach: string[];
};

type BackfillDb = {
  slot: {
    findFirst(args: {
      where: {
        startAt: Date;
        endAt: Date;
        coachId: string;
      };
      select: { id: true };
    }): Promise<{ id: string } | null>;
    create(args: {
      data: {
        startAt: Date;
        endAt: Date;
        coachId: string;
        status: SlotStatus;
      };
      select: { id: true };
    }): Promise<{ id: string }>;
  };
};

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

export function getShanghaiDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function shanghaiDateAt(dateKey: string, hour: number) {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day, hour - 8, 0, 0));
}

function addDaysToDateKey(dateKey: string, days: number) {
  const date = shanghaiDateAt(dateKey, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return getShanghaiDateKey(date);
}

function compareDateKeys(a: string, b: string) {
  return a.localeCompare(b);
}

function getShanghaiHour(date: Date) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: SHANGHAI_TIME_ZONE,
      hour: "2-digit",
      hour12: false,
    }).format(date),
  );
}

export function buildElevenAmBackfillPlan({
  existingSlots,
  todayKey,
  latestSlotDateKey,
}: {
  existingSlots: ExistingBackfillSlot[];
  todayKey: string;
  latestSlotDateKey: string;
}): ElevenAmBackfillPlan {
  const slotsByDate = new Map<string, ExistingBackfillSlot[]>();

  for (const slot of existingSlots) {
    const dateKey = getShanghaiDateKey(slot.startAt);
    const slots = slotsByDate.get(dateKey) ?? [];
    slots.push(slot);
    slotsByDate.set(dateKey, slots);
  }

  const plan: ElevenAmBackfillPlan = {
    todayKey,
    latestSlotDateKey,
    checkedDates: 0,
    existing: 0,
    missing: [],
    skippedNoCoach: [],
  };

  for (
    let dateKey = todayKey;
    compareDateKeys(dateKey, latestSlotDateKey) <= 0;
    dateKey = addDaysToDateKey(dateKey, 1)
  ) {
    plan.checkedDates += 1;
    const daySlots = slotsByDate.get(dateKey) ?? [];
    const hasElevenAmSlot = daySlots.some((slot) => getShanghaiHour(slot.startAt) === BACKFILL_HOUR);

    if (hasElevenAmSlot) {
      plan.existing += 1;
      continue;
    }

    const coachId = daySlots[0]?.coachId;
    if (!coachId) {
      plan.skippedNoCoach.push(dateKey);
      continue;
    }

    const startAt = shanghaiDateAt(dateKey, BACKFILL_HOUR);
    plan.missing.push({
      dateKey,
      startAt,
      endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
      coachId,
    });
  }

  return plan;
}

export async function applyMissingElevenAmSlots(db: BackfillDb, missingSlots: MissingElevenAmSlot[]) {
  let created = 0;
  let skippedExisting = 0;

  for (const slot of missingSlots) {
    const existing = await db.slot.findFirst({
      where: {
        startAt: slot.startAt,
        endAt: slot.endAt,
        coachId: slot.coachId,
      },
      select: { id: true },
    });

    if (existing) {
      skippedExisting += 1;
      continue;
    }

    await db.slot.create({
      data: {
        startAt: slot.startAt,
        endAt: slot.endAt,
        coachId: slot.coachId,
        status: SlotStatus.OPEN,
      },
      select: { id: true },
    });
    created += 1;
  }

  return { created, skippedExisting };
}

function parseMode(args: string[]) {
  if (args.includes("--apply")) return "apply";
  return "dry-run";
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  const prisma = new PrismaClient();

  try {
    const latestSlot = await prisma.slot.findFirst({
      orderBy: { startAt: "desc" },
      select: { startAt: true },
    });

    if (!latestSlot) {
      console.log("No slots found. Backfill stopped safely.");
      return;
    }

    const todayKey = getShanghaiDateKey(new Date());
    const latestSlotDateKey = getShanghaiDateKey(latestSlot.startAt);

    if (compareDateKeys(latestSlotDateKey, todayKey) < 0) {
      console.log({
        mode,
        todayKey,
        latestSlotDateKey,
        checkedDates: 0,
        existing: 0,
        missing: 0,
        skippedNoCoach: 0,
        created: 0,
      });
      return;
    }

    const rangeStart = shanghaiDateAt(todayKey, 0);
    const rangeEnd = shanghaiDateAt(addDaysToDateKey(latestSlotDateKey, 1), 0);
    const existingSlots = await prisma.slot.findMany({
      where: {
        startAt: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        coachId: true,
      },
      orderBy: { startAt: "asc" },
    });

    const plan = buildElevenAmBackfillPlan({
      existingSlots,
      todayKey,
      latestSlotDateKey,
    });

    if (mode === "dry-run") {
      console.log({
        mode,
        todayKey: plan.todayKey,
        latestSlotDateKey: plan.latestSlotDateKey,
        checkedDates: plan.checkedDates,
        existing: plan.existing,
        missing: plan.missing.length,
        skippedNoCoach: plan.skippedNoCoach.length,
        wouldCreate: plan.missing.length,
      });
      return;
    }

    const result = await applyMissingElevenAmSlots(prisma, plan.missing);
    console.log({
      mode,
      todayKey: plan.todayKey,
      latestSlotDateKey: plan.latestSlotDateKey,
      checkedDates: plan.checkedDates,
      existing: plan.existing,
      missing: plan.missing.length,
      skippedNoCoach: plan.skippedNoCoach.length,
      created: result.created,
      skippedExistingDuringApply: result.skippedExisting,
    });
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error({
      ok: false,
      name: error?.name,
      code: error?.code ?? error?.errorCode ?? null,
      message: String(error?.message ?? "").split("\n")[0],
    });
    process.exit(1);
  });
}
