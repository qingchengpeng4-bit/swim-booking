import { LoadingState } from "@/components/ui/LoadingState";

export default function ParentSlotBookLoading() {
  return <LoadingState title="正在打开预约表单..." description="请稍候，马上可以填写学员信息。" />;
}
