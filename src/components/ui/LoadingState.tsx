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

export function CutePenguinLoading({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mx-auto flex h-28 w-28 items-center justify-center ${className}`} aria-hidden="true">
      <span className="absolute bottom-1 h-3 w-16 animate-pulse rounded-full bg-slate-300/40 [animation-duration:2s]" />
      <span className="absolute left-4 top-5 h-2 w-2 animate-bounce rounded-full bg-sky-300/70 [animation-delay:-0.25s]" />
      <span className="absolute right-3 top-2 h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300/70 [animation-delay:-0.1s]" />
      <span className="absolute right-7 top-8 h-1 w-1 animate-bounce rounded-full bg-sky-200 [animation-delay:-0.35s]" />

      <svg
        className="relative h-24 w-24 animate-bounce drop-shadow-sm [animation-duration:2.2s]"
        fill="none"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="60" cy="59" fill="#111827" rx="33" ry="42" />
        <ellipse cx="60" cy="70" fill="#F8FAFC" rx="23" ry="28" />
        <ellipse cx="48" cy="45" fill="#F8FAFC" rx="9" ry="12" />
        <ellipse cx="72" cy="45" fill="#F8FAFC" rx="9" ry="12" />
        <circle cx="50" cy="46" fill="#111827" r="3" />
        <circle cx="70" cy="46" fill="#111827" r="3" />
        <path d="M56 54C58.5 57 61.5 57 64 54" stroke="#FB7185" strokeLinecap="round" strokeWidth="3" />
        <path d="M34 63C24 68 20 78 22 88C31 86 37 81 39 72" fill="#111827" />
        <path d="M86 63C96 68 100 78 98 88C89 86 83 81 81 72" fill="#111827" />
        <path
          d="M31 72C36 58 48 50 60 50C72 50 84 58 89 72C81 83 72 88 60 88C48 88 39 83 31 72Z"
          fill="#38BDF8"
        />
        <path
          d="M43 72C47 65 53 62 60 62C67 62 73 65 77 72C73 78 67 81 60 81C53 81 47 78 43 72Z"
          fill="#F8FAFC"
        />
        <path d="M48 98L39 107" stroke="#FB7185" strokeLinecap="round" strokeWidth="7" />
        <path d="M72 98L81 107" stroke="#FB7185" strokeLinecap="round" strokeWidth="7" />
      </svg>
    </div>
  );
}

export function LoadingState({ title, description, variant = "page" }: LoadingStateProps) {
  const sectionClass =
    variant === "page"
      ? "mx-auto flex min-h-[58vh] max-w-3xl items-center justify-center px-4 py-10"
      : variant === "card"
        ? "rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-6 shadow-sm"
        : "rounded-xl border border-sky-100 bg-sky-50 px-4 py-3";

  const content = (
    <div className={variant === "inline" ? "flex items-center gap-3" : "text-center"}>
      {variant === "inline" ? (
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
          <span className="absolute h-10 w-10 animate-ping rounded-full bg-sky-200 opacity-40" />
          <LoadingSpinner className="relative" />
        </div>
      ) : (
        <CutePenguinLoading className="mb-3" />
      )}
      <div>
        <div className={variant === "inline" ? "flex items-center gap-2 text-sm font-semibold text-gray-950" : "flex items-center justify-center gap-2 text-base font-semibold text-gray-950"}>
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
        <section className="w-full rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/60 to-cyan-50 p-7 shadow-sm">
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
