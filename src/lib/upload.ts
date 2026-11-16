"use client";

import * as tus from "tus-js-client";
import { BUCKET_ORIGINALS, BUCKET_PUBLIC, DISPLAY_LONG_EDGE, MAX_UPLOAD_BYTES, SUPABASE_KEY, SUPABASE_URL, THUMB_LONG_EDGE } from "./config";
import { getBrowserClient } from "./supabase/client";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"];

export interface Derivatives {
  display: Blob;
  thumb: Blob;
  blurDataUrl: string;
  dominantColor: string;
  width: number;
  height: number;
}

/** Quick read of a file's pixel size, for the live preview. */
export async function readDimensions(file: File) {
  const bitmap = await decode(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

export function validateImage(file: File): string | null {
  if (!file.type.startsWith("image/")) return "That file isn't an image. Use a JPEG, PNG or WebP photograph of the painting.";
  if (file.type === "image/tiff") return "TIFF files can't be read by web browsers. Export the photograph as a high-quality JPEG or PNG first.";
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is ${(file.size / 1048576).toFixed(0)} MB. The limit is ${MAX_UPLOAD_BYTES / 1048576} MB; export a JPEG at maximum quality instead.`;
  }
  return null;
}

async function decode(file: Blob): Promise<ImageBitmap> {
  try {
    // Respects the camera's EXIF orientation.
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This browser couldn't read that image. Try a JPEG or PNG export of the photograph.");
  }
}

/**
 * Makes the web copies of a painting in the browser, so large photographs never pass through
 * a server function. The original file itself is uploaded untouched.
 */
export async function makeDerivatives(file: File): Promise<Derivatives> {
  const bitmap = await decode(file);
  try {
    const { width, height } = bitmap;
    const display = await encode(resize(bitmap, DISPLAY_LONG_EDGE), 0.9);
    const thumb = await encode(resize(bitmap, THUMB_LONG_EDGE), 0.84);
    const tiny = resize(bitmap, 24);
    const blurDataUrl = tiny.toDataURL("image/jpeg", 0.6);
    const dominantColor = averageColour(tiny);
    return { display, thumb, blurDataUrl, dominantColor, width, height };
  } finally {
    bitmap.close();
  }
}

/** Downscale in halving steps for a clean, sharp result (single large reductions alias badly). */
function resize(source: ImageBitmap, longEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, longEdge / Math.max(source.width, source.height));
  const targetW = Math.max(1, Math.round(source.width * scale));
  const targetH = Math.max(1, Math.round(source.height * scale));

  let current: CanvasImageSource = source;
  let cw = source.width;
  let ch = source.height;
  while (cw / 2 >= targetW && ch / 2 >= targetH) {
    const step = document.createElement("canvas");
    step.width = Math.round(cw / 2);
    step.height = Math.round(ch / 2);
    const ctx = step.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(current, 0, 0, step.width, step.height);
    current = step;
    cw = step.width;
    ch = step.height;
  }
  const out = document.createElement("canvas");
  out.width = targetW;
  out.height = targetH;
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(current, 0, 0, targetW, targetH);
  return out;
}

/** WebP where the browser can encode it, high-quality JPEG otherwise (older Safari). */
function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (webp) => {
        if (webp && webp.type === "image/webp") return resolve(webp);
        canvas.toBlob((jpeg) => (jpeg ? resolve(jpeg) : reject(new Error("Could not prepare the image."))), "image/jpeg", quality);
      },
      "image/webp",
      quality,
    );
  });
}

function averageColour(canvas: HTMLCanvasElement) {
  const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
  let r = 0, g = 0, b = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]!;
    g += data[i + 1]!;
    b += data[i + 2]!;
  }
  const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function extensionFor(type: string) {
  return type === "image/webp" ? "webp" : type === "image/png" ? "png" : type === "image/avif" ? "avif" : "jpg";
}

function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const stem = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "jpg";
  return `${stem || "painting"}.${ext || "jpg"}`;
}

/** Public web copy (display image, thumbnail or About photograph). Cached for a year: file names are unique. */
export async function uploadPublic(path: string, blob: Blob) {
  const { error } = await getBrowserClient()
    .storage.from(BUCKET_PUBLIC)
    .upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

/**
 * The untouched original, sent in resumable 6 MB chunks so a dropped connection
 * doesn't restart a large upload. Stored in the private originals bucket.
 */
export async function uploadOriginal(folder: string, file: File, onProgress: (fraction: number) => void): Promise<string> {
  const supabase = getBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session has expired. Sign in again to upload.");

  const path = `${folder}/${Date.now().toString(36)}-${safeFileName(file.name)}`;
  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 2000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${token}`, apikey: SUPABASE_KEY, "x-upsert": "false" },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024, // Supabase requires exactly 6 MB chunks
      metadata: {
        bucketName: BUCKET_ORIGINALS,
        objectName: path,
        contentType: file.type || "image/jpeg",
        cacheControl: "3600",
      },
      onError: (err) => reject(new Error(`The original didn't upload: ${err.message}`)),
      onProgress: (sent, total) => onProgress(total ? sent / total : 0),
      onSuccess: () => resolve(),
    });
    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]!);
      upload.start();
    }, reject);
  });
  return path;
}

/** A unique, cache-safe stamp for file names. */
export function stamp() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Resize an About-page photograph and upload it. */
export async function uploadAboutPhoto(file: File, longEdge = 2000) {
  const bitmap = await decode(file);
  try {
    const canvas = resize(bitmap, longEdge);
    const blob = await encode(canvas, 0.88);
    const path = `about/${stamp()}.${extensionFor(blob.type)}`;
    await uploadPublic(path, blob);
    return { path, width: canvas.width, height: canvas.height };
  } finally {
    bitmap.close();
  }
}
