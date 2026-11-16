import Image from "next/image";
import type { CSSProperties } from "react";
import { publicImageUrl, resolveFrame } from "@/lib/images";
import type { Artwork } from "@/lib/types";

interface FrameProps {
  art: Artwork;
  /** `sizes` attribute for responsive image selection. */
  sizes: string;
  preload?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Override the stored image (used by the dashboard's live preview). */
  srcOverride?: string;
}

/**
 * A painting in its frame. The picture box always takes the image's own proportions,
 * so the work is never cropped or stretched; the frame is built around it in CSS.
 */
export function Frame({ art, sizes, preload, className = "", style, srcOverride }: FrameProps) {
  const frame = resolveFrame(art);
  const src = srcOverride ?? publicImageUrl(art.image_path);
  const isEmpty = art.placeholder || !src;

  return (
    <div className={`frame frame-${frame} ${className}`} style={style}>
      <div className="frame-body">
        <div className="frame-liner">
          <div
            className="frame-picture"
            style={{
              aspectRatio: `${art.width} / ${art.height}`,
              backgroundColor: art.dominant_color ?? undefined,
            }}
          >
            {isEmpty ? (
              <div className="primed-canvas" aria-hidden />
            ) : srcOverride ? (
              // Local object URL in the dashboard preview: no optimisation needed.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={srcOverride} alt="" className="absolute inset-0 h-full w-full object-contain" />
            ) : (
              <Image
                src={src}
                alt={art.alt_text || `${art.title}${art.year ? `, ${art.year}` : ""}`}
                fill
                sizes={sizes}
                quality={86}
                preload={preload}
                placeholder={art.blur_data_url ? "blur" : "empty"}
                blurDataURL={art.blur_data_url ?? undefined}
                className="object-contain"
                draggable={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
