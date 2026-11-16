"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSettings } from "@/app/admin/actions";
import type { SiteSettings } from "@/lib/types";
import { Button, Field, Notice, TextArea, TextInput } from "./ui";

type Key = keyof SiteSettings;

const GROUPS: { title: string; note?: string; fields: { key: Key; label: string; hint?: string; rows?: number; optional?: boolean; type?: string }[] }[] = [
  {
    title: "Name",
    fields: [
      { key: "artist_name", label: "Name shown on the site", hint: "Up to four letters with no spaces (like HH) is shown as a large monogram." },
      { key: "hero_kicker", label: "Line above the name", hint: "The small line at the entrance." },
    ],
  },
  {
    title: "Links in the footer",
    fields: [
      { key: "contact_email", label: "Email", optional: true, type: "email", hint: "Leave empty to show no email." },
      { key: "instagram_url", label: "Instagram link", optional: true, hint: "The full address, starting https://" },
    ],
  },
  {
    title: "Search engines",
    fields: [{ key: "meta_description", label: "Description", rows: 2, hint: "One sentence shown under the site's name in search results." }],
  },
];

export function SettingsEditor({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(GROUPS.flatMap((g) => g.fields).map((f) => [f.key, String(settings[f.key] ?? "")])),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await saveSettings(values as Partial<SiteSettings>);
    setBusy(false);
    if (!res.ok) return setMessage({ tone: "error", text: res.error });
    setMessage({ tone: "success", text: "Saved. The site shows the change now." });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-10">
      {GROUPS.map((g) => (
        <section key={g.title} className="admin-panel">
          <h2 className="admin-panel-title">{g.title}</h2>
          <div className="grid gap-7 md:grid-cols-2">
            {g.fields.map((f) => (
              <div key={f.key} className={f.rows && f.rows > 2 ? "md:col-span-2" : ""}>
                <Field label={f.label} htmlFor={f.key} hint={f.hint} optional={f.optional}>
                  {f.rows ? (
                    <TextArea id={f.key} rows={f.rows} value={values[f.key]} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
                  ) : (
                    <TextInput
                      id={f.key}
                      type={f.type ?? "text"}
                      value={values[f.key]}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  )}
                </Field>
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-4 border-t border-gold/30 bg-parchment/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <Button type="submit" busy={busy}>
          Save site details
        </Button>
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      </div>
    </form>
  );
}
