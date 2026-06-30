import { SlotStatus } from "@prisma/client";

export const SLOT_SEED_END_DATE = "2026-08-31";
export const SLOT_SEED_HOURS = [12, 13, 14, 15, 16, 17, 18, 19] as const;

export type SlotSeedItem = {
  startAt: Date;
  endAt: Date;
  status: SlotStatus;
  label: "OPEN" | "GROUP_CLASS";
};

type ShanghaiDateParts = {
  year: number;
  month: number;
  day: number;
};

function getShanghaiDateParts(date: Date): ShanghaiDateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function shanghaiDateAt({ year, month, day }: ShanghaiDateParts, hour: number) {
  return new Date(Date.UTC(year, month - 1, day, hour - 8, 0, 0));
}

function addDays(parts: ShanghaiDateParts, dayOffset: number) {
  const date = shanghaiDateAt(parts, 0);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return getShanghaiDateParts(date);
}

function compareDateParts(a: ShanghaiDateParts, b: ShanghaiDateParts) {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

function parseDateOnly(dateOnly: string): ShanghaiDateParts {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return { year, month, day };
}

function getShanghaiWeekday(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    weekday: "short",
  })
    .formatToParts(date)
    .find((part) => part.type === "weekday")?.value;

  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return weekday ? weekdays[weekday] : -1;
}

export function isFixedGroupClass(startAt: Date) {
  const weekday = getShanghaiWeekday(startAt);
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Shanghai",
      hour: "2-digit",
      hour12: false,
    }).format(startAt),
  );

  return (
    (weekday === 2 && hour === 19) ||
    (weekday === 6 && hour === 19) ||
    (weekday === 0 && hour === 12)
  );
}

export function buildSlotSeedPlan(now = new Date(), endDate = SLOT_SEED_END_DATE) {
  const today = getShanghaiDateParts(now);
  const end = parseDateOnly(endDate);
  const items: SlotSeedItem[] = [];

  for (let offset = 0; ; offset += 1) {
    const day = addDays(today, offset);
    if (compareDateParts(day, end) > 0) break;

    for (const hour of SLOT_SEED_HOURS) {
      const startAt = shanghaiDateAt(day, hour);
      const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
      const groupClass = isFixedGroupClass(startAt);
      items.push({
        startAt,
        endAt,
        status: groupClass ? SlotStatus.CLOSED : SlotStatus.OPEN,
        label: groupClass ? "GROUP_CLASS" : "OPEN",
      });
    }
  }

  return items;
}
