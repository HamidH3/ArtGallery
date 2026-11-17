"use client";

import { Lock } from "lucide-react";
import { useState, useTransition } from "react";
import { DELIVERY, formatPrice, PRINT_SIZES } from "@/content/prints";
import { startCheckout } from "./actions";

/** Choose a size, then go to Stripe's secure payment page. */
export function PrintPicker({ slug, width, height, enabled }: { slug: string; width: number; height: number; enabled: boolean }) {
  const [sizeId, setSizeId] = useState<string>("medium");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const size = PRINT_SIZES.find((s) => s.id === sizeId)!;
  const landscape = width > height;

  function buy() {
    setError(null);
    startTransition(async () => {
      const res = await startCheckout(slug, sizeId);
      if (res.ok) window.location.assign(res.url);
      else setError(res.error);
    });
  }

  return (
    <div className="mt-9">
      <fieldset>
        <legend className="font-display text-[1.25rem] text-ivory">Choose a size</legend>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {PRINT_SIZES.map((s) => {
            const [a, b] = s.paperMm;
            const [pw, ph] = landscape ? [b, a] : [a, b];
            const checked = s.id === sizeId;
            return (
              <label key={s.id} className="print-size" data-checked={checked || undefined}>
                <input type="radio" name="size" value={s.id} checked={checked} onChange={() => setSizeId(s.id)} className="sr-only" />
                {/* the paper, drawn to scale against the other sizes, with the painting on it */}
                <span className="flex h-[7.6rem] items-end justify-center" aria-hidden>
                  <span className="print-paper" style={{ width: `${pw * 0.18}px`, height: `${ph * 0.18}px` }}>
                    <span className="print-paper-image" style={{ aspectRatio: `${width} / ${height}` }} />
                  </span>
                </span>
                <span className="mt-3 block font-display text-[1.2rem] text-ivory">{s.label}</span>
                <span className="block text-[0.86rem] leading-snug text-wall-muted">
                  {s.paperName}, {Math.round(a / 10)} × {Math.round(b / 10)} cm
                </span>
                <span className="mt-1.5 block text-[1.02rem] text-gold-pale">{formatPrice(s.price)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 border-t border-gold/20 pt-6">
        <div className="flex items-baseline justify-between text-[1rem] text-wall-text/80">
          <span>
            {size.label} print, {size.paperName}
          </span>
          <span>{formatPrice(size.price)}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between text-[1rem] text-wall-text/80">
          <span>{DELIVERY.label}</span>
          <span>{formatPrice(DELIVERY.price)}</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between font-display text-[1.45rem] text-ivory">
          <span>Total</span>
          <span>{formatPrice(size.price + DELIVERY.price)}</span>
        </div>
      </div>

      {enabled ? (
        <button type="button" onClick={buy} disabled={pending} className="closing-door mt-8 w-full disabled:opacity-70">
          <span className="font-display text-[1.35rem] italic">{pending ? "Opening secure checkout…" : "Buy this print"}</span>
        </button>
      ) : (
        <p className="mt-8 border border-gold/30 px-5 py-4 text-center font-display text-[1.2rem] italic text-wall-text/80">
          Prints can be bought here very soon.
        </p>
      )}

      {error ? (
        <p role="alert" className="mt-4 text-center text-[0.98rem] text-[#e7a6a6]">
          {error}
        </p>
      ) : null}

      <p className="mt-5 flex items-center justify-center gap-2 text-[0.92rem] text-wall-muted">
        <Lock size={14} strokeWidth={1.5} aria-hidden /> Secure payment by Stripe: card or Apple Pay
      </p>
    </div>
  );
}
