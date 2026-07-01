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
  const buttonClass = "rounded-xl border px-4 py-2 text-sm font-medium transition";
  const activeClass = "border-gray-200 bg-white text-gray-900 shadow-sm hover:border-gray-300 hover:shadow-md";
  const disabledClass = "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300";

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {previousWeekHref ? (
          <Link className={`${buttonClass} ${activeClass}`} href={previousWeekHref}>
            &larr; 上一周
          </Link>
        ) : (
          <span className={`${buttonClass} ${disabledClass}`}>&larr; 上一周</span>
        )}

        <div className="text-center">
          <div className="text-sm text-gray-500">当前周</div>
          <div className="text-lg font-semibold text-gray-950">{weekRangeText}</div>
        </div>

        {nextWeekHref ? (
          <Link className={`${buttonClass} ${activeClass}`} href={nextWeekHref}>
            下一周 &rarr;
          </Link>
        ) : (
          <span className={`${buttonClass} ${disabledClass}`}>下一周 &rarr;</span>
        )}
      </div>
    </div>
  );
}
