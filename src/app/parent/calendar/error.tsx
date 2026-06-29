"use client";

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">预约日历暂时无法加载</h1>
      <p className="mt-3 text-gray-600">
        数据库连接暂时不可用，请稍后重试。如果你正在本地开发，请检查 `.env` 里的数据库连接。
      </p>
      {error.digest ? <p className="mt-2 text-sm text-gray-500">错误编号：{error.digest}</p> : null}
      <button className="mt-6 rounded bg-blue-600 px-4 py-2 text-white" onClick={reset} type="button">
        重新加载
      </button>
    </main>
  );
}
