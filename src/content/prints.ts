/**
 * Print shop settings: sizes, prices, delivery and the small print.
 * Prices are in pence (3000 = £30.00). Change them here, then push the change.
 *
 * The prices are checked on the server when someone clicks Buy, so they can't be
 * altered from the visitor's browser.
 */

export interface PrintSize {
  /** Short code stored with each order. Don't change it once you've sold prints. */
  id: "small" | "medium" | "large";
  label: string;
  /** Paper size in millimetres, portrait (shorter side first). */
  paperMm: [number, number];
  paperName: string;
  price: number;
}

export const PRINT_SIZES: PrintSize[] = [
  { id: "small", label: "Small", paperName: "A4", paperMm: [210, 297], price: 3000 },
  { id: "medium", label: "Medium", paperName: "A3", paperMm: [297, 420], price: 4500 },
  { id: "large", label: "Large", paperName: "A2", paperMm: [420, 594], price: 6500 },
];

export const CURRENCY = "gbp";

/** UK delivery. Prints are posted flat or rolled in a tube. */
export const DELIVERY = {
  label: "Tracked UK delivery",
  price: 495,
  minDays: 5,
  maxDays: 10,
  /** Two-letter country codes you deliver to. */
  countries: ["GB"] as const,
};

export const PAPER = "Giclée print on heavyweight archival matte paper";

export const SHOP_INTRO =
  "Prints of selected paintings, made to order on heavyweight archival paper and sent across the UK.";

/** Shown at the bottom of the purchase pages. Plain sentences; check they match what you actually do. */
export const SHOP_SMALL_PRINT = [
  "Each print is made to order and posted within 5 working days, so allow up to two weeks for it to arrive.",
  "The painting is printed to fit the paper with a thin white border, so nothing is cropped. Frames aren't included.",
  "If a print arrives damaged, message me with a photo and I'll replace it. You can also cancel and return an unused print within 14 days of delivery for a refund.",
  "Payment is handled securely by Stripe. Your card details never touch this website.",
];

export function formatPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: pence % 100 ? 2 : 0 }).format(
    pence / 100,
  );
}

export function sizeById(id: string) {
  return PRINT_SIZES.find((s) => s.id === id) ?? null;
}

export const LOWEST_PRICE = Math.min(...PRINT_SIZES.map((s) => s.price));
