const DEFAULT_APP_TIMEZONE = "Asia/Shanghai";

type SlotTimeInput = {
  startAt: Date;
  endAt: Date;
};

type DateParts = {
  year: number;
  month: number;
  day: number;
};

export function getAppTimezone() {
  return process.env.APP_TIMEZONE || DEFAULT_APP_TIMEZONE;
}

function getDateParts(date: Date, timeZone = getAppTimezone()): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
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

export function isSlotStarted(slot: Pick<SlotTimeInput, "startAt">, now = new Date()) {
  return slot.startAt.getTime() <= now.getTime();
}

export function isSlotToday(slot: Pick<SlotTimeInput, "startAt">, now = new Date(), timeZone = getAppTimezone()) {
  const slotDate = getDateParts(slot.startAt, timeZone);
  const nowDate = getDateParts(now, timeZone);

  return slotDate.year === nowDate.year && slotDate.month === nowDate.month && slotDate.day === nowDate.day;
}

export function canParentBookByTime(slot: Pick<SlotTimeInput, "startAt">, now = new Date()) {
  return !isSlotStarted(slot, now);
}

export function canParentCancelByTime(slot: Pick<SlotTimeInput, "startAt">, now = new Date()) {
  return !isSlotStarted(slot, now) && !isSlotToday(slot, now);
}

export function canCoachCancelByTime(_slot: Pick<SlotTimeInput, "startAt" | "endAt">, _now = new Date()) {
  return true;
}

export function canCoachAddBookingByTime(slot: Pick<SlotTimeInput, "startAt">, now = new Date()) {
  return !isSlotStarted(slot, now);
}
