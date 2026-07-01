import { BookingStatus, CourseType } from "@prisma/client";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/coach/weekly-schedule/route";
import { isCoachAuthenticated } from "@/lib/coach-auth";
import { getCoachWeeklySlots } from "@/services/slot.service";

vi.mock("@/lib/coach-auth", () => ({
  isCoachAuthenticated: vi.fn(),
}));

vi.mock("@/services/slot.service", () => ({
  getCoachWeeklySlots: vi.fn(),
}));

const mockedIsCoachAuthenticated = vi.mocked(isCoachAuthenticated);
const mockedGetCoachWeeklySlots = vi.mocked(getCoachWeeklySlots);

function shanghaiDateAt(dateOnly: string, hour: number) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 8, 0, 0));
}

describe("coach weekly schedule API", () => {
  beforeEach(() => {
    mockedIsCoachAuthenticated.mockReset();
    mockedGetCoachWeeklySlots.mockReset();
  });

  it("rejects unauthenticated requests without loading schedule data", async () => {
    mockedIsCoachAuthenticated.mockResolvedValue(false);

    const response = await GET(new Request("http://localhost/api/coach/weekly-schedule?week=2026-07-06"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      code: "UNAUTHORIZED",
      error: "请先登录教练后台。",
    });
    expect(mockedGetCoachWeeklySlots).not.toHaveBeenCalled();
  });

  it("returns coach grid fields without phone, remark, booking time, or cancel reason", async () => {
    mockedIsCoachAuthenticated.mockResolvedValue(true);
    mockedGetCoachWeeklySlots.mockResolvedValue([
      {
        id: "slot-1",
        startAt: shanghaiDateAt("2026-07-06", 12).toISOString(),
        endAt: shanghaiDateAt("2026-07-06", 13).toISOString(),
        status: "OPEN",
        courseType: CourseType.ONE_TO_TWO,
        activeCount: 1,
        capacity: 2,
        bookings: [
          {
            studentName: "学生A",
            status: BookingStatus.ACTIVE,
            contactPhone: "13800000000",
            remark: "private note",
            createdAt: "2026-07-01T00:00:00.000Z",
            cancelReason: "private reason",
          },
        ],
      } as never,
    ]);

    const response = await GET(new Request("http://localhost/api/coach/weekly-schedule?week=2026-07-06"));
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body.schedule.rows[0].cells[0]).toMatchObject({
      title: "1v2 1/2",
      subtitle: "学生A",
      href: "/coach/slots/slot-1",
    });
    expect(serialized).toContain("学生A");
    expect(serialized).not.toContain("13800000000");
    expect(serialized).not.toContain("private note");
    expect(serialized).not.toContain("createdAt");
    expect(serialized).not.toContain("cancelReason");
  });

  it("keeps client loading and retry copy available", () => {
    const source = readFileSync("src/components/coach/CoachScheduleClient.tsx", "utf8");

    expect(source).toContain("LoadingSkeleton");
    expect(source).toContain("animate-pulse");
    expect(source).toContain("课表加载失败，请重试。");
    expect(source).toContain("重试");
  });
});
