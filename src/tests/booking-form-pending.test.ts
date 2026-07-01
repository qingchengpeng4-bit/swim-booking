import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("parent booking flow pending feedback", () => {
  it("uses pending navigation from slot detail to the booking form", () => {
    const source = readFileSync("src/app/parent/slots/[slotId]/page.tsx", "utf8");

    expect(source).toContain("PendingNavigationLink");
    expect(source).toContain("正在打开预约表单...");
    expect(source).toContain("slot.canBook");
  });

  it("keeps booking form submit pending, success, and failure feedback", () => {
    const source = readFileSync("src/components/parent/BookingForm.tsx", "utf8");

    expect(source).toContain("aria-busy={submitting}");
    expect(source).toContain("正在提交，请不要重复点击。");
    expect(source).toContain("正在提交预约...");
    expect(source).toContain("预约失败，请重试。");
    expect(source).toContain("预约成功，正在跳转...");
    expect(source).toContain("disabled={submitting}");
    expect(source).toContain("if (submitting) return;");
  });

  it("provides a loading fallback for the my bookings redirect target", () => {
    const source = readFileSync("src/app/parent/my-bookings/loading.tsx", "utf8");

    expect(source).toContain("正在加载我的预约...");
  });
});
