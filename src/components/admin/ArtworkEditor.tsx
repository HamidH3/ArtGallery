"use client";

import { ImageUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type ArtworkInput, deleteArtwork, discardUploads, saveArtwork } from "@/app/admin/actions";
import { Frame } from "@/components/site/Frame";
import { framedAspect } from "@/lib/hang";
import { resolveFrame } from "@/lib/images";
import type { Artwork, FrameStyle } from "@/lib/types";
import { ACCEPTED_TYPES, extensionFor, makeDerivatives, readDimensions, stamp, uploadOriginal, uploadPublic, validateImage, withTimeout } from "@/lib/upload";
import { Button, Field, Notice, Select, TextArea, TextInput, Toggle } from "./ui";

const MEDIA = [
  "Oil on canvas",
  "Oil on linen",
  "Oil on panel",
  "Oil on board",
  "Acrylic on canvas",
  "Acrylic on paper",
  "Watercolour on paper",
  "Gouache on paper",
  "Pastel on paper",
  "Charcoal on paper",
  "Graphite on paper",
  "Pencil on paper",
  "Ink on paper",
  "Mixed media",
];

const FRAME_OPTIONS: { value: FrameStyle; label: string; note: string }[] = [
  { value: "walnut", label: "Dark walnut", note: "Deep wood with a thin gold edge" },
  { value: "gilt", label: "Aged gilt", note: "Dark, tarnished gold moulding" },
  { value: "paper", label: "Black with mount", note: "Black frame, ivory mount: suits drawings" },
  { value: "none", label: "No frame", note: "Just the canvas" },
];

interface Picked {
  file: File;
  url: string;
  width: number;
  height: number;
}

type Phase = { step: "idle" } | { step: "working"; message: string; progress?: number } | { step: "error"; message: string };

export function ArtworkEditor({ artwork, currentYear }: { artwork: Artwork | null; currentYear: number }) {
  const router = useRouter();
  const isNew = !artwork;
  // A new painting's id is created when it is first saved, so its files share one folder.
  const idRef = useRef<string | null>(artwork?.id ?? null);
  const thisYear = currentYear;

  const [title, setTitle] = useState(artwork?.title ?? "");
  const [year, setYear] = useState<string>(artwork?.year ? String(artwork.year) : isNew ? String(thisYear) : "");
  const [medium, setMedium] = useState(artwork?.medium ?? "");
  const [dimensions, setDimensions] = useState(artwork?.dimensions ?? "");
  const [description, setDescription] = useState(artwork?.description ?? "");
  const [altText, setAltText] = useState(artwork?.alt_text ?? "");
  const [frame, setFrame] = useState<FrameStyle>(
    artwork ? (artwork.frame_style === "auto" ? resolveFrame(artwork) : artwork.frame_style) : "walnut",
  );
  const [featured, setFeatured] = useState(artwork?.is_featured ?? false);
  const [published, setPublished] = useState(artwork?.is_published ?? true);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ step: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = phase.step === "working";

  useEffect(() => () => {
    if (picked) URL.revokeObjectURL(picked.url);
  }, [picked]);

  // Warn before leaving with unsaved work.
  const dirty = Boolean(picked) || (artwork ? title !== artwork.title || description !== (artwork.description ?? "") : title.length > 0);
  useEffect(() => {
    if (!dirty || busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);

  async function choose(file: File | undefined) {
    if (!file) return;
    const problem = validateImage(file);
    if (problem) return setFileError(problem);
    setFileError(null);
    try {
      const { width, height } = await readDimensions(file);
      setPicked({ file, url: URL.createObjectURL(file), width, height });
      if (!title) {
        const stem = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
        if (stem && !/^(img|dsc|pxl|photo|image)\s?\d/i.test(stem)) setTitle(stem.charAt(0).toUpperCase() + stem.slice(1));
      }
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "That image couldn't be read.");
    }
  }

  // The artwork as it would appear, for the live preview.
  const previewArt: Artwork = {
    ...(artwork ?? ({} as Artwork)),
    id: artwork?.id ?? "new",
    slug: artwork?.slug ?? "preview",
    title: title || "Untitled",
    year: year ? Number(year) : null,
    medium: medium || null,
    dimensions: dimensions || null,
    description: description || null,
    alt_text: altText || null,
    frame_style: frame,
    is_featured: featured,
    is_published: published,
    width: picked?.width ?? artwork?.width ?? 4,
    height: picked?.height ?? artwork?.height ?? 5,
    image_path: artwork?.image_path ?? "",
    placeholder: !picked && !artwork,
    blur_data_url: null,
    dominant_color: null,
    thumbnail_path: artwork?.thumbnail_path ?? null,
    original_path: artwork?.original_path ?? null,
    display_order: 0,
    created_at: "",
    updated_at: "",
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setTitleError(null);
    if (isNew && !picked) {
      setFileError("Add a photograph of the painting.");
      return;
    }

    const uploaded = { public: [] as string[], originals: [] as string[] };
    idRef.current ??= crypto.randomUUID();
    const id = idRef.current;
    try {
      let image: ArtworkInput["image"];
      if (picked) {
        setPhase({ step: "working", message: "Step 1 of 4: preparing the web copies…" });
        const d = await withTimeout(makeDerivatives(picked.file), 90_000, "Preparing the web copies");
        const s = stamp();

        const mb = (picked.file.size / 1048576).toFixed(1);
        setPhase({ step: "working", message: `Step 2 of 4: uploading the original photograph (${mb} MB)…` });
        // Generous limit: 45 s plus time for a slow (~200 KB/s) connection.
        const originalPath = await withTimeout(
          uploadOriginal(id, picked.file),
          45_000 + (picked.file.size / 200_000) * 1000,
          "Uploading the original photograph",
        );
        uploaded.originals.push(originalPath);

        setPhase({ step: "working", message: "Step 3 of 4: uploading the gallery copies…" });
        const displayPath = await withTimeout(
          uploadPublic(`${id}/${s}-display.${extensionFor(d.display.type)}`, d.display),
          120_000,
          "Uploading the gallery copy",
        );
        uploaded.public.push(displayPath);
        const thumbPath = await withTimeout(
          uploadPublic(`${id}/${s}-thumb.${extensionFor(d.thumb.type)}`, d.thumb),
          60_000,
          "Uploading the thumbnail",
        );
        uploaded.public.push(thumbPath);

        image = {
          image_path: displayPath,
          thumbnail_path: thumbPath,
          original_path: originalPath,
          width: d.width,
          height: d.height,
          blur_data_url: d.blurDataUrl,
          dominant_color: d.dominantColor,
        };
      }

      setPhase({ step: "working", message: isNew ? "Step 4 of 4: hanging the painting…" : "Saving changes…" });
      const res = await withTimeout(saveArtwork({
        id,
        isNew,
        // A name is optional: unnamed paintings are called "Untitled" (only you see it).
        title: title.trim() || "Untitled",
        description,
        year: year ? Number(year) : null,
        medium,
        dimensions: dimensions.replace(/\s*[xX]\s*/g, " × "),
        alt_text: altText,
        frame_style: frame,
        is_featured: featured,
        is_published: published,
        image,
      }), 60_000, "Saving the painting");
      if (!res.ok) throw new Error(res.error);
      setPicked(null);
      setPhase({ step: "working", message: "Done. Taking you back to the collection…" });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      if (uploaded.public.length || uploaded.originals.length) void discardUploads(uploaded);
      setPhase({ step: "error", message: err instanceof Error ? err.message : "Something went wrong while saving." });
    }
  }

  async function remove() {
    if (!artwork) return;
    setPhase({ step: "working", message: "Taking the painting down…" });
    const res = await deleteArtwork(artwork.id);
    if (!res.ok) return setPhase({ step: "error", message: res.error });
    router.push("/admin");
    router.refresh();
  }

  const years = Array.from({ length: thisYear - 1949 }, (_, i) => thisYear - i);
  if (year && !years.includes(Number(year))) years.push(Number(year));
  const fa = framedAspect(previewArt);

  return (
    <form onSubmit={save} className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16" noValidate>
      <div className="space-y-8">
        {/* Image */}
        <div>
          <p className="admin-label">Photograph of the painting</p>
          <div
            className="admin-dropzone"
            data-over={dragOver || undefined}
            data-filled={Boolean(picked || artwork) || undefined}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void choose(e.dataTransfer.files?.[0]);
            }}
          >
            <ImageUp size={26} strokeWidth={1.2} className="text-gold" aria-hidden />
            {picked ? (
              <p className="text-ink">
                <span className="font-display text-[1.2rem] italic">{picked.file.name}</span>
                <span className="block text-[0.95rem] text-umber">
                  {picked.width} × {picked.height} px, {(picked.file.size / 1048576).toFixed(1)} MB. The original is kept untouched.
                </span>
              </p>
            ) : artwork ? (
              <p className="text-umber">Drop a new photograph here to replace the current image.</p>
            ) : (
              <p className="text-umber">
                <span className="block font-display text-[1.3rem] italic text-ink">Drop a photograph here</span>
                High-resolution JPEG, PNG or WebP, up to 50 MB.
              </p>
            )}
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
              {picked || artwork ? "Choose a different file" : "Choose a file"}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="sr-only"
              onChange={(e) => {
                void choose(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          {fileError ? (
            <p className="admin-error mt-2" role="alert">
              {fileError}
            </p>
          ) : null}
        </div>

        <fieldset>
          <legend className="admin-label">Choose a frame</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {FRAME_OPTIONS.map((f) => (
              <label key={f.value} className="admin-choice" data-checked={frame === f.value || undefined}>
                <input type="radio" name="frame" value={f.value} checked={frame === f.value} onChange={() => setFrame(f.value)} className="sr-only" />
                <span className={`admin-swatch admin-swatch-${f.value}`} aria-hidden />
                <span>
                  <span className="block text-[1.02rem] text-ink">{f.label}</span>
                  <span className="block text-[0.88rem] leading-snug text-umber">{f.note}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Name" htmlFor="title" error={titleError} optional hint="Only you see this. It labels the painting in your dashboard and in its web address.">
          <TextInput id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
        </Field>

        <div className="space-y-5 border-t border-gold/25 pt-7">
          <Toggle checked={featured} onChange={setFeatured} label="Hang it larger" description="Give this painting more wall space than the others." />
          <Toggle checked={published} onChange={setPublished} label="On view" description="Turn off to hide the painting from visitors without deleting it." />
        </div>

        <details className="admin-more">
          <summary>More details for your records (optional, never shown on the site)</summary>
          <div className="mt-6 space-y-7">
            <div className="grid gap-8 sm:grid-cols-2">
              <Field label="Year" htmlFor="year">
                <Select id="year" value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Not dated</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Dimensions" htmlFor="dimensions" hint="For example 60 × 80 cm">
                <TextInput
                  id="dimensions"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  onBlur={() => setDimensions((d) => d.replace(/\s*[xX]\s*/g, " × "))}
                  maxLength={120}
                />
              </Field>
            </div>
            <Field label="Medium" htmlFor="medium">
              <TextInput id="medium" list="media" value={medium} onChange={(e) => setMedium(e.target.value)} maxLength={200} />
              <datalist id="media">
                {MEDIA.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
            <Field label="Notes" htmlFor="description">
              <TextArea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} />
            </Field>
            <Field label="Description for screen readers" htmlFor="alt" hint="One sentence on what the painting shows, read aloud to visitors who can't see it.">
              <TextInput id="alt" value={altText} onChange={(e) => setAltText(e.target.value)} maxLength={500} />
            </Field>
          </div>
        </details>

        {phase.step === "working" ? (
          <div className="admin-progress" role="status">
            <p>
              {phase.message} <Elapsed key={phase.message} />
            </p>
            {typeof phase.progress === "number" ? (
              <div className="admin-progress-bar">
                <span style={{ width: `${Math.round(phase.progress * 100)}%` }} />
              </div>
            ) : null}
          </div>
        ) : null}
        {phase.step === "error" ? <Notice tone="error">{phase.message}</Notice> : null}

        <div className="flex flex-wrap items-center gap-4 border-t border-gold/25 pt-7">
          <Button type="submit" busy={busy}>
            {isNew ? "Hang the painting" : "Save changes"}
          </Button>
          <Link href="/admin" className="admin-link">
            Cancel
          </Link>
          {artwork && !confirmDelete ? (
            <button type="button" className="admin-link ml-auto inline-flex items-center gap-1.5 text-burgundy" onClick={() => setConfirmDelete(true)} disabled={busy}>
              <Trash2 size={15} strokeWidth={1.5} aria-hidden /> Delete painting
            </button>
          ) : null}
        </div>
        {artwork && confirmDelete ? (
          <div className="admin-confirm" role="alertdialog" aria-labelledby="confirm-title">
            <p id="confirm-title" className="text-ink">
              Delete <em>{artwork.title}</em> permanently? Its record, web copies and stored original will be removed. This can&rsquo;t be undone.
            </p>
            <div className="mt-4 flex gap-3">
              <Button type="button" variant="danger" onClick={remove} busy={busy}>
                Delete permanently
              </Button>
              <Button type="button" variant="quiet" onClick={() => setConfirmDelete(false)} disabled={busy}>
                Keep it
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Live preview */}
      <aside className="lg:sticky lg:top-36 lg:self-start" aria-label="Preview">
        <p className="admin-label">How it will hang</p>
        <div className="admin-preview admin-preview-dark">
          <div className="mx-auto" style={{ width: `min(${featured ? 86 : 72}%, calc(${featured ? 52 : 44}svh * ${fa.toFixed(4)}))` }}>
            <Frame art={previewArt} sizes="40vw" srcOverride={picked?.url} />
          </div>
          {!published ? <p className="mt-6 text-center text-[0.92rem] italic text-wall-muted">Hidden from visitors</p> : null}
        </div>
      </aside>
    </form>
  );
}

/** Seconds spent on the current step, so a slow upload never looks frozen. */
function Elapsed() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  return seconds >= 2 ? <span className="text-umber tabular-nums">({seconds}s)</span> : null;
}
