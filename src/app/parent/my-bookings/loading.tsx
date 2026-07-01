import { LoadingState } from "@/components/ui/LoadingState";

export default function ParentMyBookingsLoading() {
  return <LoadingState title="正在加载我的预约..." description="请稍候，正在查询预约记录。" />;
}
