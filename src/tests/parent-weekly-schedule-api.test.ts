import { CourseType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/parent/weekly-schedule/route";
import { getParentWeeklySlots } from "@/services/slot.service";

vi.mock("@/services/slot.service", () => ({
  getParentWeeklySlots: vi.fn(),
}));

const mockedGetParentWeeklySlots = vi.mocked(getParentWeeklySlots);

function shanghaiDateAt(dateOnly: string, hour: number) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 8, 0, 0));
}

describe("parent weekly schedule API", () => {
  beforeEach(() => {
    mockedGetParentWeeklySlots.mockReset();
  });

  it("returns parent-safe schedule data without sensitive booking fields", async () => {
    mockedGetParentWeeklySlots.mockResolvedValue([
      {
        id: "slot-1",
        startAt: shanghaiDateAt("2026-07-06", 12).toISOString(),
        endAt: shanghaiDateAt("2026-07-06", 13).toISOString(),
        status: "LOCKED_NOT_FULL",
        courseType: CourseType.ONE_TO_TWO,
        activeCount: 1,
        capacity: 2,
        contactPhone: "13800000000",
        remark: "private note",
        createdAt: "2026-07-01T00:00:00.000Z",
        cancelReason: "private reason",
      } as never,
    ]);

    const response = await GET(new Request("http://localhost/api/parent/weekly-schedule?week=2026-07-06"));
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body.schedule.rows).toHaveLength(9);
    expect(body.schedule.rows[0].cells[0]).toMatchObject({
      title: "可加入",
      subtitle: "1v2 1/2",
      href: "/parent/slots/slot-1",
    });
    expect(serialized).not.toContain("13800000000");
    expect(serialized).not.toContain("private note");
    expect(serialized).not.toContain("createdAt");
    expect(serialized).not.toContain("cancelReason");
  });

  it("returns a stable error response without exposing implementation details", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockedGetParentWeeklySlots.mockRejectedValue(new Error("raw database host detail"));

    const response = await GET(new Request("http://localhost/api/parent/weekly-schedule?week=2026-07-06"));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      code: "PARENT_WEEKLY_SCHEDULE_UNAVAILABLE",
      error: "课表加载失败，请重试。",
    });
    expect(JSON.stringify(body)).not.toContain("raw database host detail");

    consoleSpy.mockRestore();
  });
});
