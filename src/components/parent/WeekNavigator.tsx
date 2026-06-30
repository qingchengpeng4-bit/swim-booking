import Link from "next/link";

type WeekNavigatorProps = {
  weekRangeText: string;
  previousWeekHref: string | null;
  nextWeekHref: string | null;
};

export function WeekNavigator({
  weekRangeText,
  previousWeekHref,
  nextWeekHref,
}: WeekNavigatorProps) {
  const buttonClass = "rounded border px-3 py-2 text-sm font-medium";
  const activeClass = "border-gray-300 bg-white text-gray-900";
  const disabledClass = "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400";

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        {previousWeekHref ? (
          <Link className={`${buttonClass} ${activeClass}`} href={previousWeekHref}>
            上一周
          </Link>
        ) : (
          <span className={`${buttonClass} ${disabledClass}`}>上一周</span>
        )}

        <div className="text-center">
          <div className="text-sm text-gray-500">当前周</div>
          <div className="text-lg font-semibold text-gray-950">{weekRangeText}</div>
        </div>

        {nextWeekHref ? (
          <Link className={`${buttonClass} ${activeClass}`} href={nextWeekHref}>
            下一周
          </Link>
        ) : (
          <span className={`${buttonClass} ${disabledClass}`}>下一周</span>
        )}
      </div>
    </div>
  );
}
