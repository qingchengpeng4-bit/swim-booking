import { describe, expect, it } from "vitest";
import {
  COACH_WEEKLY_SCHEDULE_TAG,
  getCoachWeeklyScheduleTag,
  getParentWeeklyScheduleTag,
  getScheduleRevalidationTargets,
  getScheduleWeekTagKey,
  PARENT_WEEKLY_SCHEDULE_TAG,
} from "@/lib/schedule-cache";

describe("schedule cache revalidation targets", () => {
  it("revalidates parent and coach schedule views", () => {
    expect(getScheduleRevalidationTargets()).toEqual({
      tags: [PARENT_WEEKLY_SCHEDULE_TAG, COACH_WEEKLY_SCHEDULE_TAG],
      paths: ["/parent", "/parent/calendar", "/coach/calendar"],
    });
  });

  it("builds stable weekly schedule tags from the Shanghai week date", () => {
    const shanghaiMonday = new Date("2026-07-05T16:00:00.000Z");

    expect(getScheduleWeekTagKey(shanghaiMonday)).toBe("2026-07-06");
    expect(getParentWeeklyScheduleTag(shanghaiMonday)).toBe("parent-weekly-schedule:2026-07-06");
    expect(getCoachWeeklyScheduleTag(shanghaiMonday)).toBe("coach-weekly-schedule:2026-07-06");
  });

  it("can target a specific week while keeping global schedule tags", () => {
    expect(getScheduleRevalidationTargets("slot-1", new Date("2026-07-05T16:00:00.000Z"))).toEqual({
      tags: [
        PARENT_WEEKLY_SCHEDULE_TAG,
        COACH_WEEKLY_SCHEDULE_TAG,
        "parent-weekly-schedule:2026-07-06",
        "coach-weekly-schedule:2026-07-06",
      ],
      paths: ["/parent", "/parent/calendar", "/coach/calendar", "/parent/slots/slot-1", "/coach/slots/slot-1"],
    });
  });

  it("revalidates related slot detail pages when slot id is available", () => {
    expect(getScheduleRevalidationTargets("slot-1")).toEqual({
      tags: [PARENT_WEEKLY_SCHEDULE_TAG, COACH_WEEKLY_SCHEDULE_TAG],
      paths: ["/parent", "/parent/calendar", "/coach/calendar", "/parent/slots/slot-1", "/coach/slots/slot-1"],
    });
  });
});
