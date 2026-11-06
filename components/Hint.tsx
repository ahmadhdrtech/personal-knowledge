"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGraph } from "./store";

/**
 * A small round "?" (guidance) or "!" (warning) sign. Its note shows when the
 * mouse is over the sign, when it has keyboard focus, or after a tap. The note
 * stays open while the mouse is on it, so links inside it can be clicked.
 */
export default function Hint({ children, kind = "info", label }: { children: React.ReactNode; kind?: "info" | "warn"; label?: string }) {
  const { t } = useGraph();
  const btn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; below: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const over = useRef(false);
  const pinRef = useRef(false);
  pinRef.current = pinned;

  const place = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const W = Math.min(300, window.innerWidth - 16);
    const left = Math.max(8, Math.min(window.innerWidth - W - 8, r.left + r.width / 2 - W / 2));
    const below = r.top < 160;
    setPos({ left, top: below ? r.bottom + 8 : r.top - 8, below });
  };
  const show = () => { if (timer.current) clearTimeout(timer.current); place(); setOpen(true); };
  const hide = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => { if (!pinRef.current && !over.current) setOpen(false); }, 150); };

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === "keydown" && (e as KeyboardEvent).key !== "Escape") return;
      if (e.type === "mousedown" && (btn.current?.contains(e.target as Node) || (e.target as HTMLElement).closest?.(".hint-pop"))) return;
      setPinned(false); setOpen(false);
    };
    const move = () => place();
    document.addEventListener("mousedown", close); document.addEventListener("keydown", close);
    window.addEventListener("scroll", move, true); window.addEventListener("resize", move);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); window.removeEventListener("scroll", move, true); window.removeEventListener("resize", move); };
  }, [open]);

  return (
    <>
      <button type="button" ref={btn} className={`hint-sign ${kind}`} aria-label={label || (kind === "warn" ? t("Warning", "Peringatan") : t("Help", "Bantuan"))} aria-expanded={open}
        onMouseEnter={() => { over.current = true; show(); }} onMouseLeave={() => { over.current = false; hide(); }} onFocus={show} onBlur={hide}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (pinned) { setPinned(false); setOpen(false); } else { setPinned(true); show(); } }}>
        {kind === "warn" ? "!" : "?"}
      </button>
      {open && pos && typeof document !== "undefined" && createPortal(
        <div role="tooltip" className={`hint-pop ${kind}`} style={{ left: pos.left, top: pos.top, transform: pos.below ? undefined : "translateY(-100%)" }}
          onMouseEnter={() => { over.current = true; show(); }} onMouseLeave={() => { over.current = false; hide(); }}>{children}</div>,
        document.body,
      )}
    </>
  );
}
