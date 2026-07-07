import { BookingStatus, type Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { SCHEDULE_HOURS } from "@/lib/schedule";
import { prisma } from "@/lib/db";
import { BusinessError } from "@/services/errors";

export const COACH_WEEKLY_BLOCKED_SLOTS_KEY = "coach_weekly_blocked_slots";

export type WeeklyBlockedSlotRule = {
  id: string;
  weekday: number;
  hour: number;
  label: string;
  createdAt: string;
};

export type WeeklyBlockedSlotInput = {
  weekday: number;
  hour: number;
  label: string;
};

export const SYSTEM_WEEKLY_BLOCKED_SLOTS: Array<Omit<WeeklyBlockedSlotRule, "id" | "createdAt">> = [
  { weekday: 2, hour: 19, label: "大班课" },
  { weekday: 6, hour: 19, label: "大班课" },
  { weekday: 7, hour: 12, label: "大班课" },
];

const SHANGHAI_TIME_ZONE = "Asia/Shanghai";

type DbClient = typeof prisma | Prisma.TransactionClient;

function getShanghaiWeekday(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: SHANGHAI_TIME_ZONE,
    weekday: "short",
  }).format(date);

  const weekdays: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };

  return weekdays[weekday] ?? -1;
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

function parseRules(value: string | null | undefined): WeeklyBlockedSlotRule[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((rule): rule is WeeklyBlockedSlotRule => (
      rule &&
      typeof rule.id === "string" &&
      Number.isInteger(rule.weekday) &&
      Number.isInteger(rule.hour) &&
      typeof rule.label === "string" &&
      typeof rule.createdAt === "string"
    ));
  } catch {
    return [];
  }
}

function serializeRules(rules: WeeklyBlockedSlotRule[]) {
  return JSON.stringify(rules);
}

export function getWeekdayText(weekday: number) {
  return ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"][weekday] ?? "未知";
}

export function getHourRangeText(hour: number) {
  return `${String(hour).padStart(2, "0")}:00-${String(hour + 1).padStart(2, "0")}:00`;
}

export function validateWeeklyBlockedSlotInput(input: WeeklyBlockedSlotInput) {
  const weekday = Number(input.weekday);
  const hour = Number(input.hour);
  const label = String(input.label ?? "").trim();

  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
    throw new BusinessError("请选择星期。");
  }

  if (!SCHEDULE_HOURS.includes(hour as (typeof SCHEDULE_HOURS)[number])) {
    throw new BusinessError("请选择有效时间段。");
  }

  if (!label) {
    throw new BusinessError("请填写名称。");
  }

  if (label.length > 20) {
    throw new BusinessError("名称不能超过 20 个字符。");
  }

  return { weekday, hour, label };
}

export async function getCoachWeeklyBlockedRules(db: DbClient = prisma) {
  const setting = await db.systemSetting.findUnique({
    where: { key: COACH_WEEKLY_BLOCKED_SLOTS_KEY },
  });

  return parseRules(setting?.value);
}

export function findWeeklyBlockedRuleForSlot(
  rules: Array<Pick<WeeklyBlockedSlotRule, "weekday" | "hour" | "label">>,
  startAt: Date,
) {
  const weekday = getShanghaiWeekday(startAt);
  const hour = getShanghaiHour(startAt);
  return rules.find((rule) => rule.weekday === weekday && rule.hour === hour) ?? null;
}

async function hasFutureActiveBookingsForRule(input: Pick<WeeklyBlockedSlotRule, "weekday" | "hour">, now: Date) {
  const slots = await prisma.slot.findMany({
    where: {
      startAt: {
        gt: now,
      },
    },
    select: {
      startAt: true,
      bookings: {
        where: {
          status: BookingStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return slots.some((slot) => (
    slot.bookings.length > 0 &&
    getShanghaiWeekday(slot.startAt) === input.weekday &&
    getShanghaiHour(slot.startAt) === input.hour
  ));
}

export async function addCoachWeeklyBlockedRule(input: WeeklyBlockedSlotInput, now = new Date()) {
  const normalized = validateWeeklyBlockedSlotInput(input);
  const rules = await getCoachWeeklyBlockedRules();

  if (rules.some((rule) => rule.weekday === normalized.weekday && rule.hour === normalized.hour)) {
    throw new BusinessError("该固定不可预约时间已存在。");
  }

  if (await hasFutureActiveBookingsForRule(normalized, now)) {
    throw new BusinessError("该固定时间已有未来预约，请先处理相关预约后再设置为不可预约。");
  }

  const nextRule: WeeklyBlockedSlotRule = {
    id: randomUUID(),
    ...normalized,
    createdAt: now.toISOString(),
  };
  const nextRules = [...rules, nextRule];

  await prisma.systemSetting.upsert({
    where: { key: COACH_WEEKLY_BLOCKED_SLOTS_KEY },
    create: {
      key: COACH_WEEKLY_BLOCKED_SLOTS_KEY,
      value: serializeRules(nextRules),
    },
    update: {
      value: serializeRules(nextRules),
    },
  });

  return nextRule;
}

export async function deleteCoachWeeklyBlockedRule(ruleId: string) {
  const rules = await getCoachWeeklyBlockedRules();
  const nextRules = rules.filter((rule) => rule.id !== ruleId);

  await prisma.systemSetting.upsert({
    where: { key: COACH_WEEKLY_BLOCKED_SLOTS_KEY },
    create: {
      key: COACH_WEEKLY_BLOCKED_SLOTS_KEY,
      value: serializeRules(nextRules),
    },
    update: {
      value: serializeRules(nextRules),
    },
  });

  return {
    deleted: nextRules.length !== rules.length,
    rules: nextRules,
  };
}
