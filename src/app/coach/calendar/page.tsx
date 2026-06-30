import { redirect } from "next/navigation";
import { CoachSchedulePage } from "@/components/coach/CoachSchedulePage";
import { isCoachAuthenticated } from "@/lib/coach-auth";

export const dynamic = "force-dynamic";

type CoachCalendarPageProps = {
  searchParams: Promise<{
    week?: string;
  }>;
};

export default async function CoachCalendarPage({ searchParams }: CoachCalendarPageProps) {
  if (!(await isCoachAuthenticated())) {
    redirect("/coach/login");
  }

  const { week } = await searchParams;
  return <CoachSchedulePage week={week} />;
}
