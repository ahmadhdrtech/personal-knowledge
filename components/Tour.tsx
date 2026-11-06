"use client";
import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { useGraph } from "./store";

export interface TourStep {
  /** data-tour value of the element to point at. Leave out for a centered card. */
  target?: string;
  title: string;
  body: ReactNode;
  /** Runs before the step shows, e.g. to switch tabs. */
  before?: () => void;
}

/** A step-by-step guided tour: dims the page, highlights one element, explains it. */
export default function Tour({ steps, open, onClose, start = 0 }: { steps: TourStep[]; open: boolean; onClose: () => void; start?: number }) {
  const { t } = useGraph();
  const [i, setI] = useState(start);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[i];

  useEffect(() => { if (open) setI(start); }, [open, start]);

  const measure = useCallback(() => {
    if (!step?.target) { setRect(null); return; }
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useLayoutEffect(() => {
    if (!open || !step) return;
    step.before?.();
    // wait for a tab switch to render, then scroll the target into view
    const t1 = setTimeout(() => {
      const el = step.target ? (document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null) : null;
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(measure, 320);
    }, 60);
    return () => clearTimeout(t1);
  }, [open, i]);

  useEffect(() => {
    if (!open) return;
    const on = () => measure();
    window.addEventListener("resize", on);
    document.addEventListener("scroll", on, true);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((x) => Math.min(steps.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("resize", on); document.removeEventListener("scroll", on, true); window.removeEventListener("keydown", key); };
  }, [open, measure, onClose, steps.length]);

  if (!open || !step) return null;
  const pad = 6, W = 360;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200, vh = typeof window !== "undefined" ? window.innerHeight : 800;
  let cardStyle: React.CSSProperties;
  if (rect) {
    const below = rect.bottom + 14 + 200 < vh || rect.top < 220;
    const left = Math.max(12, Math.min(vw - W - 12, rect.left + rect.width / 2 - W / 2));
    cardStyle = below ? { top: Math.min(vh - 40, rect.bottom + 14), left } : { bottom: vh - rect.top + 14, left };
    if (rect.width < vw * 0.3 && rect.left < 260) cardStyle = { top: Math.max(12, Math.min(vh - 260, rect.top - 10)), left: rect.right + 16 };
  } else cardStyle = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label={step.title}>
      {rect ? <div className="tour-spot" style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />
        : <div className="tour-dim" />}
      <div className="tour-card" style={{ ...cardStyle, width: W }}>
        <div className="muted small">{t(`Step ${i + 1} of ${steps.length}`, `Langkah ${i + 1} dari ${steps.length}`)}</div>
        <h3 style={{ margin: "4px 0 8px", color: "var(--ink)", fontSize: 16 }}>{step.title}</h3>
        <div className="tour-body">{step.body}</div>
        <div className="tour-dots">{steps.map((_, k) => <span key={k} className={k === i ? "on" : ""} />)}</div>
        <div className="btnrow" style={{ justifyContent: "space-between" }}>
          <button className="btn small" onClick={onClose}>{t("Close tour", "Tutup tur")}</button>
          <div className="inline">
            {i > 0 && <button className="btn small" onClick={() => setI(i - 1)}>{t("Back", "Kembali")}</button>}
            {i < steps.length - 1 ? <button className="btn primary small" autoFocus onClick={() => setI(i + 1)}>{t("Next", "Lanjut")}</button>
              : <button className="btn primary small" autoFocus onClick={onClose}>{t("Done", "Selesai")}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
