import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Lozenge } from "@/components/site/Ornaments";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

export default function ThankYouPage({ searchParams }: PageProps<"/purchase/thank-you">) {
  return (
    <div className="flex min-h-svh items-center justify-center px-6 pt-[var(--nav-h)] pb-24">
      <div className="max-w-[32rem] text-center">
        <Lozenge className="mx-auto text-gold-light/75" />
        <Suspense fallback={<p className="mt-8 font-display text-[1.4rem] italic text-wall-text/80">Confirming your order…</p>}>
          <Confirmation searchParams={searchParams} />
        </Suspense>
        <div className="mt-12 flex flex-wrap justify-center gap-x-10 gap-y-3 font-display text-[1.15rem] italic text-gold-pale">
          <Link href="/" className="hover:text-ivory">
            Back to the gallery
          </Link>
          <Link href="/purchase" className="hover:text-ivory">
            More prints
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Reads the finished payment back from Stripe, so the page only says "paid" when it really is. */
async function Confirmation({ searchParams }: { searchParams: PageProps<"/purchase/thank-you">["searchParams"] }) {
  const raw = (await searchParams).session_id;
  const sessionId = typeof raw === "string" && /^cs_(live|test)_[A-Za-z0-9]+$/.test(raw) ? raw : null;

  let paid = false;
  let email: string | null = null;
  let item: string | null = null;
  if (sessionId && isStripeConfigured) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
      paid = session.payment_status === "paid";
      email = session.customer_details?.email ?? null;
      item = session.line_items?.data[0]?.description ?? null;
    } catch {
      paid = false;
    }
  }

  if (!paid) {
    return (
      <>
        <h1 className="mt-8 font-display text-[2.4rem] leading-tight font-light text-ivory">We couldn&rsquo;t find that order</h1>
        <p className="mt-5 text-[1.08rem] leading-[1.7] text-wall-text/80">
          If you&rsquo;ve just paid, your receipt email is the confirmation. If something looks wrong, message me on TikTok at @real.hh.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="mt-8 font-display text-[2.8rem] leading-tight font-light text-ivory">Thank you</h1>
      {item ? <p className="mt-4 font-display text-[1.3rem] italic text-gold-pale">{item}</p> : null}
      <p className="mt-6 text-[1.1rem] leading-[1.7] text-wall-text/85">
        Your order is confirmed. {email ? <>A receipt is on its way to {email}. </> : null}Your print is made to order and posted
        within 5 working days.
      </p>
    </>
  );
}
