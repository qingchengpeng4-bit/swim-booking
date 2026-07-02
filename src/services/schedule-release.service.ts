import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const PARENT_SCHEDULE_RELEASED_UNTIL_KEY = "parent_schedule_released_until";
const RELEASE_DAYS = 14;
const SHANGHAI_TIME_ZONE = "Asia/Shanghai";

type DbClient = typeof prisma | Prisma.TransactionClient;

function getShanghaiDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function shanghaiDateAt(dateKey: string, hour: number, minute = 0, second = 0, millisecond = 0) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 8, minute, second, millisecond));
}

function addShanghaiDays(dateKey: string, days: number) {
  const date = shanghaiDateAt(dateKey, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return getShanghaiDateKey(date);
}

function compareDateKeys(left: string, right: string) {
  return left.localeCompare(right);
}

export function getShanghaiDayEnd(dateKey: string) {
  return shanghaiDateAt(dateKey, 23, 59, 59, 999);
}

export function isSlotReleasedForParent(slotStartAt: Date, releasedUntil: string | null) {
  if (!releasedUntil) return false;
  return slotStartAt.getTime() <= getShanghaiDayEnd(releasedUntil).getTime();
}

export async function getParentScheduleRelease(db: DbClient = prisma) {
  const setting = await db.systemSetting.findUnique({
    where: {
      key: PARENT_SCHEDULE_RELEASED_UNTIL_KEY,
    },
  });

  return setting?.value ?? null;
}

export async function getLatestGeneratedSlotDate(db: DbClient = prisma) {
  const latestSlot = await db.slot.findFirst({
    orderBy: {
      startAt: "desc",
    },
    select: {
      startAt: true,
    },
  });

  return latestSlot ? getShanghaiDateKey(latestSlot.startAt) : null;
}

export function getNextParentScheduleReleaseDate({
  currentReleasedUntil,
  latestSlotDate,
  now = new Date(),
}: {
  currentReleasedUntil: string | null;
  latestSlotDate: string | null;
  now?: Date;
}) {
  const today = getShanghaiDateKey(now);
  const baseDate = currentReleasedUntil && compareDateKeys(currentReleasedUntil, today) >= 0 ? currentReleasedUntil : today;
  const nextDate = addShanghaiDays(baseDate, RELEASE_DAYS);

  if (latestSlotDate && compareDateKeys(nextDate, latestSlotDate) > 0) {
    return latestSlotDate;
  }

  return nextDate;
}

export async function releaseNextParentScheduleWindow(now = new Date()) {
  const [currentReleasedUntil, latestSlotDate] = await Promise.all([
    getParentScheduleRelease(),
    getLatestGeneratedSlotDate(),
  ]);
  const nextReleasedUntil = getNextParentScheduleReleaseDate({
    currentReleasedUntil,
    latestSlotDate,
    now,
  });

  await prisma.systemSetting.upsert({
    where: {
      key: PARENT_SCHEDULE_RELEASED_UNTIL_KEY,
    },
    create: {
      key: PARENT_SCHEDULE_RELEASED_UNTIL_KEY,
      value: nextReleasedUntil,
    },
    update: {
      value: nextReleasedUntil,
    },
  });

  return {
    releasedUntil: nextReleasedUntil,
    previousReleasedUntil: currentReleasedUntil,
    latestSlotDate,
  };
}
