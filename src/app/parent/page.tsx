import { ParentSchedulePage } from "@/components/parent/ParentSchedulePage";

export const dynamic = "force-dynamic";

type ParentPageProps = {
  searchParams: Promise<{
    week?: string;
  }>;
};

export default async function ParentPage({ searchParams }: ParentPageProps) {
  const { week } = await searchParams;
  return <ParentSchedulePage week={week} />;
}
