import { CourseType } from "@prisma/client";

export const BOOKING_END_DATE = "2026-08-31";
export const SCHEDULE_HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;

const SHANGHAI_TIME_ZONE = "Asia/Shanghai";

export type ScheduleSlotSummary = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  courseType: CourseType | null;
  activeCount: number;
  capacity: number | null;
  blockedLabel?: string | null;
};

export type ScheduleCell = {
  key: string;
  slotId: string | null;
  title: string;
  subtitle: string;
  tone: "green" | "red" | "gray";
  href: string | null;
};

export type WeeklySchedule = {
  weekStartKey: string;
  weekEndKey: string;
  weekRangeText: string;
  previousWeekHref: string | null;
  nextWeekHref: string | null;
  days: Array<{
    key: string;
    weekday: string;
    dateText: string;
  }>;
  rows: Array<{
    timeLabel: string;
    cells: ScheduleCell[];
  }>;
};

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function getShanghaiParts(date: Date): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI_TIME_ZONE,
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

function makeShanghaiDate(parts: DateParts, hour = 0) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour - 8, 0, 0));
}

function parseDateKey(dateKey: string): DateParts | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

export function getDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getShanghaiWeekday(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: SHANGHAI_TIME_ZONE,
    weekday: "short",
  }).format(date);

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

function getMonday(date: Date) {
  const weekday = getShanghaiWeekday(date);
  const diff = weekday === 0 ? -6 : 1 - weekday;
  return makeShanghaiDate(getShanghaiParts(addDays(date, diff)));
}

function formatMonthDay(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: SHANGHAI_TIME_ZONE,
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function getCourseText(courseType: CourseType | null) {
  if (courseType === CourseType.ONE_TO_ONE) return "1v1";
  if (courseType === CourseType.ONE_TO_TWO) return "1v2";
  if (courseType === CourseType.ONE_TO_THREE) return "1v3";
  return "";
}

export function getScheduleWeek(week?: string, now = new Date(), basePath = "/parent") {
  const currentWeekStart = getMonday(now);
  const maxWeekStart = getMonday(makeShanghaiDate(parseDateKey(BOOKING_END_DATE) ?? getShanghaiParts(now)));
  const requestedParts = week ? parseDateKey(week) : null;
  const requestedStart = requestedParts ? getMonday(makeShanghaiDate(requestedParts)) : currentWeekStart;

  let weekStart = requestedStart;
  if (weekStart.getTime() < currentWeekStart.getTime()) weekStart = currentWeekStart;
  if (weekStart.getTime() > maxWeekStart.getTime()) weekStart = maxWeekStart;

  const weekEnd = addDays(weekStart, 6);
  const queryEnd = addDays(weekStart, 7);
  const previousStart = addDays(weekStart, -7);
  const nextStart = addDays(weekStart, 7);

  return {
    weekStart,
    weekEnd,
    queryEnd,
    previousWeekHref:
      previousStart.getTime() >= currentWeekStart.getTime()
        ? `${basePath}?week=${getDateKey(previousStart)}`
        : null,
    nextWeekHref:
      nextStart.getTime() <= maxWeekStart.getTime()
        ? `${basePath}?week=${getDateKey(nextStart)}`
        : null,
  };
}

function cellForSlot(slot: ScheduleSlotSummary): Omit<ScheduleCell, "key"> {
  if (slot.blockedLabel) {
    return {
      slotId: slot.id,
      title: "已占用",
      subtitle: "不可预约",
      tone: "gray",
      href: null,
    };
  }

  if (slot.status === "CLOSED" || slot.status === "CANCELLED") {
    return {
      slotId: slot.id,
      title: "大班课",
      subtitle: "不可预约",
      tone: "gray",
      href: null,
    };
  }

  if (slot.status === "EXPIRED") {
    return {
      slotId: slot.id,
      title: "已过期",
      subtitle: "",
      tone: "gray",
      href: null,
    };
  }

  const courseText = getCourseText(slot.courseType);
  const capacity = slot.capacity ?? 0;
  const countText = slot.courseType ? `${courseText} ${slot.activeCount}/${capacity}` : "任选课型";

  if (slot.status === "FULL") {
    return {
      slotId: slot.id,
      title: "已约满",
      subtitle: countText,
      tone: "red",
      href: `/parent/slots/${slot.id}`,
    };
  }

  if (slot.status === "LOCKED_NOT_FULL") {
    return {
      slotId: slot.id,
      title: "可加入",
      subtitle: countText,
      tone: "green",
      href: `/parent/slots/${slot.id}`,
    };
  }

  if (slot.status === "AVAILABLE") {
    return {
      slotId: slot.id,
      title: "可预约",
      subtitle: "任选课型",
      tone: "green",
      href: `/parent/slots/${slot.id}`,
    };
  }

  return {
    slotId: slot.id,
    title: "未开放",
    subtitle: "",
    tone: "gray",
    href: null,
  };
}

export function buildWeeklySchedule({
  slots,
  weekStart,
  weekEnd,
  previousWeekHref,
  nextWeekHref,
}: {
  slots: ScheduleSlotSummary[];
  weekStart: Date;
  weekEnd: Date;
  previousWeekHref: string | null;
  nextWeekHref: string | null;
}): WeeklySchedule {
  const slotMap = new Map<string, ScheduleSlotSummary>();

  for (const slot of slots) {
    const startAt = new Date(slot.startAt);
    const hour = new Intl.DateTimeFormat("en-US", {
      timeZone: SHANGHAI_TIME_ZONE,
      hour: "2-digit",
      hour12: false,
    }).format(startAt);
    slotMap.set(`${getDateKey(startAt)}-${hour}`, slot);
  }

  const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      key: getDateKey(date),
      weekday: weekdays[index],
      dateText: formatMonthDay(date),
    };
  });

  const rows = SCHEDULE_HOURS.map((hour) => ({
    timeLabel: `${String(hour).padStart(2, "0")}:00`,
    cells: days.map((day) => {
      const slot = slotMap.get(`${day.key}-${String(hour).padStart(2, "0")}`);
      if (!slot) {
        return {
          key: `${day.key}-${hour}`,
          slotId: null,
          title: "未开放",
          subtitle: "",
          tone: "gray" as const,
          href: null,
        };
      }

      return {
        key: `${day.key}-${hour}`,
        ...cellForSlot(slot),
      };
    }),
  }));

  return {
    weekStartKey: getDateKey(weekStart),
    weekEndKey: getDateKey(weekEnd),
    weekRangeText: `${formatMonthDay(weekStart)} - ${formatMonthDay(weekEnd)}`,
    previousWeekHref,
    nextWeekHref,
    days,
    rows,
  };
}
