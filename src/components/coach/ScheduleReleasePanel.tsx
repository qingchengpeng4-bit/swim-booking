"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearBrowserScheduleCache } from "@/lib/browser-schedule-cache";

type ScheduleReleasePanelProps = {
  releasedUntil: string | null;
  nextReleaseUntil: string | null;
};

export function ScheduleReleasePanel({ releasedUntil, nextReleaseUntil }: ScheduleReleasePanelProps) {
  const router = useRouter();
  const [currentReleasedUntil, setCurrentReleasedUntil] = useState(releasedUntil);
  const [nextTargetDate, setNextTargetDate] = useState(nextReleaseUntil);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function releaseNextWindow() {
    if (submitting || !nextTargetDate) return;
    const confirmed = window.confirm(`确认开放家长课表至 ${nextTargetDate} 吗？`);
    if (!confirmed) return;

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/coach/schedule-release", {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "开放失败，请重试。");
        setSubmitting(false);
        return;
      }

      setCurrentReleasedUntil(data.releasedUntil);
      setNextTargetDate(data.nextReleaseUntil ?? null);
      clearBrowserScheduleCache();
      router.refresh();
    } catch {
      setError("开放失败，请重试。");
    } finally {
      setSubmitting(false);
    }
  }

  const buttonText = currentReleasedUntil ? "继续开放后两周" : "开放本周和下周";

  return (
    <section className="mt-4 rounded-xl border border-sky-100 bg-sky-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sky-950">
            {currentReleasedUntil
              ? `当前家长课表已开放到：${currentReleasedUntil}`
              : "当前家长课表尚未开放"}
          </p>
          <p className="mt-1 text-sm text-sky-700">
            {nextTargetDate ? `点击后将开放至：${nextTargetDate}` : "当前没有可继续开放的课表。"}
          </p>
          <p className="mt-1 text-xs text-sky-700">
            教练确认课表后，再开放给家长预约。
          </p>
        </div>
        <button
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:bg-gray-300"
          disabled={submitting || !nextTargetDate}
          type="button"
          onClick={releaseNextWindow}
        >
          {submitting ? "正在开放..." : buttonText}
        </button>
      </div>
      {error ? <p className="mt-3 rounded-lg border border-rose-100 bg-white px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
