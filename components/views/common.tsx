"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as d3 from "d3";
import { useRouter } from "next/navigation";
import { level } from "@/lib/logic";
import { useGraph } from "../store";
import type { Concept, Graph } from "@/lib/types";

/** Width of a container, kept up to date. */
export function useWidth<T extends HTMLElement>(min = 320) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(900);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(min, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [min]);
  return [ref, w] as const;
}

export type Tip = { x: number; y: number; body: ReactNode } | null;
export function useTip() {
  const [tip, setTip] = useState<Tip>(null);
  const show = (e: React.MouseEvent, body: ReactNode) => setTip({ x: e.clientX + 14, y: e.clientY + 12, body });
  const hide = () => setTip(null);
  const el = tip ? <div className="tooltip" style={{ left: tip.x, top: tip.y, whiteSpace: "normal", maxWidth: 280 }}>{tip.body}</div> : null;
  return { show, hide, el };
}

export const mColor = (m: number) => `var(--${level(m)})`;
export const dColor = (g: Graph, key: string) => `var(--c${(g.domains.find((d) => d.key === key)?.color ?? 0) % 8})`;

export function useOpen() {
  const router = useRouter();
  return (id: string, tab?: string) => router.push(`/?c=${encodeURIComponent(id)}${tab ? `&tab=${tab}` : ""}`);
}

export function degree(g: Graph, id: string, approvedOnly = true) {
  return g.links.filter((l) => (!approvedOnly || l.status === "approved") && (l.from === id || l.to === id)).length;
}

export function MasteryKey() {
  const { t } = useGraph();
  return (
    <div className="keys" style={{ marginTop: 8 }}>
      <span><span className="dot" style={{ background: "var(--unseen)" }} /> {t("Not studied", "Belum dipelajari")}</span>
      <span><span className="dot" style={{ background: "var(--shaky)" }} /> {t("Shaky (below 60%)", "Goyah (di bawah 60%)")}</span>
      <span><span className="dot" style={{ background: "var(--solid)" }} /> {t("Solid (60% or more)", "Kuat (60% ke atas)")}</span>
      <span><span className="dot" style={{ background: "var(--danger)" }} /> {t("Misconception", "Miskonsepsi")}</span>
    </div>
  );
}

export function ConceptTip({ c, g, extra }: { c: Concept; g: Graph; extra?: ReactNode }) {
  const id = g.prefs.lang === "id";
  const label = id ? c.label.id || c.label.en : c.label.en;
  return (
    <>
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div>{id ? "Penguasaan" : "Mastery"} {c.mastery}%{c.miscon ? (id ? " · miskonsepsi" : " · misconception") : ""}</div>
      <div>{degree(g, c.id)} {id ? "tautan" : "links"} · {c.sources.length} {id ? "sumber" : c.sources.length === 1 ? "source" : "sources"}</div>
      {extra}
    </>
  );
}

/* ---------- label placement ---------- */
export type LabelIn = { id: string; x: number; y: number; r: number; text: string; weight?: number };
export type LabelOut = { x: number; y: number; anchor: "start" | "middle" | "end"; show: boolean; leader?: [number, number, number, number] };
export type Box = { x0: number; y0: number; x1: number; y1: number };
const hit = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/**
 * Greedy label placement: try beside, above and below each dot, then further out with a short leader line.
 * A label that can't be placed without overlapping is hidden (its dot still shows the name on hover).
 * Bigger dots (higher weight) are placed first.
 */
export function placeLabels(items: LabelIn[], bounds: Box, font = 11, obstacles: Box[] = []): Record<string, LabelOut> {
  const cw = font * 0.56, lh = font + 3;
  const taken: Box[] = [...obstacles, ...items.map((d) => ({ x0: d.x - d.r - 1, y0: d.y - d.r - 1, x1: d.x + d.r + 1, y1: d.y + d.r + 1 }))];
  const out: Record<string, LabelOut> = {};
  const order = [...items].sort((a, b) => (b.weight ?? b.r) - (a.weight ?? a.r));
  for (const d of order) {
    const w = d.text.length * cw, g = 4;
    const box = (x: number, y: number, anchor: LabelOut["anchor"]): Box => {
      const x0 = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
      return { x0: x0 - 2, y0: y - font + 1, x1: x0 + w + 2, y1: y + 3 };
    };
    const near: [number, number, LabelOut["anchor"]][] = [
      [d.x + d.r + g, d.y + font / 3, "start"], [d.x - d.r - g, d.y + font / 3, "end"],
      [d.x, d.y - d.r - g, "middle"], [d.x, d.y + d.r + lh, "middle"],
      [d.x + d.r + g, d.y - d.r, "start"], [d.x + d.r + g, d.y + d.r + font / 2, "start"],
      [d.x - d.r - g, d.y - d.r, "end"], [d.x - d.r - g, d.y + d.r + font / 2, "end"],
    ];
    let done: LabelOut | null = null;
    for (const [x, y, a] of near) {
      const b = box(x, y, a);
      if (b.x0 < bounds.x0 || b.x1 > bounds.x1 || b.y0 < bounds.y0 || b.y1 > bounds.y1) continue;
      if (taken.some((t) => hit(t, b))) continue;
      taken.push(b); done = { x, y, anchor: a, show: true }; break;
    }
    if (!done) {
      // further out, with a leader line back to the dot
      for (const dist of [26, 40, 56]) {
        for (let k = 0; k < 12 && !done; k++) {
          const ang = (k / 12) * 2 * Math.PI - Math.PI / 2, ex = d.x + Math.cos(ang) * (d.r + dist), ey = d.y + Math.sin(ang) * (d.r + dist);
          const a: LabelOut["anchor"] = Math.cos(ang) > 0.35 ? "start" : Math.cos(ang) < -0.35 ? "end" : "middle";
          const ty = ey + font / 3, b = box(ex, ty, a);
          if (b.x0 < bounds.x0 || b.x1 > bounds.x1 || b.y0 < bounds.y0 || b.y1 > bounds.y1) continue;
          if (taken.some((t) => hit(t, b))) continue;
          taken.push(b);
          done = { x: ex, y: ty, anchor: a, show: true, leader: [d.x + Math.cos(ang) * (d.r + 1), d.y + Math.sin(ang) * (d.r + 1), ex - Math.cos(ang) * 3, ey - Math.sin(ang) * 3] };
        }
        if (done) break;
      }
    }
    out[d.id] = done || { x: d.x, y: d.y - d.r - g, anchor: "middle", show: false };
  }
  return out;
}

/* ---------- zoomable chart frame ---------- */
/**
 * An SVG you can pan (drag) and zoom (Ctrl/⌘ + scroll, pinch, or the buttons) without hijacking page scroll.
 * Children are drawn in viewBox units; the whole drawing fits the frame at 100%.
 */
export function ZoomSvg({ viewBox, height, label, children, onMouseLeave }: { viewBox: string; height: string | number; label: string; children: ReactNode; onMouseLeave?: () => void }) {
  const { t } = useGraph();
  const svg = useRef<SVGSVGElement>(null), g = useRef<SVGGElement>(null);
  const zoom = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  useEffect(() => {
    if (!svg.current) return;
    const z = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 8]).clickDistance(4)
      .filter((e: any) => (e.type === "wheel" ? e.ctrlKey || e.metaKey : !e.button))
      .on("zoom", (e) => d3.select(g.current).attr("transform", e.transform.toString()));
    d3.select(svg.current).call(z).on("dblclick.zoom", null);
    zoom.current = z;
    return () => { d3.select(svg.current).on(".zoom", null); };
  }, []);
  const by = (k: number) => svg.current && zoom.current && d3.select(svg.current).transition().duration(250).call(zoom.current.scaleBy, k);
  const reset = () => svg.current && zoom.current && d3.select(svg.current).transition().duration(300).call(zoom.current.transform, d3.zoomIdentity);
  return (
    <div className="zoombox">
      <svg ref={svg} viewBox={viewBox} width="100%" style={{ display: "block", height, cursor: "grab" }} role="img" aria-label={label} onMouseLeave={onMouseLeave}>
        <g ref={g}>{children}</g>
      </svg>
      <div className="zoom-ctl" role="group" aria-label={t("Zoom", "Perbesar")}>
        <button type="button" onClick={() => by(1.5)} aria-label={t("Zoom in", "Perbesar")} title={t("Zoom in (or Ctrl + scroll)", "Perbesar (atau Ctrl + gulir)")}>+</button>
        <button type="button" onClick={() => by(1 / 1.5)} aria-label={t("Zoom out", "Perkecil")} title={t("Zoom out", "Perkecil")}>−</button>
        <button type="button" onClick={reset} aria-label={t("Show all", "Tampilkan semua")} title={t("Show all", "Tampilkan semua")}>⤢</button>
      </div>
      <span className="zoom-hint muted small">{t("Drag to move · Ctrl + scroll to zoom", "Geser untuk memindah · Ctrl + gulir untuk zoom")}</span>
    </div>
  );
}
