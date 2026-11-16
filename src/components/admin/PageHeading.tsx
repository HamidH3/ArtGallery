import type { ReactNode } from "react";

/** Server-safe page heading for dashboard pages. */
export function PageHeading({ title, lede, actions }: { title: string; lede?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-5 border-b border-gold/30 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[2.4rem] leading-none font-light text-ink sm:text-[2.9rem]">{title}</h1>
        {lede ? <p className="mt-3 max-w-[42rem] text-[1.02rem] leading-relaxed text-umber">{lede}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
