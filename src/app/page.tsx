import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">游泳课预约系统 v0.1</h1>
      <p className="mt-3 text-gray-600">
        当前版本用于验证 1v1 / 1v2 / 1v3 预约、课型锁定、容量判断和取消规则。
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link className="rounded bg-blue-600 px-4 py-3 text-center text-white" href="/parent/calendar">
          查看可预约时间
        </Link>
        <Link className="rounded border border-gray-300 bg-white px-4 py-3 text-center" href="/parent/my-bookings">
          我的预约
        </Link>
      </div>
    </main>
  );
}
