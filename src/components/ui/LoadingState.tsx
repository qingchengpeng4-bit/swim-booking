export type LoadingStateVariant = "page" | "inline" | "card";

type LoadingStateProps = {
  title: string;
  description?: string;
  variant?: LoadingStateVariant;
};

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

export function LoadingDots({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-flex items-center gap-1 ${className}`}>
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}

export function LoadingState({ title, description, variant = "page" }: LoadingStateProps) {
  const sectionClass =
    variant === "page"
      ? "mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-4 py-10"
      : variant === "card"
        ? "rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-6 shadow-sm"
        : "rounded-xl border border-sky-100 bg-sky-50 px-4 py-3";

  const content = (
    <div className="flex items-center gap-4">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
        <span className="absolute h-10 w-10 animate-ping rounded-full bg-sky-200 opacity-40" />
        <LoadingSpinner className="relative" />
      </div>
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
          <span>{title}</span>
          <LoadingDots className="text-sky-500" />
        </div>
        {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
      </div>
    </div>
  );

  if (variant === "page") {
    return (
      <main className={sectionClass} aria-busy="true">
        <section className="w-full rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-6 shadow-sm">
          {content}
        </section>
      </main>
    );
  }

  return (
    <section className={sectionClass} aria-busy="true">
      {content}
    </section>
  );
}
