"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { reorderArtworks, setArtworkFlags } from "@/app/admin/actions";
import { publicImageUrl, resolveFrame } from "@/lib/images";
import type { Artwork } from "@/lib/types";
import { Notice } from "./ui";

type SaveState = "idle" | "saving" | "saved" | "error";

export function CollectionManager({ initial }: { initial: Artwork[] }) {
  const [works, setWorks] = useState(initial);
  const [orderState, setOrderState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => setWorks(initial), [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function persistOrder(next: Artwork[]) {
    setOrderState("saving");
    window.clearTimeout(timer.current);
    // Wait for the curator to finish a run of moves before saving.
    timer.current = window.setTimeout(() => {
      startTransition(async () => {
        const res = await reorderArtworks(next.map((w) => w.id));
        if (res.ok) {
          setOrderState("saved");
          setError(null);
        } else {
          setOrderState("error");
          setError(res.error);
        }
      });
    }, 700);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= works.length || from === to) return;
    const next = arrayMove(works, from, to);
    setWorks(next);
    persistOrder(next);
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    move(
      works.findIndex((w) => w.id === active.id),
      works.findIndex((w) => w.id === over.id),
    );
  }

  async function toggle(id: string, flag: "is_published" | "is_featured" | "print_available", value: boolean) {
    setWorks((ws) => ws.map((w) => (w.id === id ? { ...w, [flag]: value } : w)));
    const res = await setArtworkFlags(id, { [flag]: value });
    if (!res.ok) {
      setError(res.error);
      setWorks((ws) => ws.map((w) => (w.id === id ? { ...w, [flag]: !value } : w)));
    }
  }

  if (!works.length) {
    return (
      <div className="admin-empty">
        <p className="font-display text-[1.8rem] font-light text-ink">The walls are bare</p>
        <p className="mt-2 max-w-[30rem] text-umber">
          Add your first painting: drop in a photograph, give it a title, and it will hang in the gallery straight away.
        </p>
        <Link href="/admin/works/new" className="admin-button admin-button-primary mt-6">
          Add a painting
        </Link>
      </div>
    );
  }

  const larger = works.filter((w) => w.is_featured && w.is_published).length;
  const hidden = works.filter((w) => !w.is_published).length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-[0.98rem] text-umber">
        <p>
          {works.length} {works.length === 1 ? "painting" : "paintings"}{larger ? `, ${larger} hung larger` : ""}
          {hidden ? `, ${hidden} hidden from visitors` : ""}
        </p>
        <p aria-live="polite" className="italic">
          {orderState === "saving" ? "Saving the new order…" : orderState === "saved" ? "Order saved" : ""}
        </p>
      </div>
      {error ? (
        <div className="mb-5">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={works.map((w) => w.id)} strategy={verticalListSortingStrategy}>
          <ol className="admin-list">
            {works.map((w, i) => (
              <Row
                key={w.id}
                art={w}
                index={i}
                count={works.length}
                onMove={(d) => move(i, i + d)}
                onToggle={(flag, v) => toggle(w.id, flag, v)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function Row({
  art,
  index,
  count,
  onMove,
  onToggle,
}: {
  art: Artwork;
  index: number;
  count: number;
  onMove: (delta: number) => void;
  onToggle: (flag: "is_published" | "is_featured" | "print_available", v: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: art.id });
  const thumb = publicImageUrl(art.thumbnail_path || art.image_path);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-dragging={isDragging || undefined}
      data-hidden={!art.is_published || undefined}
      className="admin-row"
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="admin-handle"
        aria-label={`Move ${art.title}. Press space, then use the arrow keys.`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} strokeWidth={1.4} />
      </button>

      <span className="w-7 text-right font-display text-[1.1rem] text-umber tabular-nums">{index + 1}</span>

      <Link href={`/admin/works/${art.id}`} className={`admin-thumb admin-thumb-${resolveFrame(art)}`} tabIndex={-1} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt="" loading="lazy" />
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/admin/works/${art.id}`} className="block truncate font-display text-[1.35rem] leading-tight italic text-ink hover:text-burgundy">
          {art.title}
        </Link>
        <p className="truncate text-[0.95rem] text-umber">
          {[art.year, art.medium, art.dimensions].filter(Boolean).join(", ") || "No details yet"}
        </p>
      </div>

      <div className="admin-row-flags">
        <label className="admin-chip">
          <input type="checkbox" checked={art.is_featured} onChange={(e) => onToggle("is_featured", e.target.checked)} />
          Larger
        </label>
        <label className="admin-chip">
          <input type="checkbox" checked={art.is_published} onChange={(e) => onToggle("is_published", e.target.checked)} />
          On view
        </label>
        <label className="admin-chip">
          <input type="checkbox" checked={Boolean(art.print_available)} onChange={(e) => onToggle("print_available", e.target.checked)} />
          Prints
        </label>
      </div>

      <div className="admin-row-move">
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${art.title} earlier`}>
          <ChevronUp size={16} strokeWidth={1.5} />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move ${art.title} later`}>
          <ChevronDown size={16} strokeWidth={1.5} />
        </button>
      </div>

      <Link href={`/admin/works/${art.id}`} className="admin-link hidden sm:inline">
        Edit
      </Link>
    </li>
  );
}
