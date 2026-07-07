import { describe, expect, it } from "vitest";
import {
  findWeeklyBlockedRuleForSlot,
  validateWeeklyBlockedSlotInput,
} from "@/services/weekly-blocked-slots.service";

function shanghaiDateAt(dateOnly: string, hour: number) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 8, 0, 0));
}

describe("weekly blocked slot rules", () => {
  it("matches a custom weekly rule by Shanghai weekday and hour", () => {
    const rule = {
      id: "rule-1",
      weekday: 4,
      hour: 18,
      label: "大班课",
      createdAt: "2026-07-01T00:00:00.000Z",
    };

    expect(findWeeklyBlockedRuleForSlot([rule], shanghaiDateAt("2026-07-09", 18))).toEqual(rule);
    expect(findWeeklyBlockedRuleForSlot([rule], shanghaiDateAt("2026-07-09", 19))).toBeNull();
  });

  it("validates weekday, schedule hour, and label", () => {
    expect(validateWeeklyBlockedSlotInput({ weekday: 4, hour: 18, label: " 大班课 " })).toEqual({
      weekday: 4,
      hour: 18,
      label: "大班课",
    });

    expect(() => validateWeeklyBlockedSlotInput({ weekday: 0, hour: 18, label: "大班课" })).toThrow("请选择星期。");
    expect(() => validateWeeklyBlockedSlotInput({ weekday: 4, hour: 11, label: "大班课" })).toThrow("请选择有效时间段。");
    expect(() => validateWeeklyBlockedSlotInput({ weekday: 4, hour: 18, label: " " })).toThrow("请填写名称。");
    expect(() => validateWeeklyBlockedSlotInput({ weekday: 4, hour: 18, label: "一二三四五六七八九十一二三四五六七八九十一" })).toThrow("名称不能超过 20 个字符。");
  });
});
