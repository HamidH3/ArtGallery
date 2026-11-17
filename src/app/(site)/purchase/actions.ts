"use server";

import { SITE_URL } from "@/lib/config";
import { getArtworks } from "@/lib/data";
import { publicImageUrl } from "@/lib/images";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { CURRENCY, DELIVERY, PAPER, sizeById } from "@/content/prints";

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Starts a Stripe Checkout payment for one print. Everything that matters (which painting,
 * the size and the price) is decided here on the server; the visitor only sends two names.
 * Card details are entered on Stripe's own secure page, never on this site.
 */
export async function startCheckout(slug: string, sizeId: string): Promise<CheckoutResult> {
  try {
    if (!isStripeConfigured) return { ok: false, error: "Prints can't be bought just yet. Please check back soon." };

    const size = sizeById(sizeId);
    if (!size) return { ok: false, error: "Choose a print size first." };

    const art = (await getArtworks()).find((w) => w.slug === slug && w.print_available && !w.placeholder);
    if (!art) return { ok: false, error: "This painting isn't available as a print any more." };

    const image = publicImageUrl(art.thumbnail_path || art.image_path);
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      // Cards, plus Apple Pay on Apple devices (Apple Pay runs on the card network).
      allowed_payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: size.price,
            product_data: {
              name: `${art.title}: ${size.label} print (${size.paperName})`,
              description: `${PAPER}, ${size.paperMm[0]} × ${size.paperMm[1]} mm`,
              ...(image.startsWith("https://") ? { images: [image] } : {}),
            },
          },
        },
      ],
      shipping_address_collection: { allowed_countries: [...DELIVERY.countries] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: DELIVERY.label,
            fixed_amount: { amount: DELIVERY.price, currency: CURRENCY },
            delivery_estimate: {
              minimum: { unit: "business_day", value: DELIVERY.minDays },
              maximum: { unit: "business_day", value: DELIVERY.maxDays },
            },
          },
        },
      ],
      submit_type: "pay",
      custom_text: {
        submit: { message: "Your print is made to order and posted within 5 working days." },
      },
      metadata: { artwork_id: art.id, artwork: art.title, size: `${size.label} (${size.paperName})` },
      payment_intent_data: {
        description: `Print: ${art.title}, ${size.label} (${size.paperName})`,
        metadata: { artwork_id: art.id, artwork: art.title, size: `${size.label} (${size.paperName})` },
      },
      success_url: `${SITE_URL}/purchase/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/purchase/${art.slug}`,
    });

    if (!session.url) return { ok: false, error: "The payment page couldn't be opened. Please try again." };
    return { ok: true, url: session.url };
  } catch (e) {
    console.error("[purchase] checkout failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "The payment page couldn't be opened. Please try again in a moment." };
  }
}
