import { describe, expect, it } from "vitest";
import {
  COACH_WEEKLY_SCHEDULE_TAG,
  getScheduleRevalidationTargets,
  PARENT_WEEKLY_SCHEDULE_TAG,
} from "@/lib/schedule-cache";

describe("schedule cache revalidation targets", () => {
  it("revalidates parent and coach schedule views", () => {
    expect(getScheduleRevalidationTargets()).toEqual({
      tags: [PARENT_WEEKLY_SCHEDULE_TAG, COACH_WEEKLY_SCHEDULE_TAG],
      paths: ["/parent", "/parent/calendar", "/coach/calendar"],
    });
  });

  it("revalidates related slot detail pages when slot id is available", () => {
    expect(getScheduleRevalidationTargets("slot-1")).toEqual({
      tags: [PARENT_WEEKLY_SCHEDULE_TAG, COACH_WEEKLY_SCHEDULE_TAG],
      paths: ["/parent", "/parent/calendar", "/coach/calendar", "/parent/slots/slot-1", "/coach/slots/slot-1"],
    });
  });
});
