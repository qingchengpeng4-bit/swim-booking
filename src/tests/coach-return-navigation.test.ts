import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("coach return-to-schedule navigation", () => {
  it("uses explicit coach calendar href instead of history back for return schedule", () => {
    const detailPage = readFileSync("src/app/coach/slots/[slotId]/page.tsx", "utf8");
    const addBookingPage = readFileSync("src/app/coach/slots/[slotId]/book/page.tsx", "utf8");
    const form = readFileSync("src/components/coach/CoachManualBookingForm.tsx", "utf8");
    const schedule = readFileSync("src/lib/coach-schedule.ts", "utf8");

    expect(schedule).toContain("returnTo=${encodeURIComponent(returnTo)}");
    expect(schedule).toContain("/coach/calendar?week=");
    expect(detailPage).toContain("useHistory={false}");
    expect(detailPage).toContain("getCoachCalendarReturnTo");
    expect(detailPage).toContain("returnTo=${encodeURIComponent(scheduleHref)}");
    expect(addBookingPage).toContain("returnTo=${encodeURIComponent(scheduleHref)}");
    expect(addBookingPage).toContain("returnTo={scheduleHref}");
    expect(form).toContain("returnTo?: string");
    expect(form).toContain("returnTo=${encodeURIComponent(returnTo)}");
  });
});
