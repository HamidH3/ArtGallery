"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { Button, Field, Notice, TextInput } from "./ui";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 10) return setError("Use at least 10 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    setError(null);
    const { error } = await getBrowserClient().auth.updateUser({ password });
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-6">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field label="New password" htmlFor="pw" hint="At least 10 characters.">
        <TextInput id="pw" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="Type it again" htmlFor="pw2">
        <TextInput id="pw2" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <Button type="submit" busy={busy}>
        Save password
      </Button>
    </form>
  );
}
