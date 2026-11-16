import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { Arch } from "@/components/site/Ornaments";
import { isSupabaseConfigured } from "@/lib/config";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="surface-walnut on-dark relative hidden overflow-hidden lg:block" aria-hidden>
        <Arch className="absolute bottom-0 left-1/2 h-[82%] -translate-x-1/2" />
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[24rem]">
          <p className="font-display text-[1.2rem] italic text-burgundy">Gallery dashboard</p>
          <h1 className="mt-2 font-display text-[2.8rem] leading-none font-light text-ink">Sign in</h1>
          {isSupabaseConfigured ? (
            <Suspense>
              <LoginForm />
            </Suspense>
          ) : (
            <p className="mt-6 text-[1.05rem] text-umber">
              Supabase isn&rsquo;t connected yet. Add your project URL and publishable key to the environment variables (see the
              README), then reload this page.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
