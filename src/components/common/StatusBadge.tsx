type StatusBadgeProps = {
  text: string;
};

function badgeColor(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("满") || lower.includes("关闭") || lower.includes("取消") || lower.includes("已满")) {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (lower.includes("可预约") || lower.includes("空闲") || lower.includes("未满") || lower.includes("有效")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (lower.includes("课型") || lower.includes("人数") || lower.includes("剩余") || lower.includes("1v")) {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  return "border-gray-200 bg-gray-50 text-gray-700";
}

export function StatusBadge({ text }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeColor(text)}`}>
      {text}
    </span>
  );
}
