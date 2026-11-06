"use client";
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { useGraph } from "../store";
import { ConceptTip, MasteryKey, mColor, useOpen, useTip, useWidth, ZoomSvg } from "./common";
import { domainColor } from "../ui";
import type { Concept, Graph } from "@/lib/types";

type N = { key: string; label: string; concept?: Concept; color?: string; children: N[] };

/** Parent of a concept: what it is part of, or an example of. */
function parents(g: Graph) {
  const p = new Map<string, string>();
  for (const l of g.links) {
    if (l.status !== "approved" || (l.type !== "part_of" && l.type !== "example_of") || p.has(l.from)) continue;
    // skip a link that would make a loop
    let cur: string | undefined = l.to, loop = false;
    for (let i = 0; cur && i < 50; i++) { if (cur === l.from) { loop = true; break; } cur = p.get(cur); }
    if (!loop) p.set(l.from, l.to);
  }
  return p;
}

function build(g: Graph, root: string, T: (o: any) => string, rootLabel: string): N {
  const par = parents(g);
  const kids = (id: string, seen: Set<string>): N[] => g.concepts.filter((c) => par.get(c.id) === id && !seen.has(c.id))
    .map((c) => { seen.add(c.id); return { key: c.id, label: T(c.label), concept: c, children: kids(c.id, seen) }; });
  if (root.startsWith("c:")) {
    const c = g.concepts.find((x) => x.id === root.slice(2));
    if (c) return { key: c.id, label: T(c.label), concept: c, children: kids(c.id, new Set([c.id])) };
  }
  const domains = root.startsWith("d:") ? g.domains.filter((d) => d.key === root.slice(2)) : g.domains;
  const placed = new Set<string>();
  const dn: N[] = domains.map((d) => {
    const tops = g.concepts.filter((c) => c.domains[0] === d.key && !par.has(c.id) || (root.startsWith("d:") && c.domains.includes(d.key) && !par.has(c.id)));
    return { key: `d-${d.key}`, label: T(d.name), color: domainColor(d.color), children: tops.filter((c) => !placed.has(c.id)).map((c) => { placed.add(c.id); return { key: c.id, label: T(c.label), concept: c, children: kids(c.id, placed) }; }) };
  });
  if (root.startsWith("d:")) return dn[0] || { key: "root", label: rootLabel, children: [] };
  return { key: "root", label: rootLabel, children: dn };
}

export default function MindMapView() {
  const { graph, T, t } = useGraph();
  const g = graph!;
  const [ref, w] = useWidth<HTMLDivElement>();
  const tip = useTip();
  const open = useOpen();
  const [root, setRoot] = useState("all");
  const tree = useMemo(() => build(g, root, T, t("Your map", "Petamu")), [g, root, T, t]);
  const count = (n: N): number => n.children.reduce((s, c) => s + 1 + count(c), 0);
  const total = count(tree);
  // big enough that neighbouring leaves get ~30px of arc each; the frame scales it to fit and you zoom in for detail
  const leaves = Math.max(1, d3.hierarchy(tree).leaves().length);
  const longest = Math.max(8, ...d3.hierarchy(tree).descendants().map((d) => d.data.label.length));
  const labelRoom = Math.min(220, longest * 6.6 + 16);
  const depthN = d3.hierarchy(tree).height || 1;
  const ring = Math.max(110, labelRoom + 30); // each ring is wide enough for a full label before the next ring starts
  const R = Math.max(ring * depthN, (leaves * 30) / (2 * Math.PI));
  const size = 2 * (R + labelRoom + 20);
  const h = d3.hierarchy(tree);
  const laid = d3.tree<N>().size([2 * Math.PI, Math.max(80, R)]).separation((a, b) => (a.parent === b.parent ? 1 : 2) / Math.max(1, a.depth))(h);
  const link = d3.linkRadial<d3.HierarchyPointLink<N>, d3.HierarchyPointNode<N>>().angle((d) => d.x).radius((d) => d.y);
  const nested = g.links.filter((l) => l.status === "approved" && (l.type === "part_of" || l.type === "example_of")).length;
  const sorted = [...g.concepts].sort((a, b) => T(a.label).localeCompare(T(b.label)));

  return (
    <div className="box" ref={ref}>
      <div className="split" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ marginTop: 0 }}>{t("Mind map", "Peta pikiran")}</h3>
          <p className="muted small" style={{ margin: 0 }}>{t("Your map as a tree: domains, then their concepts, then the parts and examples of each (from “part of” and “example of” links). Click a concept to make it the center.", "Petamu sebagai pohon: domain, lalu konsepnya, lalu bagian dan contoh dari tiap konsep (dari tautan “bagian dari” dan “contoh dari”). Klik konsep untuk menjadikannya pusat.")}</p>
        </div>
        <select className="field" style={{ width: "auto" }} value={root} onChange={(e) => setRoot(e.target.value)} aria-label={t("Center", "Pusat")}>
          <option value="all">{t("Whole map", "Seluruh peta")}</option>
          <optgroup label={t("Domain", "Domain")}>{g.domains.map((d) => <option key={d.key} value={`d:${d.key}`}>{T(d.name)}</option>)}</optgroup>
          <optgroup label={t("Concept", "Konsep")}>{sorted.map((c) => <option key={c.id} value={`c:${c.id}`}>{T(c.label)}</option>)}</optgroup>
        </select>
      </div>
      <ZoomSvg viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} height={`min(85vh, ${Math.max(520, Math.round(w))}px)`} label={t("Radial mind map", "Peta pikiran melingkar")} onMouseLeave={tip.hide}>
          {laid.links().map((l, i) => <path key={i} d={link(l) || ""} fill="none" stroke={l.target.data.concept ? "var(--edge)" : "var(--line)"} strokeOpacity={0.7} strokeWidth={l.source.depth === 0 ? 1.6 : 1.2} />)}
          {laid.descendants().map((d) => {
            const c = d.data.concept, a = (d.x * 180) / Math.PI - 90, isRoot = d.depth === 0, right = d.x < Math.PI;
            const r = isRoot ? 12 : c ? 7 : 9;
            const px = Math.cos(d.x - Math.PI / 2) * d.y, py = Math.sin(d.x - Math.PI / 2) * d.y;
            if (!c && !isRoot) return (
              <g key={d.data.key + d.depth} transform={`translate(${px},${py})`} style={{ cursor: "pointer" }} onClick={() => setRoot(root.startsWith("d:") ? "all" : `d:${d.data.key.slice(2)}`)} onMouseMove={tip.hide}>
                <circle r={r} fill={d.data.color || "var(--ink)"} stroke="var(--surface)" strokeWidth={1.5} />
                <text y={-r - 6} textAnchor="middle" fontSize={12.5} fontWeight={600} fill={d.data.color || "var(--ink)"} style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 6, strokeLinejoin: "round", pointerEvents: "none" }}>{d.data.label}</text>
              </g>
            );
            return (
              <g key={d.data.key + d.depth} transform={isRoot ? undefined : `rotate(${a}) translate(${d.y},0)`} style={{ cursor: c ? "pointer" : "default" }}
                onClick={() => (c ? setRoot(`c:${c.id}`) : d.data.key.startsWith("d-") ? setRoot(`d:${d.data.key.slice(2)}`) : setRoot("all"))}
                onDoubleClick={() => c && open(c.id)}
                onMouseMove={(e) => c ? tip.show(e, <ConceptTip c={c} g={g} extra={<div className="small">{t("Click to center · double-click to open", "Klik untuk ke tengah · klik dua kali untuk membuka")}</div>} />) : tip.hide()}>
                <circle r={r} fill={c ? mColor(c.mastery) : d.data.color || "var(--ink)"} stroke={c?.miscon ? "var(--danger)" : "var(--surface)"} strokeWidth={c?.miscon ? 2.5 : 1.5} />
                <text dy="0.32em" x={isRoot ? 0 : right ? r + 5 : -(r + 5)} y={isRoot ? r + 16 : 0} textAnchor={isRoot ? "middle" : right ? "start" : "end"}
                  transform={isRoot || right ? undefined : "rotate(180)"} fontSize={isRoot ? 14 : c ? 11.5 : 12.5} fontWeight={c ? 400 : 600}
                  fill={c ? "var(--ink)" : d.data.color || "var(--ink)"} style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 4, pointerEvents: "none" }}>{d.data.label}</text>
              </g>
            );
          })}
      </ZoomSvg>
      <MasteryKey />
      <p className="muted small">{nested ? t(`${nested} “part of” or “example of” links shape the branches.`, `${nested} tautan “bagian dari” atau “contoh dari” membentuk cabang-cabangnya.`) : t("No “part of” or “example of” links yet, so every concept sits directly under its domain. Add some to grow branches.", "Belum ada tautan “bagian dari” atau “contoh dari”, jadi semua konsep langsung di bawah domainnya. Tambahkan supaya cabangnya tumbuh.")}</p>
      {tip.el}
    </div>
  );
}
