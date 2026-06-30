import { BookingStatus, CourseType } from "@prisma/client";
import { getDateKey, SCHEDULE_HOURS } from "@/lib/schedule";

const SHANGHAI_TIME_ZONE = "Asia/Shanghai";

export type CoachScheduleBooking = {
  studentName: string;
  status: BookingStatus | string;
};

export type CoachScheduleSlotSummary = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  courseType: CourseType | null;
  activeCount: number;
  capacity: number | null;
  bookings: CoachScheduleBooking[];
};

export type CoachScheduleCell = {
  key: string;
  slotId: string | null;
  title: string;
  subtitle: string;
  tone: "green" | "red" | "gray";
  href: string | null;
};

export type CoachWeeklySchedule = {
  weekRangeText: string;
  days: Array<{
    key: string;
    weekday: string;
    dateText: string;
  }>;
  rows: Array<{
    timeLabel: string;
    cells: CoachScheduleCell[];
  }>;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getCourseText(courseType: CourseType | null) {
  if (courseType === CourseType.ONE_TO_ONE) return "1v1";
  if (courseType === CourseType.ONE_TO_TWO) return "1v2";
  if (courseType === CourseType.ONE_TO_THREE) return "1v3";
  return "";
}

function getShanghaiHour(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: SHANGHAI_TIME_ZONE,
    hour: "2-digit",
    hour12: false,
  }).format(date);
}

function formatMonthDay(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: SHANGHAI_TIME_ZONE,
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function getStudentNames(slot: CoachScheduleSlotSummary) {
  return slot.bookings
    .filter((booking) => booking.status === BookingStatus.ACTIVE || booking.status === "ACTIVE")
    .map((booking) => booking.studentName)
    .filter(Boolean);
}

function isSlotExpired(slot: CoachScheduleSlotSummary, now: Date) {
  return slot.status === "EXPIRED" || new Date(slot.endAt).getTime() <= now.getTime();
}

function cellForSlot(slot: CoachScheduleSlotSummary, now: Date): Omit<CoachScheduleCell, "key"> {
  if (slot.status === "CLOSED" || slot.status === "CANCELLED") {
    return {
      slotId: slot.id,
      title: "大班课",
      subtitle: "不可预约",
      tone: "gray",
      href: null,
    };
  }

  const activeNames = getStudentNames(slot);
  const hasActiveBookings = activeNames.length > 0 || slot.activeCount > 0;
  const expired = isSlotExpired(slot, now);

  if (!hasActiveBookings && expired) {
    return {
      slotId: slot.id,
      title: "已过期",
      subtitle: "",
      tone: "gray",
      href: null,
    };
  }

  if (!slot.courseType || !hasActiveBookings) {
    return {
      slotId: slot.id,
      title: "空闲",
      subtitle: "可预约",
      tone: "green",
      href: `/coach/slots/${slot.id}`,
    };
  }

  const courseText = getCourseText(slot.courseType);

  if (slot.courseType === CourseType.ONE_TO_ONE) {
    return {
      slotId: slot.id,
      title: courseText,
      subtitle: `${activeNames[0] ?? "已预约"}${expired ? " · 已过期" : ""}`,
      tone: expired ? "gray" : "red",
      href: `/coach/slots/${slot.id}`,
    };
  }

  const capacity = slot.capacity ?? slot.activeCount;
  const countText = `${courseText} ${slot.activeCount}/${capacity}`;
  const full = slot.activeCount >= capacity;
  const namesText = activeNames.join(" / ");

  return {
    slotId: slot.id,
    title: countText,
    subtitle:
      full && slot.courseType === CourseType.ONE_TO_THREE
        ? `已满${expired ? " · 已过期" : ""}`
        : `${namesText}${expired ? " · 已过期" : ""}`,
    tone: expired ? "gray" : full ? "red" : "green",
    href: `/coach/slots/${slot.id}`,
  };
}

export function buildCoachWeeklySchedule({
  slots,
  weekStart,
  weekEnd,
  now = new Date(),
}: {
  slots: CoachScheduleSlotSummary[];
  weekStart: Date;
  weekEnd: Date;
  now?: Date;
}): CoachWeeklySchedule {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const slotMap = new Map<string, CoachScheduleSlotSummary>();

  for (const slot of slots) {
    const startAt = new Date(slot.startAt);
    slotMap.set(`${getDateKey(startAt)}-${getShanghaiHour(startAt)}`, slot);
  }

  const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

  return {
    weekRangeText: `${formatMonthDay(weekStart)} - ${formatMonthDay(weekEnd)}`,
    days: days.map((day, index) => ({
      key: getDateKey(day),
      weekday: weekdays[index],
      dateText: formatMonthDay(day),
    })),
    rows: SCHEDULE_HOURS.map((hour) => ({
      timeLabel: `${String(hour).padStart(2, "0")}:00`,
      cells: days.map((day) => {
        const key = `${getDateKey(day)}-${hour}`;
        const slot = slotMap.get(`${getDateKey(day)}-${String(hour).padStart(2, "0")}`);

        if (!slot) {
          return {
            key,
            slotId: null,
            title: "未开放",
            subtitle: "",
            tone: "gray" as const,
            href: null,
          };
        }

        return {
          key,
          ...cellForSlot(slot, now),
        };
      }),
    })),
  };
}
