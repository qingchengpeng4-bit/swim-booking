const SHANGHAI_TIME_ZONE = "Asia/Shanghai";

function shanghaiDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isSameShanghaiDate(dateA: Date, dateB: Date) {
  return shanghaiDateKey(dateA) === shanghaiDateKey(dateB);
}

export function isTodayInShanghai(date: Date, now = new Date()) {
  return isSameShanghaiDate(date, now);
}

export function isPastSlot(endAt: Date, now = new Date()) {
  return endAt.getTime() <= now.getTime();
}

export function formatShanghaiDateTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: SHANGHAI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
