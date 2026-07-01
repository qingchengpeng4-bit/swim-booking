import { LoadingState } from "@/components/ui/LoadingState";

export default function CoachSlotLoading() {
  return <LoadingState title="正在打开课程详情..." description="请稍候，正在读取完整预约信息。" />;
}
