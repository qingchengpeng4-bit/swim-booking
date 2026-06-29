type StatusBadgeProps = {
  text: string;
};

export function StatusBadge({ text }: StatusBadgeProps) {
  return (
    <span className="inline-flex rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700">
      {text}
    </span>
  );
}
