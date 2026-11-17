import { DELIVERY, formatPrice, SHOP_SMALL_PRINT } from "@/content/prints";

/** Delivery, returns and payment notes, shown under the shop. */
export function ShopSmallPrint({ className = "" }: { className?: string }) {
  return (
    <section aria-labelledby="small-print" className={`mx-auto max-w-[38rem] border-t border-gold/20 pt-10 ${className}`}>
      <h2 id="small-print" className="font-display text-[1.4rem] font-light text-ivory">
        Delivery and returns
      </h2>
      <ul className="mt-4 space-y-3 text-[1rem] leading-[1.65] text-wall-text/75">
        <li>
          {DELIVERY.label} to UK addresses: {formatPrice(DELIVERY.price)}.
        </li>
        {SHOP_SMALL_PRINT.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
