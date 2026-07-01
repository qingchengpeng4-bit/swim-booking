import { PendingNavigationLink } from "@/components/common/PendingNavigationLink";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">公网测试版 v0.1.1</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-950">游泳课预约系统</h1>
        <p className="mt-3 text-gray-600">请选择你的身份进入对应页面。</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <PendingNavigationLink
            className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-center font-semibold text-green-900"
            href="/parent"
            pendingLabel="正在打开课表..."
          >
            家长预约课程
          </PendingNavigationLink>
          <PendingNavigationLink
            className="rounded-lg border border-gray-300 bg-white px-4 py-4 text-center font-semibold text-gray-900"
            href="/coach"
            pendingLabel="正在打开教练后台..."
          >
            教练进入后台
          </PendingNavigationLink>
        </div>
      </div>
    </main>
  );
}
