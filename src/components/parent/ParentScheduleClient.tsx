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

function LoadingSkeleton() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded bg-gray-200" />
          <div className="h-4 w-16 rounded bg-gray-200" />
          <div className="h-4 w-16 rounded bg-gray-200" />
        </div>
        <div className="mt-4 grid grid-cols-8 gap-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-100" />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center">
          <div className="h-4 w-40 rounded bg-sky-100" />
        </div>
      </div>
    </section>
  );
}

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
    return <LoadingSkeleton />;
  }

  if (state.status === "error") {
    return (
      <section className="rounded-xl border border-rose-100 bg-rose-50 p-8 text-center text-sm">
        <p className="text-rose-800">{state.error}</p>
        <button
          className="mt-4 rounded-lg border border-rose-200 bg-white px-5 py-2 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-50"
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
