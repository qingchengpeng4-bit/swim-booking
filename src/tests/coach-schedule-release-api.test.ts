import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/coach/schedule-release/route";
import { isCoachAuthenticated } from "@/lib/coach-auth";
import { revalidateScheduleViews } from "@/lib/schedule-cache";
import { releaseNextParentScheduleWindow } from "@/services/schedule-release.service";

vi.mock("@/lib/coach-auth", () => ({
  isCoachAuthenticated: vi.fn(),
}));

vi.mock("@/lib/schedule-cache", () => ({
  revalidateScheduleViews: vi.fn(),
}));

vi.mock("@/services/schedule-release.service", () => ({
  releaseNextParentScheduleWindow: vi.fn(),
}));

const mockedIsCoachAuthenticated = vi.mocked(isCoachAuthenticated);
const mockedReleaseNextParentScheduleWindow = vi.mocked(releaseNextParentScheduleWindow);
const mockedRevalidateScheduleViews = vi.mocked(revalidateScheduleViews);

describe("coach schedule release API", () => {
  beforeEach(() => {
    mockedIsCoachAuthenticated.mockReset();
    mockedReleaseNextParentScheduleWindow.mockReset();
    mockedRevalidateScheduleViews.mockReset();
  });

  it("rejects unauthenticated release requests", async () => {
    mockedIsCoachAuthenticated.mockResolvedValue(false);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      code: "COACH_UNAUTHORIZED",
      error: "请先登录教练后台",
    });
    expect(mockedReleaseNextParentScheduleWindow).not.toHaveBeenCalled();
  });

  it("releases the next schedule window and refreshes schedule cache", async () => {
    mockedIsCoachAuthenticated.mockResolvedValue(true);
    mockedReleaseNextParentScheduleWindow.mockResolvedValue({
      releasedUntil: "2026-07-12",
      nextReleaseUntil: "2026-07-26",
      previousReleasedUntil: null,
      latestSlotDate: "2026-08-31",
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.releasedUntil).toBe("2026-07-12");
    expect(body.nextReleaseUntil).toBe("2026-07-26");
    expect(mockedReleaseNextParentScheduleWindow).toHaveBeenCalledOnce();
    expect(mockedRevalidateScheduleViews).toHaveBeenCalledOnce();
  });
});
