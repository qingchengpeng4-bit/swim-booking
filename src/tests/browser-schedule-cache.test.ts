import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BROWSER_SCHEDULE_CACHE_TTL_MS,
  clearBrowserScheduleCache,
  getBrowserScheduleCacheKey,
  readBrowserScheduleCache,
  writeBrowserScheduleCache,
} from "@/lib/browser-schedule-cache";

function createSessionStorage() {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    key: (index: number) => Array.from(values.keys())[index] ?? null,
  };
}

describe("browser schedule cache", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores parent and coach weekly schedules by week key", () => {
    const sessionStorage = createSessionStorage();
    vi.stubGlobal("window", { sessionStorage });

    writeBrowserScheduleCache("parent", "2026-07-06", { rows: ["parent"] }, 1000);
    writeBrowserScheduleCache("coach", "2026-07-06", { rows: ["coach"] }, 1000);

    expect(getBrowserScheduleCacheKey("parent", "2026-07-06")).toBe("parent-weekly-schedule:2026-07-06");
    expect(readBrowserScheduleCache<{ rows: string[] }>("parent", "2026-07-06", 1000)?.data.rows).toEqual(["parent"]);
    expect(readBrowserScheduleCache<{ rows: string[] }>("coach", "2026-07-06", 1000)?.data.rows).toEqual(["coach"]);
  });

  it("expires stale cached schedules after two minutes", () => {
    const sessionStorage = createSessionStorage();
    vi.stubGlobal("window", { sessionStorage });

    writeBrowserScheduleCache("parent", "2026-07-06", { ok: true }, 1000);

    expect(readBrowserScheduleCache("parent", "2026-07-06", 1000 + BROWSER_SCHEDULE_CACHE_TTL_MS)).not.toBeNull();
    expect(readBrowserScheduleCache("parent", "2026-07-06", 1001 + BROWSER_SCHEDULE_CACHE_TTL_MS)).toBeNull();
  });

  it("clears schedule caches without touching unrelated session storage", () => {
    const sessionStorage = createSessionStorage();
    vi.stubGlobal("window", { sessionStorage });

    writeBrowserScheduleCache("parent", "2026-07-06", { ok: true }, 1000);
    writeBrowserScheduleCache("coach", "2026-07-06", { ok: true }, 1000);
    sessionStorage.setItem("other-key", "keep");

    clearBrowserScheduleCache();

    expect(readBrowserScheduleCache("parent", "2026-07-06", 1000)).toBeNull();
    expect(readBrowserScheduleCache("coach", "2026-07-06", 1000)).toBeNull();
    expect(sessionStorage.getItem("other-key")).toBe("keep");
  });
});
