import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const PARENT_SCHEDULE_RELEASED_UNTIL_KEY = "parent_schedule_released_until";
const RELEASE_WEEKS_IN_DAYS = 14;
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

function getShanghaiWeekday(dateKey: string) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: SHANGHAI_TIME_ZONE,
    weekday: "short",
  }).format(shanghaiDateAt(dateKey, 12));

  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return weekdays[weekday] ?? 0;
}

export function getShanghaiWeekSunday(dateKey: string) {
  const weekday = getShanghaiWeekday(dateKey);
  const daysUntilSunday = weekday === 0 ? 0 : 7 - weekday;
  return addShanghaiDays(dateKey, daysUntilSunday);
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
  const hasCurrentFutureRelease = currentReleasedUntil && compareDateKeys(currentReleasedUntil, today) >= 0;
  const baseDate = hasCurrentFutureRelease ? getShanghaiWeekSunday(currentReleasedUntil) : getShanghaiWeekSunday(today);
  const nextDate = addShanghaiDays(baseDate, hasCurrentFutureRelease ? RELEASE_WEEKS_IN_DAYS : 7);

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
    nextReleaseUntil: getNextParentScheduleReleaseDate({
      currentReleasedUntil: nextReleasedUntil,
      latestSlotDate,
      now,
    }),
    previousReleasedUntil: currentReleasedUntil,
    latestSlotDate,
  };
}
