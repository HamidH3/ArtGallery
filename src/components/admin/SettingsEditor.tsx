"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSettings } from "@/app/admin/actions";
import type { SiteSettings } from "@/lib/types";
import { Button, Field, Notice, TextArea, TextInput } from "./ui";

type Key = keyof SiteSettings;

const GROUPS: { title: string; note?: string; fields: { key: Key; label: string; hint?: string; rows?: number; optional?: boolean; type?: string }[] }[] = [
  {
    title: "Name and entrance",
    fields: [
      { key: "artist_name", label: "Artist name", hint: "Used for the wordmark, the entrance and page titles." },
      { key: "hero_kicker", label: "Line above your name" },
      { key: "hero_statement", label: "Opening statement", rows: 3 },
    ],
  },
  {
    title: "Introduction to the collection",
    fields: [
      { key: "intro_heading", label: "Heading" },
      { key: "intro_body", label: "Wall text", rows: 6, hint: "Leave a blank line between paragraphs." },
      { key: "room_one_title", label: "Name of the first room", hint: "Where principal works hang." },
      { key: "room_two_title", label: "Name of the second room", hint: "Where the rest of the collection hangs." },
    ],
  },
  {
    title: "Closing and contact",
    fields: [
      { key: "closing_heading", label: "Closing heading" },
      { key: "closing_body", label: "Closing text", rows: 3 },
      { key: "contact_email", label: "Contact email", optional: true, type: "email" },
      { key: "instagram_url", label: "Instagram link", optional: true, hint: "The full address, starting https://" },
      { key: "extra_link_label", label: "Another link: label", optional: true, hint: "For example Shop or Newsletter." },
      { key: "extra_link_url", label: "Another link: address", optional: true },
    ],
  },
  {
    title: "Search engines",
    fields: [{ key: "meta_description", label: "Description", rows: 2, hint: "One sentence shown under your name in search results." }],
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
    setMessage({ tone: "success", text: "Saved. The gallery shows the new text now." });
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
