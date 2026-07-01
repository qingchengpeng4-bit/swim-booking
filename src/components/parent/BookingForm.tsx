"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingDots, LoadingSpinner } from "@/components/ui/LoadingState";
import { clearBrowserScheduleCache } from "@/lib/browser-schedule-cache";

type CourseTypeValue = "ONE_TO_ONE" | "ONE_TO_TWO" | "ONE_TO_THREE";

const COURSE_LABELS: Record<CourseTypeValue, string> = {
  ONE_TO_ONE: "1v1",
  ONE_TO_TWO: "1v2",
  ONE_TO_THREE: "1v3",
};

type BookingFormProps = {
  slotId: string;
  lockedCourseType: CourseTypeValue | null;
};

export function BookingForm({ slotId, lockedCourseType }: BookingFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [courseType, setCourseType] = useState<CourseTypeValue>(lockedCourseType ?? "ONE_TO_ONE");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setSuccessMessage("");
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/parent/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId,
          studentName: formData.get("studentName"),
          contactPhone: formData.get("contactPhone"),
          courseType,
          remark: formData.get("remark") ?? "",
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "预约失败，请重试。");
        setSubmitting(false);
        return;
      }

      clearBrowserScheduleCache("parent");
      setSuccessMessage("预约成功，正在跳转...");
      router.push(`/parent/my-bookings?contactPhone=${encodeURIComponent(String(formData.get("contactPhone") ?? ""))}`);
      router.refresh();
    } catch {
      setError("预约失败，请重试。");
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:bg-gray-100 disabled:text-gray-500";

  return (
    <form aria-busy={submitting} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm" onSubmit={onSubmit}>
      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <span className="mt-0.5 h-4 w-0.5 shrink-0 rounded bg-red-400" />
          <span>{error}</span>
        </div>
      ) : null}
      {successMessage ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
          <LoadingSpinner className="shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
          <LoadingDots />
        </div>
      ) : null}
      {submitting && !successMessage ? (
        <div className="flex items-center gap-3 rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800">
          <LoadingSpinner className="shrink-0 text-sky-600" />
          <span>正在提交，请不要重复点击</span>
          <LoadingDots />
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-gray-700">学员姓名（请填写大名）</span>
        <input className={inputClass} disabled={submitting} name="studentName" placeholder="例如：张三" required />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">家长手机号</span>
        <input
          className={inputClass}
          disabled={submitting}
          inputMode="numeric"
          name="contactPhone"
          placeholder="用于查询和取消预约"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">课程类型</span>
        <select
          className={inputClass}
          disabled={Boolean(lockedCourseType) || submitting}
          value={courseType}
          onChange={(event) => setCourseType(event.target.value as CourseTypeValue)}
        >
          {(Object.keys(COURSE_LABELS) as CourseTypeValue[]).map((type) => (
            <option key={type} value={type}>
              {COURSE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">备注（可选）</span>
        <textarea className={inputClass} disabled={submitting} name="remark" placeholder="如有特殊需求可在此备注" rows={3} />
      </label>

      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-cyan-600 hover:shadow-md active:scale-[0.98] disabled:bg-gradient-to-r disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
        disabled={submitting}
        type="submit"
      >
        {submitting ? (
          <>
            <LoadingSpinner className="h-4 w-4" />
            <span>正在提交预约...</span>
          </>
        ) : (
          "提交预约"
        )}
      </button>
    </form>
  );
}
