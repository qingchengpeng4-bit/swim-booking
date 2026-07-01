"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingDots, LoadingSpinner } from "@/components/ui/LoadingState";

type CourseTypeValue = "ONE_TO_ONE" | "ONE_TO_TWO" | "ONE_TO_THREE";

const COURSE_LABELS: Record<CourseTypeValue, string> = {
  ONE_TO_ONE: "1v1",
  ONE_TO_TWO: "1v2",
  ONE_TO_THREE: "1v3",
};

type CoachManualBookingFormProps = {
  slotId: string;
  lockedCourseType: CourseTypeValue | null;
};

export function CoachManualBookingForm({ slotId, lockedCourseType }: CoachManualBookingFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [courseType, setCourseType] = useState<CourseTypeValue>(lockedCourseType ?? "ONE_TO_ONE");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || success) return;

    setError("");
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/coach/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId,
          studentName: formData.get("studentName"),
          contactPhone: formData.get("contactPhone") ?? "",
          courseType,
          remark: formData.get("remark") ?? "",
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setSubmitting(false);
        setError(data?.error ?? "添加失败，请重试。");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/coach/slots/${slotId}`);
        router.refresh();
      }, 800);
    } catch {
      setSubmitting(false);
      setError("添加失败，请重试。");
    }
  }

  const isDisabled = submitting || success;
  const inputClass = "mt-1 w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500";

  return (
    <form aria-busy={isDisabled} className="space-y-4 rounded border border-gray-200 bg-white p-4" onSubmit={onSubmit}>
      {error ? <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {success ? (
        <p className="flex items-center gap-2 rounded bg-green-50 p-3 text-sm text-green-700">
          <LoadingSpinner className="text-green-600" />
          <span>添加成功，正在跳转...</span>
          <LoadingDots />
        </p>
      ) : null}
      {submitting && !success ? (
        <p className="flex items-center gap-2 rounded bg-blue-50 p-3 text-sm text-blue-700">
          <LoadingSpinner className="text-blue-600" />
          <span>正在添加，请不要重复点击。</span>
          <LoadingDots />
        </p>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium">学员姓名</span>
        <input className={inputClass} disabled={isDisabled} name="studentName" required />
      </label>

      <label className="block">
        <span className="text-sm font-medium">联系方式（可选）</span>
        <input className={inputClass} disabled={isDisabled} name="contactPhone" />
      </label>

      <label className="block">
        <span className="text-sm font-medium">课程类型</span>
        {lockedCourseType ? (
          <p className="mt-1 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">当前课型：{COURSE_LABELS[lockedCourseType]}</p>
        ) : null}
        <select
          className={inputClass}
          disabled={Boolean(lockedCourseType) || isDisabled}
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
        <span className="text-sm font-medium">备注（可选）</span>
        <textarea className={inputClass} disabled={isDisabled} name="remark" rows={3} />
      </label>

      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-3 text-white disabled:bg-gray-400"
        disabled={isDisabled}
        type="submit"
      >
        {submitting && !success ? (
          <>
            <LoadingSpinner className="h-4 w-4" />
            <span>正在添加预约...</span>
          </>
        ) : success ? (
          <>
            <LoadingSpinner className="h-4 w-4" />
            <span>添加成功，正在跳转...</span>
          </>
        ) : (
          "添加预约"
        )}
      </button>
    </form>
  );
}
