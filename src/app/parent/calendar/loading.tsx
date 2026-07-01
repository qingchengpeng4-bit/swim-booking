import { LoadingState } from "@/components/ui/LoadingState";

export default function ParentCalendarLoading() {
  return <LoadingState title="正在加载课表..." description="请稍候，正在同步最新预约状态。" />;
}
