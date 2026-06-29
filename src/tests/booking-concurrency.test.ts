import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BookingStatus, CourseType, SlotStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/db";
import { createParentBooking } from "../services/booking.service";
import { BusinessError } from "../services/errors";
import { APP_ERRORS } from "../lib/app-errors";

const testRunId = `phase2c-${Date.now()}`;
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

async function cleanupTestData() {
  const coaches = await prisma.coach.findMany({
    where: {
      displayName: {
        startsWith: "phase2c-",
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
  const user = await prisma.user.create({
    data: {
      role: UserRole.COACH,
      name: `${testRunId}-coach`,
      phone: "19988000000",
    },
  });
  const coach = await prisma.coach.create({
    data: {
      userId: user.id,
      displayName: `${testRunId}-coach`,
      phone: user.phone,
    },
  });
  testCoachId = coach.id;
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe.sequential("booking concurrency", () => {
  it("allows only one parent to take the final 1v2 seat", async () => {
    const startAt = shanghaiDateAt(10, 10);
    const slot = await prisma.slot.create({
      data: {
        coachId: testCoachId,
        startAt,
        endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
        status: SlotStatus.OPEN,
      },
    });

    await createParentBooking({
      slotId: slot.id,
      studentName: "Concurrency First",
      contactPhone: "19988000001",
      courseType: CourseType.ONE_TO_TWO,
    });

    const attempts = await Promise.allSettled([
      createParentBooking({
        slotId: slot.id,
        studentName: "Concurrency Second A",
        contactPhone: "19988000002",
        courseType: CourseType.ONE_TO_TWO,
      }),
      createParentBooking({
        slotId: slot.id,
        studentName: "Concurrency Second B",
        contactPhone: "19988000003",
        courseType: CourseType.ONE_TO_TWO,
      }),
    ]);

    const fulfilled = attempts.filter((result) => result.status === "fulfilled");
    const rejected = attempts.filter((result) => result.status === "rejected");
    const activeCount = await prisma.booking.count({
      where: {
        slotId: slot.id,
        status: BookingStatus.ACTIVE,
      },
    });

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(activeCount).toBe(2);

    const reason = rejected[0].reason;
    expect(reason).toBeInstanceOf(BusinessError);
    expect([APP_ERRORS.SLOT_JUST_FILLED.code, APP_ERRORS.SLOT_ALREADY_FULL.code]).toContain(reason.code);
  });
});
