import { describe, expect, it } from "vitest";
import {
  getNextParentScheduleReleaseDate,
  getShanghaiDayEnd,
  isSlotReleasedForParent,
} from "@/services/schedule-release.service";

describe("schedule release rules", () => {
  const now = new Date("2026-07-02T10:00:00+08:00");

  it("treats no setting as not released for parent booking", () => {
    expect(isSlotReleasedForParent(new Date("2026-07-02T12:00:00+08:00"), null)).toBe(false);
  });

  it("opens the first window through next Sunday", () => {
    expect(
      getNextParentScheduleReleaseDate({
        currentReleasedUntil: null,
        latestSlotDate: "2026-08-31",
        now,
      }),
    ).toBe("2026-07-12");
  });

  it("extends a future Sunday release date by two full weeks", () => {
    expect(
      getNextParentScheduleReleaseDate({
        currentReleasedUntil: "2026-07-12",
        latestSlotDate: "2026-08-31",
        now,
      }),
    ).toBe("2026-07-26");
  });

  it("starts from the current week when the existing release date has expired", () => {
    expect(
      getNextParentScheduleReleaseDate({
        currentReleasedUntil: "2026-06-20",
        latestSlotDate: "2026-08-31",
        now,
      }),
    ).toBe("2026-07-12");
  });

  it("aligns a non-Sunday release date to its week Sunday before extending two full weeks", () => {
    expect(
      getNextParentScheduleReleaseDate({
        currentReleasedUntil: "2026-07-14",
        latestSlotDate: "2026-08-31",
        now,
      }),
    ).toBe("2026-08-02");
  });

  it("does not exceed the latest generated slot date", () => {
    expect(
      getNextParentScheduleReleaseDate({
        currentReleasedUntil: "2026-08-25",
        latestSlotDate: "2026-08-31",
        now,
      }),
    ).toBe("2026-08-31");
  });

  it("allows parent access through the end of the released Shanghai date", () => {
    const end = getShanghaiDayEnd("2026-07-14");

    expect(isSlotReleasedForParent(end, "2026-07-14")).toBe(true);
    expect(isSlotReleasedForParent(new Date(end.getTime() + 1), "2026-07-14")).toBe(false);
  });
});
