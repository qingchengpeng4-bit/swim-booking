"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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

  async function cancelBooking(bookingId: string) {
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

    router.refresh();
  }

  if (!contactPhone) {
    return null;
  }

  return (
    <div className="mt-6">
      {error ? <p className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {initialBookings.length === 0 ? (
        <p className="rounded bg-white p-4 text-gray-600">没有查到预约记录。</p>
      ) : (
        <div className="space-y-3">
          {initialBookings.map((booking) => (
            <article key={booking.id} className="rounded border border-gray-200 bg-white p-4">
              <div className="font-medium">{new Date(booking.startAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</div>
              <div className="mt-2 text-sm text-gray-700">学员：{booking.studentName}</div>
              <div className="mt-1 text-sm text-gray-700">课型：{COURSE_LABELS[booking.courseType]}</div>
              <div className="mt-1 text-sm text-gray-700">状态：{booking.status === "ACTIVE" ? "有效" : "已取消"}</div>
              {booking.cancelHint ? <p className="mt-2 text-sm text-amber-700">{booking.cancelHint}</p> : null}
              {booking.canCancel ? (
                <button className="mt-3 rounded border border-red-300 px-3 py-2 text-sm text-red-700" onClick={() => cancelBooking(booking.id)} type="button">
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
