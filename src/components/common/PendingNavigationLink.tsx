"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { useState } from "react";

type PendingNavigationLinkProps = {
  href: string;
  children: ReactNode;
  className: string;
  pendingLabel: string;
  pendingClassName?: string;
};

function shouldIgnoreClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function PendingNavigationLink({
  href,
  children,
  className,
  pendingLabel,
  pendingClassName = "cursor-wait opacity-70",
}: PendingNavigationLinkProps) {
  const [pending, setPending] = useState(false);

  return (
    <Link
      aria-busy={pending}
      aria-disabled={pending}
      className={`${className}${pending ? ` ${pendingClassName}` : ""}`}
      href={href}
      onClick={(event) => {
        if (shouldIgnoreClick(event)) return;
        if (pending) {
          event.preventDefault();
          return;
        }
        setPending(true);
      }}
    >
      {pending ? pendingLabel : children}
    </Link>
  );
}
