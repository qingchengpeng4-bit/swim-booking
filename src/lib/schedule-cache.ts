import { revalidatePath, revalidateTag } from "next/cache";

export const PARENT_WEEKLY_SCHEDULE_TAG = "parent-weekly-schedule";
export const COACH_WEEKLY_SCHEDULE_TAG = "coach-weekly-schedule";

export function getScheduleRevalidationTargets(slotId?: string | null) {
  const paths = ["/parent", "/parent/calendar", "/coach/calendar"];

  if (slotId) {
    paths.push(`/parent/slots/${slotId}`, `/coach/slots/${slotId}`);
  }

  return {
    tags: [PARENT_WEEKLY_SCHEDULE_TAG, COACH_WEEKLY_SCHEDULE_TAG],
    paths,
  };
}

export function revalidateScheduleViews(slotId?: string | null) {
  const targets = getScheduleRevalidationTargets(slotId);

  for (const tag of targets.tags) {
    revalidateTag(tag);
  }

  for (const path of targets.paths) {
    revalidatePath(path);
  }
}
