import { BookingStatus, CourseType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildCoachWeeklySchedule, type CoachScheduleSlotSummary } from "@/lib/coach-schedule";
import { SCHEDULE_HOURS } from "@/lib/schedule";

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

function build(slots: CoachScheduleSlotSummary[], now = shanghaiDateAt("2026-07-01", 9)) {
  return buildCoachWeeklySchedule({
    weekStart: shanghaiDateAt("2026-07-06", 0),
    weekEnd: shanghaiDateAt("2026-07-12", 0),
    now,
    slots,
  });
}

describe("coach weekly schedule", () => {
  it("builds nine rows from 12:00 to 20:00 without a 21:00 row", () => {
    const schedule = build([]);

    expect(schedule.rows).toHaveLength(9);
    expect(schedule.rows.map((row) => row.timeLabel)).toEqual(SCHEDULE_HOURS.map((hour) => `${hour}:00`));
    expect(schedule.rows[0].timeLabel).toBe("12:00");
    expect(schedule.rows[8].timeLabel).toBe("20:00");
    expect(schedule.rows.some((row) => row.timeLabel === "21:00")).toBe(false);
    expect(schedule.rows[0].cells).toHaveLength(7);
  });

  it("ignores slots outside business hours instead of rendering extra rows", () => {
    const schedule = build([
      slot({
        id: "off-hour",
        startAt: shanghaiDateAt("2026-07-06", 10).toISOString(),
        endAt: shanghaiDateAt("2026-07-06", 11).toISOString(),
        courseType: CourseType.ONE_TO_ONE,
        activeCount: 1,
        capacity: 1,
        bookings: [{ studentName: "营业外学员", status: BookingStatus.ACTIVE }],
      }),
    ]);
    const serialized = JSON.stringify(schedule);

    expect(schedule.rows).toHaveLength(9);
    expect(schedule.rows.map((row) => row.timeLabel)).toEqual(SCHEDULE_HOURS.map((hour) => `${hour}:00`));
    expect(schedule.rows.some((row) => row.timeLabel === "10:00")).toBe(false);
    expect(serialized).not.toContain("off-hour");
    expect(serialized).not.toContain("营业外学员");
  });

  it("shows today future empty slots as bookable", () => {
    const schedule = build(
      [
        slot({
          id: "today-future",
          startAt: shanghaiDateAt("2026-07-06", 16).toISOString(),
          endAt: shanghaiDateAt("2026-07-06", 17).toISOString(),
        }),
      ],
      shanghaiDateAt("2026-07-06", 15),
    );

    expect(schedule.rows[4].cells[0]).toMatchObject({
      title: "空闲",
      subtitle: "可预约",
      tone: "green",
      href: "/coach/slots/today-future",
    });
  });

  it("shows today started empty slots as expired", () => {
    const schedule = build(
      [
        slot({
          id: "today-started",
          startAt: shanghaiDateAt("2026-07-06", 15).toISOString(),
          endAt: shanghaiDateAt("2026-07-06", 16).toISOString(),
        }),
      ],
      shanghaiDateAt("2026-07-06", 15),
    );

    expect(schedule.rows[3].cells[0]).toMatchObject({
      title: "已过期",
      subtitle: "",
      tone: "gray",
      href: null,
    });
  });

  it("keeps started active bookings visible and linked to coach detail", () => {
    const schedule = build(
      [
        slot({
          id: "started-booked",
          startAt: shanghaiDateAt("2026-07-06", 15).toISOString(),
          endAt: shanghaiDateAt("2026-07-06", 16).toISOString(),
          courseType: CourseType.ONE_TO_ONE,
          activeCount: 1,
          capacity: 1,
          bookings: [{ studentName: "李四", status: BookingStatus.ACTIVE }],
        }),
      ],
      shanghaiDateAt("2026-07-06", 15),
    );

    expect(schedule.rows[3].cells[0]).toMatchObject({
      title: "1v1",
      subtitle: "李四 · 已过期",
      tone: "gray",
      href: "/coach/slots/started-booked",
    });
  });

  it("shows future empty slots as bookable", () => {
    const schedule = build([
      slot({
        id: "future-empty",
        startAt: shanghaiDateAt("2026-07-06", 12).toISOString(),
        endAt: shanghaiDateAt("2026-07-06", 13).toISOString(),
      }),
    ]);

    expect(schedule.rows[0].cells[0]).toMatchObject({
      title: "空闲",
      subtitle: "可预约",
      tone: "green",
      href: "/coach/slots/future-empty",
    });
  });

  it("shows closed group class slots as unavailable without href", () => {
    const schedule = build([
      slot({
        id: "closed",
        startAt: shanghaiDateAt("2026-07-07", 19).toISOString(),
        endAt: shanghaiDateAt("2026-07-07", 20).toISOString(),
        status: "CLOSED",
      }),
    ]);

    expect(schedule.rows[7].cells[1]).toMatchObject({
      title: "大班课",
      subtitle: "不可预约",
      tone: "gray",
      href: null,
    });
  });

  it("shows student names without leaking phone or remark", () => {
    const schedule = build([
      slot({
        id: "one-to-two",
        startAt: shanghaiDateAt("2026-07-06", 13).toISOString(),
        endAt: shanghaiDateAt("2026-07-06", 14).toISOString(),
        courseType: CourseType.ONE_TO_TWO,
        activeCount: 1,
        capacity: 2,
        bookings: [{ studentName: "张三", status: BookingStatus.ACTIVE }],
      }),
    ]);
    const serialized = JSON.stringify(schedule);

    expect(schedule.rows[1].cells[0]).toMatchObject({
      title: "1v2 1/2",
      subtitle: "张三",
      tone: "green",
      href: "/coach/slots/one-to-two",
    });
    expect(serialized).toContain("张三");
    expect(serialized).not.toContain("contactPhone");
    expect(serialized).not.toContain("remark");
    expect(serialized).not.toContain("19900000001");
  });
});
