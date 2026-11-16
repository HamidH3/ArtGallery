"use client";

import { ImageUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type ArtworkInput, deleteArtwork, discardUploads, saveArtwork } from "@/app/admin/actions";
import { Frame } from "@/components/site/Frame";
import { WallLabel } from "@/components/site/WallLabel";
import { framedAspect } from "@/lib/hang";
import { resolveFrame } from "@/lib/images";
import type { Artwork, FrameStyle } from "@/lib/types";
import { ACCEPTED_TYPES, extensionFor, makeDerivatives, readDimensions, stamp, uploadOriginal, uploadPublic, validateImage } from "@/lib/upload";
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
  { value: "auto", label: "Automatic", note: "Gilt for paintings, a mount for works on paper" },
  { value: "gilt", label: "Gilt", note: "Antique gold moulding" },
  { value: "walnut", label: "Walnut", note: "Dark wood with a gold slip" },
  { value: "paper", label: "Ivory mount", note: "For drawings and watercolours" },
  { value: "none", label: "Unframed", note: "Bare canvas edge" },
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
  const [frame, setFrame] = useState<FrameStyle>(artwork?.frame_style ?? "auto");
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
    if (!title.trim()) {
      setTitleError("Give the painting a title.");
      return;
    }
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
        setPhase({ step: "working", message: "Preparing the web copies…" });
        const d = await makeDerivatives(picked.file);
        const s = stamp();

        setPhase({ step: "working", message: "Uploading the original photograph…", progress: 0 });
        const originalPath = await uploadOriginal(id, picked.file, (p) =>
          setPhase({ step: "working", message: "Uploading the original photograph…", progress: p }),
        );
        uploaded.originals.push(originalPath);

        setPhase({ step: "working", message: "Uploading the gallery copies…" });
        const displayPath = await uploadPublic(`${id}/${s}-display.${extensionFor(d.display.type)}`, d.display);
        uploaded.public.push(displayPath);
        const thumbPath = await uploadPublic(`${id}/${s}-thumb.${extensionFor(d.thumb.type)}`, d.thumb);
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

      setPhase({ step: "working", message: isNew ? "Hanging the painting…" : "Saving changes…" });
      const res = await saveArtwork({
        id,
        isNew,
        title,
        description,
        year: year ? Number(year) : null,
        medium,
        dimensions: dimensions.replace(/\s*[xX]\s*/g, " × "),
        alt_text: altText,
        frame_style: frame,
        is_featured: featured,
        is_published: published,
        image,
      });
      if (!res.ok) throw new Error(res.error);
      setPicked(null);
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
  const onWall = featured ? "principal" : "cabinet";
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

        <Field label="Title" htmlFor="title" error={titleError}>
          <TextInput id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
        </Field>

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
          <Field label="Dimensions" htmlFor="dimensions" optional hint="Height × width, for example 60 × 80 cm">
            <TextInput
              id="dimensions"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              onBlur={() => setDimensions((d) => d.replace(/\s*[xX]\s*/g, " × "))}
              maxLength={120}
            />
          </Field>
        </div>

        <Field label="Medium" htmlFor="medium" hint="Choose a suggestion or type your own.">
          <TextInput id="medium" list="media" value={medium} onChange={(e) => setMedium(e.target.value)} maxLength={200} />
          <datalist id="media">
            {MEDIA.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>

        <Field
          label="Notes on the painting"
          htmlFor="description"
          optional
          hint="Shown in the viewing room. The first paragraph also appears on the wall label of principal works."
        >
          <TextArea id="description" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} />
        </Field>

        <Field
          label="Description for screen readers"
          htmlFor="alt"
          optional
          hint="One sentence describing what the painting shows, for visitors who can't see it."
        >
          <TextInput id="alt" value={altText} onChange={(e) => setAltText(e.target.value)} maxLength={500} />
        </Field>

        <fieldset>
          <legend className="admin-label">Frame</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {FRAME_OPTIONS.map((f) => (
              <label key={f.value} className="admin-choice" data-checked={frame === f.value || undefined}>
                <input type="radio" name="frame" value={f.value} checked={frame === f.value} onChange={() => setFrame(f.value)} className="sr-only" />
                <span className={`admin-swatch admin-swatch-${f.value === "auto" ? resolveFrame({ frame_style: "auto", medium }) : f.value}`} aria-hidden />
                <span>
                  <span className="block text-[1.02rem] text-ink">{f.label}</span>
                  <span className="block text-[0.88rem] leading-snug text-umber">{f.note}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-5 border-t border-gold/25 pt-7">
          <Toggle
            checked={featured}
            onChange={setFeatured}
            label="Principal work"
            description="Hang it on a wall of its own in the first room, with its label and notes beside it."
          />
          <Toggle checked={published} onChange={setPublished} label="On view" description="Turn off to hide the painting from visitors without deleting it." />
        </div>

        {phase.step === "working" ? (
          <div className="admin-progress" role="status">
            <p>{phase.message}</p>
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
        <div className={`admin-preview ${onWall === "principal" ? "surface-wall on-dark" : "surface-parchment"}`}>
          <p className={`mb-6 text-center font-display text-[1rem] italic ${onWall === "principal" ? "text-gold-pale/80" : "text-umber"}`}>
            {onWall === "principal" ? "Room I, principal works" : "The cabinet"}
          </p>
          <div className="mx-auto" style={{ width: `min(78%, calc(46svh * ${fa.toFixed(4)}))` }}>
            <Frame art={previewArt} sizes="40vw" srcOverride={picked?.url} />
            {onWall === "cabinet" ? (
              <WallLabel art={previewArt} titleAs="p" className="mt-5 text-ink" />
            ) : null}
          </div>
          {onWall === "principal" ? (
            <div className="mx-auto mt-8 flex justify-center">
              <WallLabel art={previewArt} variant="plaque" withNote titleAs="p" className="w-full max-w-[19rem]" />
            </div>
          ) : null}
          {!published ? <p className="mt-6 text-center text-[0.92rem] italic opacity-80">Hidden from visitors</p> : null}
        </div>
      </aside>
    </form>
  );
}
