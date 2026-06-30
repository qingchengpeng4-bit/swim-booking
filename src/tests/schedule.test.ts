import { CourseType } from "@prisma/client";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildWeeklySchedule, getScheduleWeek } from "@/lib/schedule";

function shanghaiDateAt(dateOnly: string, hour: number) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 8, 0, 0));
}

describe("weekly schedule", () => {
  it("builds nine rows and seven day columns for a week", () => {
    const week = getScheduleWeek("2026-07-06", shanghaiDateAt("2026-06-30", 9));
    const schedule = buildWeeklySchedule({
      slots: [],
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      previousWeekHref: week.previousWeekHref,
      nextWeekHref: week.nextWeekHref,
    });

    expect(schedule.days).toHaveLength(7);
    expect(schedule.rows).toHaveLength(9);
    expect(schedule.rows[0].timeLabel).toBe("12:00");
    expect(schedule.rows[7].timeLabel).toBe("19:00");
    expect(schedule.rows[8].timeLabel).toBe("20:00");
    expect(schedule.rows.some((row) => row.timeLabel === "21:00")).toBe(false);
    expect(schedule.rows[0].cells).toHaveLength(7);
  });

  it("maps schedule cell tones and links from slot status", () => {
    const week = getScheduleWeek("2026-07-06", shanghaiDateAt("2026-06-30", 9));
    const schedule = buildWeeklySchedule({
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      previousWeekHref: null,
      nextWeekHref: null,
      slots: [
        {
          id: "available",
          startAt: shanghaiDateAt("2026-07-06", 12).toISOString(),
          endAt: shanghaiDateAt("2026-07-06", 13).toISOString(),
          status: "AVAILABLE",
          courseType: null,
          activeCount: 0,
          capacity: null,
        },
        {
          id: "joinable",
          startAt: shanghaiDateAt("2026-07-06", 13).toISOString(),
          endAt: shanghaiDateAt("2026-07-06", 14).toISOString(),
          status: "LOCKED_NOT_FULL",
          courseType: CourseType.ONE_TO_THREE,
          activeCount: 2,
          capacity: 3,
        },
        {
          id: "full",
          startAt: shanghaiDateAt("2026-07-06", 14).toISOString(),
          endAt: shanghaiDateAt("2026-07-06", 15).toISOString(),
          status: "FULL",
          courseType: CourseType.ONE_TO_THREE,
          activeCount: 3,
          capacity: 3,
        },
        {
          id: "closed",
          startAt: shanghaiDateAt("2026-07-07", 19).toISOString(),
          endAt: shanghaiDateAt("2026-07-07", 20).toISOString(),
          status: "CLOSED",
          courseType: null,
          activeCount: 0,
          capacity: null,
        },
      ],
    });

    expect(schedule.rows[0].cells[0]).toMatchObject({
      tone: "green",
      href: "/parent/slots/available",
    });
    expect(schedule.rows[1].cells[0]).toMatchObject({
      subtitle: "1v3 2/3",
      tone: "green",
    });
    expect(schedule.rows[2].cells[0]).toMatchObject({
      subtitle: "1v3 3/3",
      tone: "red",
    });
    expect(schedule.rows[7].cells[1]).toMatchObject({
      tone: "gray",
      href: null,
    });
  });

  it("does not use a today-wide locked status for parent schedule cells", () => {
    const week = getScheduleWeek("2026-07-01", shanghaiDateAt("2026-07-01", 9));
    const schedule = buildWeeklySchedule({
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      previousWeekHref: null,
      nextWeekHref: null,
      slots: [
        {
          id: "today-future",
          startAt: shanghaiDateAt("2026-07-01", 16).toISOString(),
          endAt: shanghaiDateAt("2026-07-01", 17).toISOString(),
          status: "AVAILABLE",
          courseType: null,
          activeCount: 0,
          capacity: null,
        },
        {
          id: "today-started",
          startAt: shanghaiDateAt("2026-07-01", 12).toISOString(),
          endAt: shanghaiDateAt("2026-07-01", 13).toISOString(),
          status: "EXPIRED",
          courseType: null,
          activeCount: 0,
          capacity: null,
        },
        {
          id: "today-joinable",
          startAt: shanghaiDateAt("2026-07-01", 17).toISOString(),
          endAt: shanghaiDateAt("2026-07-01", 18).toISOString(),
          status: "LOCKED_NOT_FULL",
          courseType: CourseType.ONE_TO_TWO,
          activeCount: 1,
          capacity: 2,
        },
      ],
    });
    const serialized = JSON.stringify(schedule);

    expect(serialized).not.toContain("今日不可约");
    expect(schedule.rows[4].cells[2]).toMatchObject({
      tone: "green",
      href: "/parent/slots/today-future",
    });
    expect(schedule.rows[0].cells[2]).toMatchObject({
      tone: "gray",
      href: null,
    });
    expect(schedule.rows[5].cells[2]).toMatchObject({
      subtitle: "1v2 1/2",
      tone: "green",
      href: "/parent/slots/today-joinable",
    });
  });

  it("keeps parent schedule helper copy readable without placeholder question marks", () => {
    const source = readFileSync("src/components/parent/ParentSchedulePage.tsx", "utf8");

    expect(source).toContain("已开始或已过去的课程不可预约。");
    expect(source).toContain("当天课程不可在线取消，请联系教练。");
    expect(source).toContain("多人课会显示已报名学员姓名");
    expect(source).not.toContain("今日不可约");
    expect(source).not.toMatch(/\?{3,}/);
  });
});
