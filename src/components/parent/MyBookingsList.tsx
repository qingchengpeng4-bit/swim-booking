"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { clearBrowserScheduleCache } from "@/lib/browser-schedule-cache";

type CourseTypeValue = "ONE_TO_ONE" | "ONE_TO_TWO" | "ONE_TO_THREE";

const COURSE_LABELS: Record<CourseTypeValue, string> = {
  ONE_TO_ONE: "1v1",
  ONE_TO_TWO: "1v2",
  ONE_TO_THREE: "1v3",
};

type BookingItem = {
  id: string;
  studentName: string;
  courseType: CourseTypeValue;
  status: string;
  startAt: string;
  canCancel: boolean;
  cancelHint: string | null;
};

export function MyBookingsList({ initialBookings }: { initialBookings: BookingItem[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const contactPhone = params.get("contactPhone") ?? "";
  const [error, setError] = useState("");

  async function cancelParentBooking(bookingId: string) {
    setError("");
    const response = await fetch("/api/parent/bookings/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId, contactPhone }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "取消失败");
      return;
    }

    clearBrowserScheduleCache("parent");
    router.refresh();
  }

  if (!contactPhone) {
    return null;
  }

  return (
    <div className="mt-6">
      {error ? (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
          <span className="mt-0.5 h-4 w-0.5 shrink-0 rounded bg-rose-400" />
          <span>{error}</span>
        </div>
      ) : null}
      {initialBookings.length === 0 ? (
        <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-6 text-center text-sm text-sky-800">
          没有查到预约记录。
        </div>
      ) : (
        <div className="space-y-3">
          {initialBookings.map((booking) => (
            <article key={booking.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-base font-semibold text-gray-950">
                    {new Date(booking.startAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                  </div>
                </div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    booking.status === "ACTIVE"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  {booking.status === "ACTIVE" ? "有效" : "已取消"}
                </span>
              </div>
              <div className="mt-3 grid gap-1.5 text-sm text-gray-700">
                <div>
                  <span className="text-gray-500">学员：</span>
                  {booking.studentName}
                </div>
                <div>
                  <span className="text-gray-500">课型：</span>
                  {COURSE_LABELS[booking.courseType]}
                </div>
              </div>
              {booking.cancelHint ? (
                <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
                  {booking.cancelHint}
                </div>
              ) : null}
              {booking.canCancel ? (
                <button
                  className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-[0.98]"
                  onClick={() => cancelParentBooking(booking.id)}
                  type="button"
                >
                  取消预约
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
