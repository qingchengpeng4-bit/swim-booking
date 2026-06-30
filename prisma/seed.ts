import { BookingStatus, PrismaClient, SlotStatus, UserRole } from "@prisma/client";
import { buildSlotSeedPlan } from "@/lib/slot-seed-plan";

const prisma = new PrismaClient();

async function getOrCreateDefaultCoach() {
  const existingCoach = await prisma.coach.findFirst({
    where: {
      phone: "13800000000",
    },
  });

  if (existingCoach) return existingCoach;

  const coachUser = await prisma.user.create({
    data: {
      role: UserRole.COACH,
      name: "测试教练",
      phone: "13800000000",
    },
  });

  return prisma.coach.create({
    data: {
      userId: coachUser.id,
      displayName: "王教练",
      phone: "13800000000",
    },
  });
}

function slotKey(startAt: Date, endAt: Date) {
  return `${startAt.toISOString()}__${endAt.toISOString()}`;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

async function main() {
  const coach = await getOrCreateDefaultCoach();
  const plan = buildSlotSeedPlan();
  const firstStart = plan[0]?.startAt;
  const lastEnd = plan[plan.length - 1]?.endAt;

  if (!firstStart || !lastEnd) {
    console.log("Seed skipped. No planned slots.");
    return;
  }

  const existingSlots = await prisma.slot.findMany({
    where: {
      coachId: coach.id,
      startAt: {
        gte: firstStart,
      },
      endAt: {
        lte: lastEnd,
      },
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      bookings: {
        where: {
          status: BookingStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      },
    },
  });

  const existingByKey = new Map(existingSlots.map((slot) => [slotKey(slot.startAt, slot.endAt), slot]));
  const conflicts: Array<{
    startAt: Date;
    endAt: Date;
    activeCount: number;
  }> = [];

  for (const item of plan) {
    if (item.status !== SlotStatus.CLOSED) continue;
    const existingSlot = existingByKey.get(slotKey(item.startAt, item.endAt));
    const activeCount = existingSlot?.bookings.length ?? 0;

    if (activeCount > 0) {
      conflicts.push({
        startAt: item.startAt,
        endAt: item.endAt,
        activeCount,
      });
    }
  }

  if (conflicts.length > 0) {
    console.error("Seed stopped: fixed group class slots conflict with active bookings.");
    for (const conflict of conflicts) {
      console.error(
        `- ${formatDateTime(conflict.startAt)} - ${formatDateTime(conflict.endAt)} has ${conflict.activeCount} ACTIVE booking(s). Cannot close automatically.`,
      );
    }
    throw new Error("Seed stopped because closing these slots would affect active bookings.");
  }

  const missingSlots = plan.filter((item) => !existingByKey.has(slotKey(item.startAt, item.endAt)));

  if (missingSlots.length > 0) {
    await prisma.slot.createMany({
      data: missingSlots.map((item) => ({
        coachId: coach.id,
        startAt: item.startAt,
        endAt: item.endAt,
        status: item.status,
        courseType: null,
        capacity: null,
      })),
    });
  }

  let updated = 0;
  let skippedExisting = 0;
  let skippedWithActiveBookings = 0;

  for (const item of plan) {
    const existingSlot = existingByKey.get(slotKey(item.startAt, item.endAt));
    if (!existingSlot) continue;

    const activeCount = existingSlot.bookings.length;
    if (activeCount > 0) {
      skippedWithActiveBookings += 1;
      continue;
    }

    if (existingSlot.status === item.status) {
      skippedExisting += 1;
      continue;
    }

    await prisma.slot.update({
      where: {
        id: existingSlot.id,
      },
      data: {
        status: item.status,
        courseType: item.status === SlotStatus.CLOSED ? null : undefined,
        capacity: item.status === SlotStatus.CLOSED ? null : undefined,
      },
    });
    updated += 1;
  }

  const closedCount = await prisma.slot.count({
    where: {
      coachId: coach.id,
      status: SlotStatus.CLOSED,
      startAt: {
        gte: firstStart,
      },
      endAt: {
        lte: lastEnd,
      },
    },
  });

  console.log(
    [
      "Seed completed.",
      `Created: ${missingSlots.length}.`,
      `Updated: ${updated}.`,
      `Skipped existing: ${skippedExisting}.`,
      `Skipped with active bookings: ${skippedWithActiveBookings}.`,
      `Closed group-class slots in range: ${closedCount}.`,
      `Total planned slots: ${plan.length}.`,
    ].join(" "),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
