import { LoadingState } from "@/components/ui/LoadingState";

export default function CoachCalendarLoading() {
  return <LoadingState title="正在加载教练课表..." description="请稍候，正在同步本周预约状态。" />;
}
