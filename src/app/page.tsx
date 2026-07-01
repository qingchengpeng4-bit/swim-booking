import { PendingNavigationLink } from "@/components/common/PendingNavigationLink";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-sky-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-950">游泳课程预约系统</h1>
          <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300" />
          <p className="mt-4 text-base text-gray-600">查看可约时间，快速提交课程预约</p>
        </div>

        {/* Entry cards */}
        <div className="mt-10 space-y-4">
          {/* Parent entry - primary */}
          <PendingNavigationLink
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-sky-200 bg-gradient-to-b from-sky-50 to-white px-6 py-7 text-center shadow-sm transition hover:border-sky-400 hover:shadow-md active:scale-[0.99]"
            href="/parent"
            pendingLabel="正在打开课表..."
          >
            <span className="text-lg font-semibold text-sky-900">家长预约课程</span>
            <span className="mt-1.5 text-sm text-sky-600">查询课表 &middot; 提交预约 &middot; 查看记录</span>
          </PendingNavigationLink>

          {/* Coach entry - secondary */}
          <PendingNavigationLink
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-5 text-center shadow-sm transition hover:border-gray-300 hover:shadow-md active:scale-[0.99]"
            href="/coach"
            pendingLabel="正在打开教练后台..."
          >
            <span className="text-base font-semibold text-gray-800">教练进入后台</span>
            <span className="mt-1 text-sm text-gray-500">管理课程 &middot; 查看预约</span>
          </PendingNavigationLink>
        </div>

        {/* Version */}
        <p className="mt-10 text-center text-xs text-gray-400">公网测试版 v0.1.1</p>
      </div>
    </main>
  );
}
