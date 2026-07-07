import { CourseType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/parent/weekly-schedule/route";
import { getParentScheduleRelease } from "@/services/schedule-release.service";
import { getParentWeeklySlots } from "@/services/slot.service";

vi.mock("@/services/schedule-release.service", () => ({
  getParentScheduleRelease: vi.fn(),
}));

vi.mock("@/services/slot.service", () => ({
  getParentWeeklySlots: vi.fn(),
}));

const mockedGetParentScheduleRelease = vi.mocked(getParentScheduleRelease);
const mockedGetParentWeeklySlots = vi.mocked(getParentWeeklySlots);

function shanghaiDateAt(dateOnly: string, hour: number) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 8, 0, 0));
}

describe("parent weekly schedule API", () => {
  beforeEach(() => {
    mockedGetParentScheduleRelease.mockReset();
    mockedGetParentWeeklySlots.mockReset();
  });

  it("returns parent-safe schedule data inside the released range", async () => {
    mockedGetParentScheduleRelease.mockResolvedValue("2026-07-14");
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
    expect(body.releasedUntil).toBe("2026-07-14");
    expect(body.schedule.rows).toHaveLength(10);
    expect(body.schedule.rows[1].cells[0]).toMatchObject({
      subtitle: "1v2 1/2",
      href: "/parent/slots/slot-1",
    });
    expect(mockedGetParentWeeklySlots).toHaveBeenCalledWith(expect.any(Date), expect.any(Date), "2026-07-14");
    expect(serialized).not.toContain("13800000000");
    expect(serialized).not.toContain("private note");
    expect(serialized).not.toContain("createdAt");
    expect(serialized).not.toContain("cancelReason");
  });

  it("returns an unreleased response when no release setting exists", async () => {
    mockedGetParentScheduleRelease.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/parent/weekly-schedule?week=2026-07-06"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      schedule: null,
      releasedUntil: null,
      message: "这周课表暂未开放，请等待教练开放。",
    });
    expect(mockedGetParentWeeklySlots).not.toHaveBeenCalled();
  });

  it("returns an unreleased response for a week beyond the released range", async () => {
    mockedGetParentScheduleRelease.mockResolvedValue("2026-07-14");

    const response = await GET(new Request("http://localhost/api/parent/weekly-schedule?week=2026-07-20"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.schedule).toBeNull();
    expect(body.message).toBe("这周课表暂未开放，请等待教练开放。");
    expect(mockedGetParentWeeklySlots).not.toHaveBeenCalled();
  });

  it("returns a stable error response without exposing implementation details", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockedGetParentScheduleRelease.mockResolvedValue("2026-07-14");
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
