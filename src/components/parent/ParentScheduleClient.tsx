"use client";

import { useEffect, useState } from "react";
import { WeeklyScheduleGrid } from "@/components/parent/WeeklyScheduleGrid";
import type { WeeklySchedule } from "@/lib/schedule";

type ParentScheduleClientProps = {
  weekStartKey: string;
};

type LoadState =
  | {
      status: "loading";
      schedule: null;
      error: null;
    }
  | {
      status: "ready";
      schedule: WeeklySchedule;
      error: null;
    }
  | {
      status: "error";
      schedule: null;
      error: string;
    };

export function ParentScheduleClient({ weekStartKey }: ParentScheduleClientProps) {
  const [retryToken, setRetryToken] = useState(0);
  const [state, setState] = useState<LoadState>({
    status: "loading",
    schedule: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadSchedule() {
      setState({ status: "loading", schedule: null, error: null });

      try {
        const response = await fetch(`/api/parent/weekly-schedule?week=${encodeURIComponent(weekStartKey)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.schedule) {
          throw new Error(data?.error || "课表加载失败，请重试。");
        }

        setState({ status: "ready", schedule: data.schedule, error: null });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          schedule: null,
          error: error instanceof Error ? error.message : "课表加载失败，请重试。",
        });
      }
    }

    loadSchedule();

    return () => controller.abort();
  }, [weekStartKey, retryToken]);

  if (state.status === "loading") {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
        课表加载中，请稍候...
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="rounded-lg border border-red-100 bg-red-50 p-6 text-sm text-red-900">
        <p>{state.error}</p>
        <button
          className="mt-3 rounded border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-900"
          type="button"
          onClick={() => setRetryToken((current) => current + 1)}
        >
          重试
        </button>
      </section>
    );
  }

  return <WeeklyScheduleGrid schedule={state.schedule} />;
}
