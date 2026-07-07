import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "@/app/api/coach/weekly-blocked-slots/[ruleId]/route";
import { GET, POST } from "@/app/api/coach/weekly-blocked-slots/route";
import { isCoachAuthenticated } from "@/lib/coach-auth";
import { revalidateScheduleViews } from "@/lib/schedule-cache";
import {
  addCoachWeeklyBlockedRule,
  deleteCoachWeeklyBlockedRule,
  getCoachWeeklyBlockedRules,
} from "@/services/weekly-blocked-slots.service";

vi.mock("@/lib/coach-auth", () => ({
  isCoachAuthenticated: vi.fn(),
}));

vi.mock("@/lib/schedule-cache", () => ({
  revalidateScheduleViews: vi.fn(),
}));

vi.mock("@/services/weekly-blocked-slots.service", async () => {
  const actual = await vi.importActual<typeof import("@/services/weekly-blocked-slots.service")>("@/services/weekly-blocked-slots.service");
  return {
    ...actual,
    addCoachWeeklyBlockedRule: vi.fn(),
    deleteCoachWeeklyBlockedRule: vi.fn(),
    getCoachWeeklyBlockedRules: vi.fn(),
  };
});

const mockedIsCoachAuthenticated = vi.mocked(isCoachAuthenticated);
const mockedAddCoachWeeklyBlockedRule = vi.mocked(addCoachWeeklyBlockedRule);
const mockedDeleteCoachWeeklyBlockedRule = vi.mocked(deleteCoachWeeklyBlockedRule);
const mockedGetCoachWeeklyBlockedRules = vi.mocked(getCoachWeeklyBlockedRules);
const mockedRevalidateScheduleViews = vi.mocked(revalidateScheduleViews);

describe("coach weekly blocked slots API", () => {
  beforeEach(() => {
    mockedIsCoachAuthenticated.mockReset();
    mockedAddCoachWeeklyBlockedRule.mockReset();
    mockedDeleteCoachWeeklyBlockedRule.mockReset();
    mockedGetCoachWeeklyBlockedRules.mockReset();
    mockedRevalidateScheduleViews.mockReset();
  });

  it("rejects unauthenticated list requests", async () => {
    mockedIsCoachAuthenticated.mockResolvedValue(false);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mockedGetCoachWeeklyBlockedRules).not.toHaveBeenCalled();
  });

  it("lists custom and system rules for authenticated coaches", async () => {
    mockedIsCoachAuthenticated.mockResolvedValue(true);
    mockedGetCoachWeeklyBlockedRules.mockResolvedValue([
      { id: "rule-1", weekday: 4, hour: 18, label: "大班课", createdAt: "2026-07-01T00:00:00.000Z" },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.systemRules).toHaveLength(3);
    expect(body.customRules[0]).toMatchObject({ weekday: 4, hour: 18, label: "大班课" });
  });

  it("adds rules and refreshes schedule cache", async () => {
    mockedIsCoachAuthenticated.mockResolvedValue(true);
    mockedAddCoachWeeklyBlockedRule.mockResolvedValue({
      id: "rule-1",
      weekday: 4,
      hour: 18,
      label: "大班课",
      createdAt: "2026-07-01T00:00:00.000Z",
    });

    const response = await POST(new Request("http://localhost/api/coach/weekly-blocked-slots", {
      method: "POST",
      body: JSON.stringify({ weekday: 4, hour: 18, label: "大班课" }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.rule.id).toBe("rule-1");
    expect(mockedAddCoachWeeklyBlockedRule).toHaveBeenCalledWith({ weekday: 4, hour: 18, label: "大班课" });
    expect(mockedRevalidateScheduleViews).toHaveBeenCalledOnce();
  });

  it("deletes rules and refreshes schedule cache", async () => {
    mockedIsCoachAuthenticated.mockResolvedValue(true);
    mockedDeleteCoachWeeklyBlockedRule.mockResolvedValue({ deleted: true, rules: [] });

    const response = await DELETE(new Request("http://localhost/api/coach/weekly-blocked-slots/rule-1", {
      method: "DELETE",
    }), {
      params: Promise.resolve({ ruleId: "rule-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.deleted).toBe(true);
    expect(mockedDeleteCoachWeeklyBlockedRule).toHaveBeenCalledWith("rule-1");
    expect(mockedRevalidateScheduleViews).toHaveBeenCalledOnce();
  });
});
