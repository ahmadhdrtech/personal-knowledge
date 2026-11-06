"use client";
import { useMemo, useState } from "react";
import { useGraph } from "../store";
import { ConceptTip, mColor, useOpen, useTip } from "./common";
import { TYPES } from "@/lib/logic";
import type { Graph, LinkType } from "@/lib/types";

const FLOW_TYPES: LinkType[] = ["prerequisite", "part_of", "causes", "example_of"];
const DASH: Record<string, string | undefined> = { prerequisite: undefined, part_of: "7 4", causes: undefined, example_of: "1.5 4" };
const WIDTH: Record<string, number> = { prerequisite: 1.6, part_of: 1.6, causes: 2.4, example_of: 2 };

/** Directional links laid out left to right: what you need first, and what it leads to. */
function layout(g: Graph, types: Set<LinkType>, withSuggested: boolean) {
  const links = g.links.filter((l) => types.has(l.type) && (withSuggested || l.status === "approved"));
  const ids = [...new Set(links.flatMap((l) => [l.from, l.to]))];
  const out = new Map<string, string[]>(), inc = new Map<string, string[]>();
  ids.forEach((i) => { out.set(i, []); inc.set(i, []); });
  links.forEach((l) => { out.get(l.from)!.push(l.to); inc.get(l.to)!.push(l.from); });
  // longest path from any root, ignoring edges that close a cycle
  const layer = new Map<string, number>();
  const visiting = new Set<string>();
  const depth = (id: string): number => {
    if (layer.has(id)) return layer.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const d = Math.max(0, ...inc.get(id)!.map((p) => (visiting.has(p) ? 0 : depth(p) + 1)));
    visiting.delete(id); layer.set(id, d);
    return d;
  };
  ids.forEach(depth);
  const nLayers = Math.max(0, ...layer.values()) + 1;
  const cols: string[][] = Array.from({ length: nLayers }, () => []);
  ids.forEach((i) => cols[layer.get(i)!].push(i));
  // order each column by the average position of its neighbors (a few sweeps)
  const pos = new Map<string, number>();
  cols.forEach((c) => c.forEach((id, i) => pos.set(id, i)));
  for (let pass = 0; pass < 6; pass++) {
    const range = pass % 2 ? [...cols.keys()].reverse() : [...cols.keys()];
    for (const ci of range) {
      const nb = (id: string) => [...(pass % 2 ? out.get(id)! : inc.get(id)!)].map((n) => pos.get(n)!).filter((v) => v != null);
      cols[ci].sort((a, b) => avg(nb(a), pos.get(a)!) - avg(nb(b), pos.get(b)!));
      cols[ci].forEach((id, i) => pos.set(id, i));
    }
  }
  const loose = g.concepts.filter((c) => !layer.has(c.id));
  return { links, cols, layer, pos, loose };
}
const avg = (a: number[], f: number) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : f);

export default function FlowView() {
  const { graph, T, toast, t: tr } = useGraph();
  const g = graph!;
  const tip = useTip();
  const open = useOpen();
  const [types, setTypes] = useState<Set<LinkType>>(new Set(FLOW_TYPES));
  const [sugg, setSugg] = useState(false);
  const L = useMemo(() => layout(g, types, sugg), [g, types, sugg]);

  const longest = Math.min(40, Math.max(14, ...L.cols.flat().map((id: string) => T(g.concepts.find((c) => c.id === id)?.label || { en: id, id }).length)));
  const BW = Math.max(168, Math.round(longest * 7.3 + 32)), BH = 46, GX = 80, GY = 18, PAD = 20;
  const rows = Math.max(1, ...L.cols.map((c) => c.length));
  const W = PAD * 2 + L.cols.length * BW + Math.max(0, L.cols.length - 1) * GX;
  const H = PAD * 2 + rows * BH + (rows - 1) * GY;
  const xy = (id: string) => {
    const col = L.layer.get(id)!, n = L.cols[col].length, i = L.pos.get(id)!;
    const offset = ((rows - n) * (BH + GY)) / 2;
    return { x: PAD + col * (BW + GX), y: PAD + offset + i * (BH + GY) };
  };
  const byId = (id: string) => g.concepts.find((c) => c.id === id)!;

  const mermaid = () => {
    const safe = (s: string) => s.replace(/"/g, "'");
    const lines = ["flowchart LR"];
    L.cols.flat().forEach((id) => lines.push(`  ${id}["${safe(T(byId(id).label))}"]`));
    L.links.forEach((l) => lines.push(`  ${l.from} ${l.type === "example_of" ? "-.->" : l.type === "part_of" ? "==>" : "-->"}|${T(TYPES[l.type].say)}| ${l.to}`));
    return lines.join("\n");
  };

  return (
    <div className="box">
      <div className="split" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ marginTop: 0 }}>{tr("Learning flow", "Alur belajar")}</h3>
          <p className="muted small" style={{ margin: 0 }}>{tr("Read left to right: each column builds on the ones before it. Only directional links are used.", "Baca dari kiri ke kanan: setiap kolom dibangun di atas kolom sebelumnya. Hanya tautan berarah yang dipakai.")}</p>
        </div>
        <div className="inline">
          {FLOW_TYPES.map((t) => (
            <button key={t} className="chip" aria-pressed={types.has(t)} onClick={() => { const s = new Set(types); s.has(t) ? s.delete(t) : s.add(t); setTypes(s); }}>
              <svg width="26" height="10" aria-hidden="true"><line x1="1" y1="5" x2="25" y2="5" stroke="var(--ink)" strokeWidth={WIDTH[t]} strokeDasharray={DASH[t]} /></svg>{T(TYPES[t].name)}
            </button>
          ))}
          <label className="inline small"><input type="checkbox" checked={sugg} onChange={(e) => setSugg(e.target.checked)} /> {tr("Include suggested", "Sertakan saran")}</label>
          <button className="btn small" onClick={async () => { try { await navigator.clipboard.writeText(mermaid()); toast(tr("Mermaid diagram copied", "Diagram Mermaid disalin")); } catch { toast(tr("Couldn't copy", "Gagal menyalin")); } }}>{tr("Copy as Mermaid", "Salin sebagai Mermaid")}</button>
        </div>
      </div>
      {L.cols.length === 0 ? <div className="empty" style={{ marginTop: 14 }}>{tr("No directional links of these types yet.", "Belum ada tautan berarah dengan jenis ini.")}</div> : (
        <div style={{ overflowX: "auto", marginTop: 12 }} onMouseLeave={tip.hide}>
          <svg width={W} height={H} role="img" aria-label={tr("Learning flow diagram", "Diagram alur belajar")}>
            <defs><marker id="flow-arr" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--edge)" /></marker>
              <marker id="flow-arr-acc" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--accent)" /></marker></defs>
            {L.cols.map((_, i) => <text key={i} x={PAD + i * (BW + GX) + BW / 2} y={12} fontSize={11} textAnchor="middle" fill="var(--muted)">{tr("Step", "Langkah")} {i + 1}</text>)}
            {L.links.map((l) => {
              const a = xy(l.from), b = xy(l.to);
              const back = L.layer.get(l.to)! <= L.layer.get(l.from)!;
              const x1 = a.x + BW, y1 = a.y + BH / 2, x2 = b.x, y2 = b.y + BH / 2;
              const d = back ? `M${a.x + BW / 2},${a.y + BH} C${a.x + BW / 2},${a.y + BH + 40} ${b.x + BW / 2},${b.y + BH + 40} ${b.x + BW / 2},${b.y + BH + 2}`
                : `M${x1},${y1} C${x1 + GX / 2},${y1} ${x2 - GX / 2},${y2} ${x2 - 2},${y2}`;
              const s = l.status === "suggested";
              return <path key={l.lid} d={d} fill="none" stroke={s ? "var(--accent)" : "var(--edge)"} strokeWidth={WIDTH[l.type]} strokeDasharray={s ? "4 4" : DASH[l.type]} markerEnd={`url(#${s ? "flow-arr-acc" : "flow-arr"})`}
                onMouseMove={(e) => tip.show(e, <>{T(byId(l.from).label)} {T(TYPES[l.type].say)} {T(byId(l.to).label)}{s ? tr(" (suggested)", " (saran)") : ""}</>)} style={{ cursor: "default" }} />;
            })}
            {L.cols.flat().map((id) => {
              const c = byId(id), p = xy(id);
              return (
                <g key={id} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }} onClick={() => open(id)} onMouseMove={(e) => tip.show(e, <ConceptTip c={c} g={g} />)}>
                  <rect width={BW} height={BH} rx={8} fill="var(--surface)" stroke={c.miscon ? "var(--danger)" : "var(--line)"} strokeWidth={c.miscon ? 2 : 1} />
                  <rect x={0} y={0} width={5} height={BH} rx={2} fill={mColor(c.mastery)} />
                  <text x={14} y={19} fontSize={12.5} fontWeight={500} fill="var(--ink)">{clip(T(c.label), 40)}</text>
                  <rect x={14} y={29} width={BW - 28} height={5} rx={2.5} fill="var(--line)" />
                  <rect x={14} y={29} width={((BW - 28) * c.mastery) / 100} height={5} rx={2.5} fill={mColor(c.mastery)} />
                </g>
              );
            })}
          </svg>
        </div>
      )}
      {L.loose.length > 0 && <p className="muted small" style={{ marginTop: 12 }}>{tr("Not in the flow yet", "Belum masuk alur")} ({L.loose.length}): {L.loose.map((c) => T(c.label)).join(", ")}. {tr("Give them a “needed for”, “part of” or “leads to” link to place them.", "Beri tautan “dibutuhkan untuk”, “bagian dari”, atau “menyebabkan” supaya masuk.")}</p>}
      {tip.el}
    </div>
  );
}
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
