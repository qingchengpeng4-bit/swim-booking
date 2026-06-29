"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [courseType, setCourseType] = useState<CourseTypeValue>(
    lockedCourseType ?? "ONE_TO_ONE",
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
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

    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "预约失败");
      return;
    }

    router.push(`/parent/my-bookings?contactPhone=${encodeURIComponent(String(formData.get("contactPhone") ?? ""))}`);
    router.refresh();
  }

  return (
    <form className="space-y-4 rounded border border-gray-200 bg-white p-4" onSubmit={onSubmit}>
      {error ? <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <label className="block">
        <span className="text-sm font-medium">学员姓名（请填写大名）</span>
        <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2" name="studentName" required />
      </label>

      <label className="block">
        <span className="text-sm font-medium">家长手机号</span>
        <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2" name="contactPhone" inputMode="numeric" required />
      </label>

      <label className="block">
        <span className="text-sm font-medium">课程类型</span>
        <select
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          disabled={Boolean(lockedCourseType)}
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
        <textarea className="mt-1 w-full rounded border border-gray-300 px-3 py-2" name="remark" rows={3} />
      </label>

      <button className="w-full rounded bg-blue-600 px-4 py-3 text-white disabled:bg-gray-400" disabled={submitting} type="submit">
        {submitting ? "提交中..." : "提交预约"}
      </button>
    </form>
  );
}
