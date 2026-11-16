"use client";

import { X } from "lucide-react";
import { useState } from "react";

/** Shown only while Supabase isn't connected, so the empty frames aren't mistaken for a fault. */
export function PreviewNote() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="preview-note" role="note">
      <p>Preview: Supabase isn&rsquo;t connected yet, so empty frames are shown. The README explains how to connect it.</p>
      <button type="button" onClick={() => setOpen(false)} aria-label="Dismiss" className="mt-0.5 shrink-0 text-umber hover:text-ink">
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
