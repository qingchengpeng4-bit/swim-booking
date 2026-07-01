import { revalidatePath, revalidateTag } from "next/cache";

export const PARENT_WEEKLY_SCHEDULE_TAG = "parent-weekly-schedule";
export const COACH_WEEKLY_SCHEDULE_TAG = "coach-weekly-schedule";
export const PARENT_WEEKLY_SCHEDULE_REVALIDATE_SECONDS = 120;
export const COACH_WEEKLY_SCHEDULE_REVALIDATE_SECONDS = 120;

function getShanghaiDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getScheduleWeekTagKey(weekStart: Date | string) {
  return getShanghaiDateKey(typeof weekStart === "string" ? new Date(weekStart) : weekStart);
}

export function getParentWeeklyScheduleTag(weekStart: Date | string) {
  return `${PARENT_WEEKLY_SCHEDULE_TAG}:${getScheduleWeekTagKey(weekStart)}`;
}

export function getCoachWeeklyScheduleTag(weekStart: Date | string) {
  return `${COACH_WEEKLY_SCHEDULE_TAG}:${getScheduleWeekTagKey(weekStart)}`;
}

export function getScheduleRevalidationTargets(slotId?: string | null, weekStart?: Date | string | null) {
  const paths = ["/parent", "/parent/calendar", "/coach/calendar"];
  const tags = [PARENT_WEEKLY_SCHEDULE_TAG, COACH_WEEKLY_SCHEDULE_TAG];

  if (slotId) {
    paths.push(`/parent/slots/${slotId}`, `/coach/slots/${slotId}`);
  }

  if (weekStart) {
    tags.push(getParentWeeklyScheduleTag(weekStart), getCoachWeeklyScheduleTag(weekStart));
  }

  return {
    tags,
    paths,
  };
}

export function revalidateScheduleViews(slotId?: string | null, weekStart?: Date | string | null) {
  const targets = getScheduleRevalidationTargets(slotId, weekStart);

  for (const tag of targets.tags) {
    revalidateTag(tag);
  }

  for (const path of targets.paths) {
    revalidatePath(path);
  }
}
