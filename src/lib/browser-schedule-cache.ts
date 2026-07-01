export const BROWSER_SCHEDULE_CACHE_TTL_MS = 2 * 60 * 1000;

export type BrowserScheduleCacheScope = "parent" | "coach";

type ScheduleCacheEnvelope<T> = {
  data: T;
  savedAt: number;
};

export function getBrowserScheduleCacheKey(scope: BrowserScheduleCacheScope, weekStartKey: string) {
  return `${scope}-weekly-schedule:${weekStartKey}`;
}

function getSessionStorage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function readBrowserScheduleCache<T>(scope: BrowserScheduleCacheScope, weekStartKey: string, now = Date.now()) {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(getBrowserScheduleCacheKey(scope, weekStartKey));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ScheduleCacheEnvelope<T>;
    if (!parsed?.data || typeof parsed.savedAt !== "number") return null;
    if (now - parsed.savedAt > BROWSER_SCHEDULE_CACHE_TTL_MS) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function writeBrowserScheduleCache<T>(scope: BrowserScheduleCacheScope, weekStartKey: string, data: T, now = Date.now()) {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(
      getBrowserScheduleCacheKey(scope, weekStartKey),
      JSON.stringify({
        data,
        savedAt: now,
      } satisfies ScheduleCacheEnvelope<T>),
    );
  } catch {
    // Browser storage can be unavailable or full. Schedule rendering should still work.
  }
}

export function clearBrowserScheduleCache(scope?: BrowserScheduleCacheScope) {
  const storage = getSessionStorage();
  if (!storage) return;

  const prefixes = scope ? [`${scope}-weekly-schedule:`] : ["parent-weekly-schedule:", "coach-weekly-schedule:"];

  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
        storage.removeItem(key);
      }
    }
  } catch {
    // Cache cleanup is best-effort and must not block booking actions.
  }
}
