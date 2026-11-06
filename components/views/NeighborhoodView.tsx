"use client";
import { useMemo, useState } from "react";
import { useGraph } from "../store";
import { ConceptTip, MasteryKey, mColor, useOpen, useTip, useWidth, ZoomSvg } from "./common";
import { TYPES } from "@/lib/logic";
import type { Link } from "@/lib/types";

/** One concept in the middle, everything within a few steps around it in rings. */
export default function NeighborhoodView({ initial }: { initial?: string | null }) {
  const { graph, T, t } = useGraph();
  const g = graph!;
  const [ref, w] = useWidth<HTMLDivElement>();
  const tip = useTip();
  const open = useOpen();
  const first = initial && g.concepts.some((c) => c.id === initial) ? initial : [...g.concepts].sort((a, b) => deg(b.id) - deg(a.id))[0]?.id;
  const [center, setCenter] = useState<string>(first || "");
  const [hops, setHops] = useState(2);
  const [sugg, setSugg] = useState(true);
  function deg(id: string) { return g.links.filter((l) => l.from === id || l.to === id).length; }

  const { rings, parent, links } = useMemo(() => {
    const ls = g.links.filter((l) => sugg || l.status === "approved");
    const dist = new Map<string, number>([[center, 0]]), parent = new Map<string, string>();
    const rings: string[][] = [[center]];
    for (let d = 1; d <= hops; d++) {
      const next: string[] = [];
      for (const id of rings[d - 1]) for (const l of ls) {
        const o = l.from === id ? l.to : l.to === id ? l.from : null;
        if (o && !dist.has(o)) { dist.set(o, d); parent.set(o, id); next.push(o); }
      }
      if (!next.length) break;
      rings.push(next);
    }
    const shown = new Set(dist.keys());
    return { rings, parent, links: ls.filter((l) => shown.has(l.from) && shown.has(l.to)) };
  }, [g, center, hops, sugg]);

  // each ring gets enough circumference for its nodes and labels; the frame scales the drawing to fit
  const most = Math.max(1, ...rings.map((r) => r.length));
  const step = Math.max(130, (most * 34) / (2 * Math.PI) / Math.max(1, rings.length - 1) * 1.6);
  const S = 2 * (step * (rings.length - 1 || 1) + 190);
  const W2 = Math.max(w, S), H = S;
  const cx = W2 / 2, cy = H / 2;
  const angle = new Map<string, number>([[center, 0]]);
  rings.forEach((ring, d) => {
    if (d === 0) return;
    const sorted = [...ring].sort((a, b) => (angle.get(parent.get(a)!) ?? 0) - (angle.get(parent.get(b)!) ?? 0));
    sorted.forEach((id, i) => angle.set(id, (i / sorted.length) * 2 * Math.PI + (d % 2 ? Math.PI / 9 : Math.PI / sorted.length + Math.PI / 9)));
  });
  const pos = (id: string) => {
    const d = rings.findIndex((r) => r.includes(id)), a = angle.get(id)! - Math.PI / 2;
    return { x: cx + Math.cos(a) * step * d, y: cy + Math.sin(a) * step * d, d };
  };
  const byId = (id: string) => g.concepts.find((c) => c.id === id)!;
  const isTree = (l: Link) => parent.get(l.to) === l.from || parent.get(l.from) === l.to;
  const sorted = [...g.concepts].sort((a, b) => T(a.label).localeCompare(T(b.label)));

  return (
    <div className="box" ref={ref}>
      <div className="split" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ marginTop: 0 }}>{t("Neighborhood", "Sekitar konsep")}</h3>
          <p className="muted small" style={{ margin: 0 }}>{t("How one concept reaches the rest of your map. Each ring is one more link away. Click a concept to put it in the middle.", "Bagaimana satu konsep terhubung ke seluruh petamu. Setiap lingkaran berarti satu tautan lebih jauh. Klik konsep untuk menaruhnya di tengah.")}</p>
        </div>
        <div className="inline">
          <select className="field" style={{ width: "auto" }} value={center} onChange={(e) => setCenter(e.target.value)} aria-label={t("Center concept", "Konsep tengah")}>
            {sorted.map((c) => <option key={c.id} value={c.id}>{T(c.label)}</option>)}
          </select>
          <div className="seg" role="group" aria-label={t("Steps", "Langkah")}>{[1, 2, 3].map((n) => <button key={n} aria-pressed={hops === n} onClick={() => setHops(n)}>{n} {t(n > 1 ? "steps" : "step", "langkah")}</button>)}</div>
          <label className="inline small"><input type="checkbox" checked={sugg} onChange={(e) => setSugg(e.target.checked)} /> {t("Include suggested", "Sertakan saran")}</label>
          <button className="btn small" onClick={() => open(center)}>{t("Open in map", "Buka di peta")}</button>
        </div>
      </div>
      <ZoomSvg viewBox={`0 0 ${W2} ${H}`} height={`min(80vh, ${Math.round(Math.max(480, w * 0.8))}px)`} label={t("Radial map of a concept's neighbors", "Peta melingkar di sekitar satu konsep")} onMouseLeave={tip.hide}>
        {rings.slice(1).map((_, i) => <circle key={i} cx={cx} cy={cy} r={step * (i + 1)} fill="none" stroke="var(--line)" strokeDasharray="3 5" />)}
        {rings.slice(1).map((r, i) => { const a = (-3 * Math.PI) / 4 + 0.18, rr = step * (i + 1); return <text key={i} x={cx + Math.cos(a) * rr} y={cy + Math.sin(a) * rr} fontSize={11} textAnchor="end" fill="var(--muted)" style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 4 }}>{i + 1} {t(i ? "steps" : "step", "langkah")} · {r.length}</text>; })}
        {links.map((l) => {
          const a = pos(l.from), b = pos(l.to), tree = isTree(l), s = l.status === "suggested";
          return <line key={l.lid} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={s ? "var(--accent)" : tree ? "var(--edge)" : "var(--line)"} strokeWidth={tree ? 1.6 : 1}
            strokeDasharray={s ? "4 4" : l.type === "contrasts" ? "6 4" : undefined} opacity={tree ? 1 : 0.7}
            onMouseMove={(e) => tip.show(e, <>{T(byId(l.from).label)} {T(TYPES[l.type].say)} {T(byId(l.to).label)}{s ? t(" (suggested)", " (saran)") : ""}</>)} />;
        })}
        {rings.flat().map((id) => {
          const c = byId(id), p = pos(id), r = p.d === 0 ? 20 : p.d === 1 ? 12 : 9;
          const right = Math.cos(angle.get(id)! - Math.PI / 2) >= -0.01;
          return (
            <g key={id} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }} onClick={() => setCenter(id)} onDoubleClick={() => open(id)}
              onMouseMove={(e) => tip.show(e, <ConceptTip c={c} g={g} extra={<div className="small">{t("Click to center · double-click to open", "Klik untuk ke tengah · klik dua kali untuk membuka")}</div>} />)}>
              <circle r={r} fill={mColor(c.mastery)} stroke={c.miscon ? "var(--danger)" : p.d === 0 ? "var(--ink)" : "var(--surface)"} strokeWidth={c.miscon || p.d === 0 ? 3 : 2} />
              <text x={p.d === 0 ? 0 : right ? r + 5 : -r - 5} y={p.d === 0 ? r + 18 : 4} textAnchor={p.d === 0 ? "middle" : right ? "start" : "end"}
                fontSize={p.d === 0 ? 14 : 11.5} fontWeight={p.d === 0 ? 600 : 400} fill={p.d > 1 ? "var(--muted)" : "var(--ink)"}
                style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 4, pointerEvents: "none" }}>{T(c.label)}</text>
            </g>
          );
        })}
      </ZoomSvg>
      <MasteryKey />
      {rings.length > 1 && <p className="muted small">{t(`${rings.flat().length - 1} of ${g.concepts.length - 1} other concepts are within ${rings.length - 1} steps.`, `${rings.flat().length - 1} dari ${g.concepts.length - 1} konsep lain berjarak paling jauh ${rings.length - 1} langkah.`)}</p>}
      {tip.el}
    </div>
  );
}
