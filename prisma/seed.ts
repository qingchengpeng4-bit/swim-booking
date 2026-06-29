import { PrismaClient, SlotStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

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

async function main() {
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.coach.deleteMany();
  await prisma.user.deleteMany();

  const coachUser = await prisma.user.create({
    data: {
      role: UserRole.COACH,
      name: "测试教练",
      phone: "13800000000",
    },
  });

  const coach = await prisma.coach.create({
    data: {
      userId: coachUser.id,
      displayName: "王教练",
      phone: "13800000000",
    },
  });

  const slots = [
    [0, 10, 0],
    [0, 15, 0],
    [1, 9, 0],
    [1, 10, 30],
    [1, 15, 0],
    [2, 9, 0],
    [2, 10, 30],
    [2, 15, 0],
    [3, 9, 0],
    [3, 10, 30],
  ] as const;

  for (const [dayOffset, hour, minute] of slots) {
    const startAt = shanghaiDateAt(dayOffset, hour, minute);
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
    await prisma.slot.create({
      data: {
        coachId: coach.id,
        startAt,
        endAt,
        status: SlotStatus.OPEN,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed completed.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
