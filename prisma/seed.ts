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

  const conflicts: Array<{
    startAt: Date;
    endAt: Date;
    activeCount: number;
  }> = [];

  for (const item of plan) {
    if (item.status !== SlotStatus.CLOSED) continue;

    const existingSlot = await prisma.slot.findFirst({
      where: {
        coachId: coach.id,
        startAt: item.startAt,
        endAt: item.endAt,
      },
      select: {
        id: true,
      },
    });

    if (!existingSlot) continue;

    const activeCount = await prisma.booking.count({
      where: {
        slotId: existingSlot.id,
        status: BookingStatus.ACTIVE,
      },
    });

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

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of plan) {
    const existingSlot = await prisma.slot.findFirst({
      where: {
        coachId: coach.id,
        startAt: item.startAt,
        endAt: item.endAt,
      },
      select: {
        id: true,
      },
    });

    if (!existingSlot) {
      await prisma.slot.create({
        data: {
          coachId: coach.id,
          startAt: item.startAt,
          endAt: item.endAt,
          status: item.status,
          courseType: null,
          capacity: null,
        },
      });
      created += 1;
      continue;
    }

    const activeCount = await prisma.booking.count({
      where: {
        slotId: existingSlot.id,
        status: BookingStatus.ACTIVE,
      },
    });

    if (activeCount > 0) {
      skipped += 1;
      continue;
    }

    await prisma.slot.update({
      where: {
        id: existingSlot.id,
      },
      data: {
        status: item.status,
        courseType: null,
        capacity: null,
      },
    });
    updated += 1;
  }

  console.log(
    `Seed completed. Created: ${created}. Updated: ${updated}. Skipped with active bookings: ${skipped}. Total planned slots: ${plan.length}.`,
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
