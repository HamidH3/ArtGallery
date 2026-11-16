"use client";

import { ArrowDown, ArrowUp, ImageUp, Plus, Quote, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { type AboutSectionInput, saveAboutSections, saveSettings } from "@/app/admin/actions";
import { publicImageUrl } from "@/lib/images";
import type { AboutSection, SiteSettings } from "@/lib/types";
import { uploadAboutPhoto, validateImage } from "@/lib/upload";
import { Button, Field, Notice, TextArea, TextInput } from "./ui";

type Draft = AboutSectionInput;

function toDraft(s: AboutSection): Draft {
  return {
    id: s.id,
    kind: s.kind,
    heading: s.heading ?? "",
    body: s.body,
    image_path: s.image_path,
    image_caption: s.image_caption ?? "",
    image_width: s.image_width,
    image_height: s.image_height,
  };
}

export function AboutEditor({ settings, sections }: { settings: SiteSettings; sections: AboutSection[] }) {
  const router = useRouter();
  const [kicker, setKicker] = useState(settings.about_kicker);
  const [title, setTitle] = useState(settings.about_title);
  const [lede, setLede] = useState(settings.about_lede);
  const [portrait, setPortrait] = useState({
    path: settings.about_portrait_path,
    width: settings.about_portrait_width,
    height: settings.about_portrait_height,
  });
  const [caption, setCaption] = useState(settings.about_portrait_caption ?? "");
  const [drafts, setDrafts] = useState<Draft[]>(sections.map(toDraft));
  const [uploading, setUploading] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const update = (id: string, patch: Partial<Draft>) => setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const move = (i: number, d: number) =>
    setDrafts((ds) => {
      const j = i + d;
      if (j < 0 || j >= ds.length) return ds;
      const next = [...ds];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  const add = (kind: Draft["kind"]) =>
    setDrafts((ds) => [
      ...ds,
      { id: crypto.randomUUID(), kind, heading: "", body: "", image_path: null, image_caption: "", image_width: null, image_height: null },
    ]);

  async function upload(file: File | undefined, target: "portrait" | string) {
    if (!file) return;
    const problem = validateImage(file);
    if (problem) return setMessage({ tone: "error", text: problem });
    setUploading(target);
    setMessage(null);
    try {
      const res = await uploadAboutPhoto(file, target === "portrait" ? 1600 : 2000);
      if (target === "portrait") setPortrait(res);
      else update(target, { image_path: res.path, image_width: res.width, image_height: res.height });
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    const head = await saveSettings({
      about_kicker: kicker,
      about_title: title,
      about_lede: lede,
      about_portrait_caption: caption,
      portrait,
    });
    const body = head.ok ? await saveAboutSections(drafts) : head;
    setBusy(false);
    if (!body.ok) return setMessage({ tone: "error", text: body.error });
    setMessage({ tone: "success", text: "The About page has been updated." });
    router.refresh();
  }

  let chapter = 0;

  return (
    <div className="space-y-14">
      <section className="admin-panel">
        <h2 className="admin-panel-title">Opening</h2>
        <div className="grid gap-10 md:grid-cols-[16rem_minmax(0,1fr)]">
          <div>
            <p className="admin-label">Portrait</p>
            <PhotoPicker
              path={portrait.path}
              aspect="4 / 5"
              arch
              busy={uploading === "portrait"}
              onPick={(f) => upload(f, "portrait")}
              onRemove={() => setPortrait({ path: null, width: null, height: null })}
            />
            <div className="mt-4">
              <Field label="Caption" htmlFor="portrait-caption" optional>
                <TextInput id="portrait-caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} />
              </Field>
            </div>
          </div>
          <div className="space-y-7">
            <Field label="Small heading" htmlFor="kicker" hint="Shown in italics above the title.">
              <TextInput id="kicker" value={kicker} onChange={(e) => setKicker(e.target.value)} maxLength={120} />
            </Field>
            <Field label="Title" htmlFor="about-title">
              <TextInput id="about-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </Field>
            <Field label="Introduction" htmlFor="lede" hint="Two or three sentences, set large beside the portrait.">
              <TextArea id="lede" rows={4} value={lede} onChange={(e) => setLede(e.target.value)} maxLength={1200} />
            </Field>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[1.9rem] font-light text-ink">Chapters</h2>
            <p className="text-[0.98rem] text-umber">
              Leave a blank line between paragraphs. Lines starting with a hyphen become a list.
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => add("chapter")}>
              <Plus size={15} aria-hidden /> Add a chapter
            </Button>
            <Button type="button" variant="secondary" onClick={() => add("quote")}>
              <Quote size={14} aria-hidden /> Add a quotation
            </Button>
          </div>
        </div>

        <ol className="space-y-6">
          {drafts.map((d, i) => {
            if (d.kind === "chapter") chapter += 1;
            return (
              <li key={d.id} className="admin-panel">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <p className="font-display text-[1.15rem] italic text-burgundy">
                    {d.kind === "quote" ? "Quotation" : `Chapter ${chapter}`}
                  </p>
                  <div className="flex items-center gap-1">
                    <IconButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                      <ArrowUp size={16} />
                    </IconButton>
                    <IconButton label="Move down" onClick={() => move(i, 1)} disabled={i === drafts.length - 1}>
                      <ArrowDown size={16} />
                    </IconButton>
                    <IconButton label="Remove this section" onClick={() => setDrafts((ds) => ds.filter((x) => x.id !== d.id))}>
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                </div>

                {d.kind === "quote" ? (
                  <Field label="Quotation" htmlFor={`q-${d.id}`}>
                    <TextArea id={`q-${d.id}`} rows={3} value={d.body} onChange={(e) => update(d.id, { body: e.target.value })} />
                  </Field>
                ) : (
                  <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_14rem]">
                    <div className="space-y-6">
                      <Field label="Heading" htmlFor={`h-${d.id}`}>
                        <TextInput id={`h-${d.id}`} value={d.heading} onChange={(e) => update(d.id, { heading: e.target.value })} maxLength={200} />
                      </Field>
                      <Field label="Text" htmlFor={`b-${d.id}`}>
                        <TextArea id={`b-${d.id}`} rows={8} value={d.body} onChange={(e) => update(d.id, { body: e.target.value })} />
                      </Field>
                    </div>
                    <div>
                      <p className="admin-label">
                        Photograph <span className="admin-optional">optional</span>
                      </p>
                      <PhotoPicker
                        path={d.image_path}
                        aspect={d.image_width && d.image_height ? `${d.image_width} / ${d.image_height}` : "4 / 3"}
                        busy={uploading === d.id}
                        onPick={(f) => upload(f, d.id)}
                        onRemove={() => update(d.id, { image_path: null, image_width: null, image_height: null })}
                      />
                      {d.image_path ? (
                        <div className="mt-4">
                          <Field label="Caption" htmlFor={`c-${d.id}`} optional>
                            <TextInput id={`c-${d.id}`} value={d.image_caption} onChange={(e) => update(d.id, { image_caption: e.target.value })} />
                          </Field>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-4 border-t border-gold/30 bg-parchment/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <Button type="button" onClick={save} busy={busy} disabled={Boolean(uploading)}>
          Save the About page
        </Button>
        <a href="/about" target="_blank" rel="noreferrer" className="admin-link">
          View the page
        </a>
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      </div>
    </div>
  );
}

function IconButton({ label, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className="admin-icon-button" {...rest}>
      {children}
    </button>
  );
}

function PhotoPicker({
  path,
  aspect,
  arch,
  busy,
  onPick,
  onRemove,
}: {
  path: string | null;
  aspect: string;
  arch?: boolean;
  busy: boolean;
  onPick: (f: File | undefined) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onPick(e.dataTransfer.files?.[0]);
        }}
        className={`admin-photo ${arch ? "admin-photo-arch" : ""}`}
        style={{ aspectRatio: aspect }}
        aria-label={path ? "Replace photograph" : "Add a photograph"}
      >
        {path ? (
          <Image src={publicImageUrl(path)} alt="" fill sizes="16rem" className="object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-umber">
            <ImageUp size={22} strokeWidth={1.2} className="text-gold" />
            <span className="text-[0.92rem]">{busy ? "Uploading…" : "Drop or choose"}</span>
          </span>
        )}
        {busy && path ? <span className="admin-photo-busy">Uploading…</span> : null}
      </button>
      {path ? (
        <button type="button" onClick={onRemove} className="admin-link mt-2 text-[0.92rem]">
          Remove photograph
        </button>
      ) : null}
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
