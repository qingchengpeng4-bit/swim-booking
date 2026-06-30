import { CourseType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildWeeklySchedule, getScheduleWeek } from "@/lib/schedule";

function shanghaiDateAt(dateOnly: string, hour: number) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 8, 0, 0));
}

describe("weekly schedule", () => {
  it("builds eight rows and seven day columns for a week", () => {
    const week = getScheduleWeek("2026-07-06", shanghaiDateAt("2026-06-30", 9));
    const schedule = buildWeeklySchedule({
      slots: [],
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      previousWeekHref: week.previousWeekHref,
      nextWeekHref: week.nextWeekHref,
    });

    expect(schedule.days).toHaveLength(7);
    expect(schedule.rows).toHaveLength(8);
    expect(schedule.rows[0].timeLabel).toBe("12:00");
    expect(schedule.rows[7].timeLabel).toBe("19:00");
    expect(schedule.rows[0].cells).toHaveLength(7);
  });

  it("maps schedule cell text and tones from slot status", () => {
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
      title: "可预约",
      subtitle: "任选课型",
      tone: "green",
      href: "/parent/slots/available",
    });
    expect(schedule.rows[1].cells[0]).toMatchObject({
      title: "可加入",
      subtitle: "1v3 2/3",
      tone: "green",
    });
    expect(schedule.rows[2].cells[0]).toMatchObject({
      title: "已约满",
      subtitle: "1v3 3/3",
      tone: "red",
    });
    expect(schedule.rows[7].cells[1]).toMatchObject({
      title: "大班课",
      subtitle: "不可预约",
      tone: "gray",
      href: null,
    });
  });
});
