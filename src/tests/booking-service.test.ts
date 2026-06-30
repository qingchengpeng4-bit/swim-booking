import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BookingStatus, CourseType, SlotStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/db";
import { createParentBooking, cancelParentBooking, cancelCoachBooking } from "../services/booking.service";
import { getCoachSlotDetail, getOpenSlots, getParentSlotDetail } from "../services/slot.service";

const testRunId = `phase1-${Date.now()}`;
const testPhonePrefix = "199";
let testCoachId = "";

function shanghaiDateAt(dayOffset: number, hour: number, minute = 0) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day + dayOffset, hour - 8, minute, 0));
}

function phone(seed: number) {
  return `${testPhonePrefix}${String(seed).padStart(8, "0")}`;
}

async function createTestCoach() {
  const user = await prisma.user.create({
    data: {
      role: UserRole.COACH,
      name: `${testRunId}-coach`,
      phone: phone(Math.floor(Math.random() * 90000000)),
    },
  });

  return prisma.coach.create({
    data: {
      userId: user.id,
      displayName: `${testRunId}-coach`,
      phone: user.phone,
    },
  });
}

async function createFutureSlot(dayOffset = 7) {
  const startAt = shanghaiDateAt(dayOffset, 10);
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

  return prisma.slot.create({
    data: {
      coachId: testCoachId,
      startAt,
      endAt,
      status: SlotStatus.OPEN,
    },
  });
}

async function createTodaySlot() {
  const startAt = shanghaiDateAt(0, 23);
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

  return prisma.slot.create({
    data: {
      coachId: testCoachId,
      startAt,
      endAt,
      status: SlotStatus.OPEN,
      courseType: CourseType.ONE_TO_ONE,
      capacity: 1,
    },
  });
}

async function createStartedSlot() {
  const startAt = new Date(Date.now() - 60 * 60 * 1000);
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

  return prisma.slot.create({
    data: {
      coachId: testCoachId,
      startAt,
      endAt,
      status: SlotStatus.OPEN,
    },
  });
}

async function activeCount(slotId: string) {
  return prisma.booking.count({
    where: {
      slotId,
      status: BookingStatus.ACTIVE,
    },
  });
}

async function getSlot(slotId: string) {
  return prisma.slot.findUniqueOrThrow({
    where: { id: slotId },
  });
}

async function cleanupTestData() {
  const coaches = await prisma.coach.findMany({
    where: {
      displayName: {
        startsWith: "phase1-",
      },
    },
    select: {
      id: true,
      userId: true,
    },
  });
  const coachIds = coaches.map((coach) => coach.id);
  const userIds = coaches.map((coach) => coach.userId);

  if (coachIds.length > 0) {
    await prisma.booking.deleteMany({ where: { coachId: { in: coachIds } } });
    await prisma.slot.deleteMany({ where: { coachId: { in: coachIds } } });
    await prisma.coach.deleteMany({ where: { id: { in: coachIds } } });
  }

  if (userIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

beforeAll(async () => {
  await cleanupTestData();
  const coach = await createTestCoach();
  testCoachId = coach.id;
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe.sequential("booking service core rules", () => {
  it("books an empty 1v1 slot and immediately makes it full", async () => {
    const slot = await createFutureSlot();

    await createParentBooking({
      slotId: slot.id,
      studentName: "Phase One",
      contactPhone: phone(1),
      courseType: CourseType.ONE_TO_ONE,
    });

    const updated = await getSlot(slot.id);
    expect(updated.courseType).toBe(CourseType.ONE_TO_ONE);
    expect(updated.capacity).toBe(1);
    expect(await activeCount(slot.id)).toBe(1);

    await expect(
      createParentBooking({
        slotId: slot.id,
        studentName: "Phase Extra",
        contactPhone: phone(2),
        courseType: CourseType.ONE_TO_ONE,
      }),
    ).rejects.toThrow();
  });

  it("allows parent booking for a later slot today", async () => {
    const slot = await createTodaySlot();

    await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Today Future",
      contactPhone: phone(26),
      courseType: CourseType.ONE_TO_ONE,
    });

    expect(await activeCount(slot.id)).toBe(1);
  });

  it("rejects parent booking for a slot that has already started", async () => {
    const slot = await createStartedSlot();

    await expect(
      createParentBooking({
        slotId: slot.id,
        studentName: "Phase Started",
        contactPhone: phone(27),
        courseType: CourseType.ONE_TO_ONE,
      }),
    ).rejects.toThrow("课程已开始或已过期，无法预约。");
  });

  it("books 1v2 up to 2/2 and rejects the third parent", async () => {
    const slot = await createFutureSlot();

    await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Two A",
      contactPhone: phone(3),
      courseType: CourseType.ONE_TO_TWO,
    });
    expect(await activeCount(slot.id)).toBe(1);
    expect((await getSlot(slot.id)).capacity).toBe(2);

    await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Two B",
      contactPhone: phone(4),
      courseType: CourseType.ONE_TO_TWO,
    });
    expect(await activeCount(slot.id)).toBe(2);

    await expect(
      createParentBooking({
        slotId: slot.id,
        studentName: "Phase Two C",
        contactPhone: phone(5),
        courseType: CourseType.ONE_TO_TWO,
      }),
    ).rejects.toThrow();
  });

  it("books 1v3 up to 3/3 and rejects the fourth parent", async () => {
    const slot = await createFutureSlot();

    for (const index of [6, 7, 8]) {
      await createParentBooking({
        slotId: slot.id,
        studentName: `Phase Three ${index}`,
        contactPhone: phone(index),
        courseType: CourseType.ONE_TO_THREE,
      });
      expect(await activeCount(slot.id)).toBe(index - 5);
    }

    const updated = await getSlot(slot.id);
    expect(updated.courseType).toBe(CourseType.ONE_TO_THREE);
    expect(updated.capacity).toBe(3);

    await expect(
      createParentBooking({
        slotId: slot.id,
        studentName: "Phase Three D",
        contactPhone: phone(9),
        courseType: CourseType.ONE_TO_THREE,
      }),
    ).rejects.toThrow();
  });

  it("locks 1v2 slots against 1v1 and 1v3", async () => {
    const slot = await createFutureSlot();

    await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Lock 2",
      contactPhone: phone(10),
      courseType: CourseType.ONE_TO_TWO,
    });

    await expect(
      createParentBooking({
        slotId: slot.id,
        studentName: "Phase Lock 1",
        contactPhone: phone(11),
        courseType: CourseType.ONE_TO_ONE,
      }),
    ).rejects.toThrow();

    await expect(
      createParentBooking({
        slotId: slot.id,
        studentName: "Phase Lock 3",
        contactPhone: phone(12),
        courseType: CourseType.ONE_TO_THREE,
      }),
    ).rejects.toThrow();
  });

  it("locks 1v3 slots against 1v1 and 1v2", async () => {
    const slot = await createFutureSlot();

    await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Lock 3",
      contactPhone: phone(13),
      courseType: CourseType.ONE_TO_THREE,
    });

    await expect(
      createParentBooking({
        slotId: slot.id,
        studentName: "Phase Lock 1",
        contactPhone: phone(14),
        courseType: CourseType.ONE_TO_ONE,
      }),
    ).rejects.toThrow();

    await expect(
      createParentBooking({
        slotId: slot.id,
        studentName: "Phase Lock 2",
        contactPhone: phone(15),
        courseType: CourseType.ONE_TO_TWO,
      }),
    ).rejects.toThrow();
  });

  it("cancels a future parent booking, keeps the record, and releases capacity", async () => {
    const slot = await createFutureSlot();
    const booking = await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Cancel",
      contactPhone: phone(16),
      courseType: CourseType.ONE_TO_ONE,
    });

    await cancelParentBooking({
      bookingId: booking.id,
      contactPhone: phone(16),
    });

    const cancelled = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    const updated = await getSlot(slot.id);

    expect(cancelled.status).toBe(BookingStatus.CANCELLED);
    expect(await activeCount(slot.id)).toBe(0);
    expect(updated.courseType).toBeNull();
    expect(updated.capacity).toBeNull();
  });

  it("rejects parent cancellation for a today booking but allows coach cancellation", async () => {
    const slot = await createTodaySlot();
    const booking = await prisma.booking.create({
      data: {
        slotId: slot.id,
        coachId: slot.coachId,
        studentName: "Phase Today",
        contactPhone: phone(17),
        courseType: CourseType.ONE_TO_ONE,
      },
    });

    await expect(
      cancelParentBooking({
        bookingId: booking.id,
        contactPhone: phone(17),
      }),
    ).rejects.toThrow("当天课程不可在线取消，请联系教练。");

    await cancelCoachBooking({
      bookingId: booking.id,
      reason: "Coach handled today cancellation",
    });

    const cancelled = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(cancelled.status).toBe(BookingStatus.CANCELLED);
  });

  it("keeps course type when one active booking remains and resets it after all cancel", async () => {
    const slot = await createFutureSlot();
    const first = await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Keep A",
      contactPhone: phone(18),
      courseType: CourseType.ONE_TO_TWO,
    });
    const second = await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Keep B",
      contactPhone: phone(19),
      courseType: CourseType.ONE_TO_TWO,
    });

    await cancelParentBooking({ bookingId: first.id, contactPhone: phone(18) });
    let updated = await getSlot(slot.id);
    expect(updated.courseType).toBe(CourseType.ONE_TO_TWO);
    expect(updated.capacity).toBe(2);
    expect(await activeCount(slot.id)).toBe(1);

    await cancelParentBooking({ bookingId: second.id, contactPhone: phone(19) });
    updated = await getSlot(slot.id);
    expect(updated.courseType).toBeNull();
    expect(updated.capacity).toBeNull();
    expect(await activeCount(slot.id)).toBe(0);
  });

  it("returns group student names to parents without leaking contact phone, remark, or booking time", async () => {
    const slot = await createFutureSlot();
    await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Privacy A",
      contactPhone: phone(20),
      courseType: CourseType.ONE_TO_TWO,
      remark: "Private remark A",
    });
    await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Privacy B",
      contactPhone: phone(21),
      courseType: CourseType.ONE_TO_TWO,
      remark: "Private remark B",
    });

    const parentDetail = await getParentSlotDetail(slot.id);
    const serialized = JSON.stringify(parentDetail);

    expect(parentDetail?.registeredStudentNames).toEqual(["Phase Privacy A", "Phase Privacy B"]);
    expect(serialized).not.toContain(phone(20));
    expect(serialized).not.toContain(phone(21));
    expect(serialized).not.toContain("Private remark");
    expect(serialized).not.toContain("createdAt");
  });

  it("returns complete booking information to coach service", async () => {
    const slot = await createFutureSlot();
    await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Coach View",
      contactPhone: phone(22),
      courseType: CourseType.ONE_TO_ONE,
      remark: "Coach can see this",
    });

    const detail = await getCoachSlotDetail(slot.id);

    expect(detail?.bookings).toHaveLength(1);
    expect(detail?.bookings[0]).toMatchObject({
      studentName: "Phase Coach View",
      contactPhone: phone(22),
      courseType: CourseType.ONE_TO_ONE,
      status: BookingStatus.ACTIVE,
      remark: "Coach can see this",
    });
    expect(detail?.bookings[0].createdAt).toEqual(expect.any(String));
  });

  it("stays stable after repeated booking, cancellation, and slot list refreshes", async () => {
    const slot = await createFutureSlot();
    const first = await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Stable A",
      contactPhone: phone(23),
      courseType: CourseType.ONE_TO_THREE,
    });
    const second = await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Stable B",
      contactPhone: phone(24),
      courseType: CourseType.ONE_TO_THREE,
    });

    await cancelParentBooking({ bookingId: first.id, contactPhone: phone(23) });
    await createParentBooking({
      slotId: slot.id,
      studentName: "Phase Stable C",
      contactPhone: phone(25),
      courseType: CourseType.ONE_TO_THREE,
    });
    await cancelParentBooking({ bookingId: second.id, contactPhone: phone(24) });

    await expect(getParentSlotDetail(slot.id)).resolves.toBeTruthy();
    await expect(getOpenSlots()).resolves.toEqual(expect.any(Array));

    const detail = await getParentSlotDetail(slot.id);
    expect(detail?.activeCount).toBe(1);
    expect(detail?.courseType).toBe(CourseType.ONE_TO_THREE);
    expect(detail?.capacity).toBe(3);
  });
});

