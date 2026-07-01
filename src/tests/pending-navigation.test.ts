import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("parent pending navigation feedback", () => {
  it("uses instant pending feedback for the parent entry and bookable schedule cells", () => {
    const homeSource = readFileSync("src/app/page.tsx", "utf8");
    const gridSource = readFileSync("src/components/parent/WeeklyScheduleGrid.tsx", "utf8");
    const pendingLinkSource = readFileSync("src/components/common/PendingNavigationLink.tsx", "utf8");

    expect(homeSource).toContain("PendingNavigationLink");
    expect(homeSource).toContain("正在打开课表...");
    expect(gridSource).toContain("PendingNavigationLink");
    expect(gridSource).toContain('cell.tone === "green"');
    expect(gridSource).toContain("正在进入预约页...");
    expect(pendingLinkSource).toContain("LoadingSpinner");
    expect(pendingLinkSource).toContain("LoadingDots");
    expect(pendingLinkSource).toContain("aria-busy");
    expect(pendingLinkSource).toContain("aria-disabled");
    expect(pendingLinkSource).toContain("event.preventDefault()");
  });

  it("provides animated route-level loading fallbacks for parent navigation", () => {
    expect(readFileSync("src/app/parent/loading.tsx", "utf8")).toContain("正在打开课表...");
    expect(readFileSync("src/app/parent/calendar/loading.tsx", "utf8")).toContain("正在加载课表...");
    expect(readFileSync("src/app/parent/slots/[slotId]/loading.tsx", "utf8")).toContain("正在打开课程详情...");
    expect(readFileSync("src/app/parent/slots/[slotId]/book/loading.tsx", "utf8")).toContain("正在打开预约表单...");
    const loadingSource = readFileSync("src/components/ui/LoadingState.tsx", "utf8");

    expect(loadingSource).toContain("CutePenguinLoading");
    expect(loadingSource).toContain("viewBox=\"0 0 120 120\"");
    expect(loadingSource).toContain("animate-bounce");
    expect(loadingSource).toContain("animate-pulse");
    expect(loadingSource).toContain("LoadingSpinner");
  });
});
