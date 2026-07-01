import { LoadingState } from "@/components/ui/LoadingState";

export default function ParentLoading() {
  return <LoadingState title="正在打开课表..." description="请稍候，正在准备可预约时间。" />;
}
