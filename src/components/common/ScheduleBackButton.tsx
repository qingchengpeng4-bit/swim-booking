"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingDots, LoadingSpinner } from "@/components/ui/LoadingState";

type ScheduleBackButtonProps = {
  fallbackHref: string;
  label?: string;
};

export function ScheduleBackButton({ fallbackHref, label = "返回课表" }: ScheduleBackButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function goBack() {
    if (pending) return;
    setPending(true);

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      aria-busy={pending}
      className="mb-4 inline-flex items-center gap-2 rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm font-medium text-sky-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 disabled:cursor-wait disabled:text-sky-500"
      disabled={pending}
      type="button"
      onClick={goBack}
    >
      {pending ? (
        <>
          <LoadingSpinner className="h-4 w-4" />
          <span>正在返回课表...</span>
          <LoadingDots />
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
