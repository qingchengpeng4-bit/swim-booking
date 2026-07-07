"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearBrowserScheduleCache } from "@/lib/browser-schedule-cache";
import { SCHEDULE_HOURS } from "@/lib/schedule";

type SystemWeeklyBlockedSlot = {
  weekday: number;
  hour: number;
  label: string;
};

type WeeklyBlockedSlotRule = SystemWeeklyBlockedSlot & {
  id: string;
  createdAt: string;
};

type WeeklyBlockedSlotsPanelProps = {
  systemRules: SystemWeeklyBlockedSlot[];
  customRules: WeeklyBlockedSlotRule[];
};

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

function getWeekdayText(weekday: number) {
  return ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"][weekday] ?? "未知";
}

function getHourRangeText(hour: number) {
  return `${String(hour).padStart(2, "0")}:00-${String(hour + 1).padStart(2, "0")}:00`;
}

export function WeeklyBlockedSlotsPanel({ systemRules, customRules }: WeeklyBlockedSlotsPanelProps) {
  const router = useRouter();
  const [rules, setRules] = useState(customRules);
  const [weekday, setWeekday] = useState("1");
  const [hour, setHour] = useState(String(SCHEDULE_HOURS[0]));
  const [label, setLabel] = useState("大班课");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  async function addRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/coach/weekly-blocked-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weekday: Number(weekday),
          hour: Number(hour),
          label,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "添加失败，请重试。");
        return;
      }

      setRules((current) => [...current, data.rule]);
      clearBrowserScheduleCache();
      router.refresh();
    } catch {
      setError("添加失败，请重试。");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteRule(ruleId: string) {
    if (!window.confirm("确认删除这个固定不可预约时间吗？")) return;

    setError("");
    try {
      const response = await fetch(`/api/coach/weekly-blocked-slots/${ruleId}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "删除失败，请重试。");
        return;
      }

      setRules((current) => current.filter((rule) => rule.id !== ruleId));
      clearBrowserScheduleCache();
      router.refresh();
    } catch {
      setError("删除失败，请重试。");
    }
  }

  return (
    <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <h2 className="text-base font-semibold text-gray-950">固定不可预约时间</h2>
        <span className="text-lg font-semibold text-gray-500" aria-hidden="true">
          {isExpanded ? "⌃" : "⌄"}
        </span>
      </button>

      {isExpanded ? (
        <>
          <p className="mt-1 text-sm text-gray-600">系统固定时间只展示；自定义时间可新增或删除。</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <h3 className="text-sm font-semibold text-gray-900">系统固定时间</h3>
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                {systemRules.map((rule) => (
                  <li key={`${rule.weekday}-${rule.hour}`} className="rounded bg-white px-3 py-2">
                    {getWeekdayText(rule.weekday)} {getHourRangeText(rule.hour)} {rule.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
              <h3 className="text-sm font-semibold text-gray-900">自定义固定不可预约时间</h3>
              {rules.length === 0 ? (
                <p className="mt-2 rounded bg-white px-3 py-2 text-sm text-gray-500">暂无自定义规则。</p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  {rules.map((rule) => (
                    <li key={rule.id} className="flex items-center justify-between gap-2 rounded bg-white px-3 py-2">
                      <span>
                        {getWeekdayText(rule.weekday)} {getHourRangeText(rule.hour)} {rule.label}
                      </span>
                      <button
                        className="rounded border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                        type="button"
                        onClick={() => deleteRule(rule.id)}
                      >
                        删除
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <form className="mt-4 grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={addRule}>
            <label className="text-sm">
              <span className="font-medium text-gray-700">星期</span>
              <select className="mt-1 w-full rounded border border-gray-300 px-3 py-2" value={weekday} onChange={(event) => setWeekday(event.target.value)}>
                {WEEKDAYS.map((day) => (
                  <option key={day} value={day}>
                    {getWeekdayText(day)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="font-medium text-gray-700">时间段</span>
              <select className="mt-1 w-full rounded border border-gray-300 px-3 py-2" value={hour} onChange={(event) => setHour(event.target.value)}>
                {SCHEDULE_HOURS.map((item) => (
                  <option key={item} value={item}>
                    {getHourRangeText(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="font-medium text-gray-700">名称</span>
              <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2" maxLength={20} value={label} onChange={(event) => setLabel(event.target.value)} />
            </label>
            <button className="self-end rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300" disabled={submitting} type="submit">
              {submitting ? "添加中..." : "添加"}
            </button>
          </form>

          {error ? <p className="mt-3 rounded border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        </>
      ) : null}
    </section>
  );
}
