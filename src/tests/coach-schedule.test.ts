import { BookingStatus, CourseType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildCoachWeeklySchedule, type CoachScheduleSlotSummary } from "@/lib/coach-schedule";

function shanghaiDateAt(dateOnly: string, hour: number) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 8, 0, 0));
}

function slot(overrides: Partial<CoachScheduleSlotSummary>): CoachScheduleSlotSummary {
  return {
    id: "slot",
    startAt: shanghaiDateAt("2026-07-06", 12).toISOString(),
    endAt: shanghaiDateAt("2026-07-06", 13).toISOString(),
    status: "OPEN",
    courseType: null,
    activeCount: 0,
    capacity: null,
    bookings: [],
    ...overrides,
  };
}

describe("coach weekly schedule", () => {
  it("builds nine rows from 12:00 to 20:00 without a 21:00 row", () => {
    const schedule = buildCoachWeeklySchedule({
      weekStart: shanghaiDateAt("2026-07-06", 0),
      slots: [],
    });

    expect(schedule.rows).toHaveLength(9);
    expect(schedule.rows[0].timeLabel).toBe("12:00");
    expect(schedule.rows[8].timeLabel).toBe("20:00");
    expect(schedule.rows.some((row) => row.timeLabel === "21:00")).toBe(false);
    expect(schedule.rows[0].cells).toHaveLength(7);
  });

  it("maps coach-facing cell text, tone, and href without leaking sensitive fields", () => {
    const schedule = buildCoachWeeklySchedule({
      weekStart: shanghaiDateAt("2026-07-06", 0),
      slots: [
        slot({
          id: "empty",
          startAt: shanghaiDateAt("2026-07-06", 12).toISOString(),
          endAt: shanghaiDateAt("2026-07-06", 13).toISOString(),
        }),
        slot({
          id: "one-to-two",
          startAt: shanghaiDateAt("2026-07-06", 13).toISOString(),
          endAt: shanghaiDateAt("2026-07-06", 14).toISOString(),
          courseType: CourseType.ONE_TO_TWO,
          activeCount: 1,
          capacity: 2,
          bookings: [{ studentName: "张三", status: BookingStatus.ACTIVE }],
        }),
        slot({
          id: "one-to-three-full",
          startAt: shanghaiDateAt("2026-07-06", 14).toISOString(),
          endAt: shanghaiDateAt("2026-07-06", 15).toISOString(),
          courseType: CourseType.ONE_TO_THREE,
          activeCount: 3,
          capacity: 3,
          bookings: [
            { studentName: "学生A", status: BookingStatus.ACTIVE },
            { studentName: "学生B", status: BookingStatus.ACTIVE },
            { studentName: "学生C", status: BookingStatus.ACTIVE },
          ],
        }),
        slot({
          id: "closed",
          startAt: shanghaiDateAt("2026-07-07", 19).toISOString(),
          endAt: shanghaiDateAt("2026-07-07", 20).toISOString(),
          status: "CLOSED",
        }),
      ],
    });

    expect(schedule.rows[0].cells[0]).toMatchObject({
      title: "空闲",
      subtitle: "可预约",
      tone: "green",
      href: "/coach/slots/empty",
    });
    expect(schedule.rows[1].cells[0]).toMatchObject({
      title: "1v2 1/2",
      subtitle: "张三",
      tone: "green",
      href: "/coach/slots/one-to-two",
    });
    expect(schedule.rows[2].cells[0]).toMatchObject({
      title: "1v3 3/3",
      subtitle: "已满",
      tone: "red",
      href: "/coach/slots/one-to-three-full",
    });
    expect(schedule.rows[7].cells[1]).toMatchObject({
      title: "大班课",
      subtitle: "不可预约",
      tone: "gray",
      href: null,
    });

    const serialized = JSON.stringify(schedule);
    expect(serialized).toContain("张三");
    expect(serialized).not.toContain("contactPhone");
    expect(serialized).not.toContain("remark");
    expect(serialized).not.toContain("19900000001");
  });
});
