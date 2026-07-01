"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearBrowserScheduleCache } from "@/lib/browser-schedule-cache";

export function CoachCancelButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function cancelBooking() {
    setError("");
    setSubmitting(true);
    const response = await fetch("/api/coach/bookings/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId,
        reason: "教练手动取消",
      }),
    });
    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "取消失败");
      return;
    }

    clearBrowserScheduleCache();
    router.refresh();
  }

  return (
    <div>
      {error ? <p className="mb-2 text-sm text-red-700">{error}</p> : null}
      <button className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 disabled:text-gray-400" disabled={submitting} onClick={cancelBooking} type="button">
        {submitting ? "取消中..." : "教练取消"}
      </button>
    </div>
  );
}
