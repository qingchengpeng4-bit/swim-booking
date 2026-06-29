import { redirect } from "next/navigation";
import { CoachLoginForm } from "@/components/coach/CoachLoginForm";
import { PageHeader } from "@/components/common/PageHeader";
import { isCoachAuthenticated } from "@/lib/coach-auth";

export const dynamic = "force-dynamic";

export default async function CoachLoginPage() {
  if (await isCoachAuthenticated()) {
    redirect("/coach/dashboard");
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <PageHeader title="教练登录" description="请输入教练后台密码。" />
      <CoachLoginForm />
    </main>
  );
}
