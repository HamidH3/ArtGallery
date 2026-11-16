"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { Button, Field, Notice, TextInput } from "./ui";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"password" | "reset">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error"));
  const [sent, setSent] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await getBrowserClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      setError(error.message === "Invalid login credentials" ? "That email and password don't match an account." : error.message);
      return;
    }
    const next = params.get("next");
    router.replace(next && next.startsWith("/admin") ? next : "/admin");
    router.refresh();
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await getBrowserClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm?next=/admin/update-password`,
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (mode === "reset") {
    return (
      <form onSubmit={sendReset} className="mt-8 space-y-6">
        {sent ? (
          <Notice tone="success">If an account exists for {email}, a link to choose a new password is on its way.</Notice>
        ) : (
          <p className="text-[1.02rem] text-umber">Enter your email and we&rsquo;ll send a link to choose a new password.</p>
        )}
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Field label="Email" htmlFor="email">
          <TextInput id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <div className="flex items-center justify-between gap-4">
          <Button type="submit" busy={busy}>
            Send reset link
          </Button>
          <button type="button" className="admin-link" onClick={() => setMode("password")}>
            Back to sign in
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={signIn} className="mt-8 space-y-6">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field label="Email" htmlFor="email">
        <TextInput id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="password">
        <TextInput
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <div className="flex items-center justify-between gap-4">
        <Button type="submit" busy={busy}>
          Sign in
        </Button>
        <button type="button" className="admin-link" onClick={() => setMode("reset")}>
          Forgotten your password?
        </button>
      </div>
    </form>
  );
}
