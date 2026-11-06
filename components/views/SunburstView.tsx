"use client";
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { useGraph } from "../store";
import { ConceptTip, MasteryKey, mColor, useOpen, useTip, useWidth, ZoomSvg } from "./common";
import { domainColor } from "../ui";
import type { Concept, Domain } from "@/lib/types";

type Node = { name: string; domain?: Domain; concept?: Concept; children?: Node[]; value?: number };

/** Domains as the inner ring, their concepts outside, colored by mastery. */
export default function SunburstView() {
  const { graph, T, t } = useGraph();
  const g = graph!;
  const [ref, w] = useWidth<HTMLDivElement>();
  const tip = useTip();
  const open = useOpen();
  const [size, setSize] = useState<"equal" | "sources" | "links">("equal");
  const [focus, setFocus] = useState<string | null>(null);

  // outer ring wide enough for the longest concept name; drawn at full size inside a zoomable frame
  const longest = Math.max(8, ...g.concepts.map((c) => T(c.label).length));
  const R = Math.max(Math.min(w, 620) / 2 - 10, 120 + longest * 6.4 / 0.42, (g.concepts.reduce((n, c) => n + c.domains.length, 0) * 15) / (2 * Math.PI) / 0.75);
  const root = useMemo(() => {
    const val = (c: Concept) => size === "equal" ? 1 : size === "sources" ? Math.max(1, c.sources.length) : Math.max(1, g.links.filter((l) => l.status === "approved" && (l.from === c.id || l.to === c.id)).length);
    const doms = focus ? g.domains.filter((d) => d.key === focus) : g.domains;
    const data: Node = { name: "root", children: doms.map((d) => ({ name: d.key, domain: d, children: g.concepts.filter((c) => c.domains.includes(d.key)).map((c) => ({ name: c.id, concept: c, value: val(c) })) })) };
    const h = d3.hierarchy(data).sum((d) => d.value || 0).sort((a, b) => (b.value || 0) - (a.value || 0));
    return d3.partition<Node>().size([2 * Math.PI, R])(h);
  }, [g, size, focus, R]);

  const inner = R * 0.26, mid = R * 0.5;
  const ringR = (depth: number) => (depth === 1 ? [inner, mid - 2] : [mid, R]);
  const arc = d3.arc<d3.HierarchyRectangularNode<Node>>()
    .startAngle((d) => d.x0).endAngle((d) => d.x1)
    .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.012)).padRadius(R)
    .innerRadius((d) => ringR(d.depth)[0]).outerRadius((d) => ringR(d.depth)[1]).cornerRadius(4);
  const nodes = root.descendants().filter((d) => d.depth > 0);
  const shared = g.concepts.filter((c) => c.domains.length > 1).length;

  return (
    <div className="grid2" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(240px,1fr)" }}>
      <div className="box" ref={ref}>
        <div className="split" style={{ flexWrap: "wrap" }}>
          <h3 style={{ marginTop: 0 }}>{t("Sunburst", "Sunburst")}</h3>
          <div className="seg" role="group" aria-label={t("Slice size", "Ukuran irisan")}>
            {([["equal", t("Equal", "Sama")], ["sources", t("By sources", "Per sumber")], ["links", t("By links", "Per tautan")]] as const).map(([k, l]) => <button key={k} aria-pressed={size === k} onClick={() => setSize(k)}>{l}</button>)}
          </div>
        </div>
        <p className="muted small" style={{ marginTop: 0 }}>{t("Inner ring: domains. Outer ring: their concepts, colored by mastery. A concept in two domains appears in both. Click a domain to zoom in, the center to zoom out.", "Lingkaran dalam: domain. Lingkaran luar: konsepnya, diwarnai menurut penguasaan. Konsep di dua domain muncul di keduanya. Klik domain untuk memperbesar, klik tengah untuk kembali.")}</p>
        <ZoomSvg viewBox={`${-R - 10} ${-R - 10} ${2 * R + 20} ${2 * R + 20}`} height={`min(80vh, ${Math.round(Math.max(420, w))}px)`} label={t("Sunburst of domains and concepts", "Sunburst domain dan konsep")} onMouseLeave={tip.hide}>
          <circle r={inner - 4} fill="var(--paper)" stroke="var(--line)" style={{ cursor: focus ? "pointer" : "default" }} onClick={() => setFocus(null)} />
          <text textAnchor="middle" y={-4} fontSize={22} fontFamily="Newsreader, Georgia, serif" fill="var(--ink)">{focus ? root.leaves().length : g.concepts.length}</text>
          <text textAnchor="middle" y={14} fontSize={11} fill="var(--muted)">{focus ? t("concepts · back", "konsep · kembali") : t("concepts", "konsep")}</text>
          {nodes.map((d) => {
            const isDom = d.depth === 1, c = d.data.concept;
            const fill = isDom ? domainColor(d.data.domain!.color) : mColor(c!.mastery);
            const ang = ((d.x0 + d.x1) / 2) * 180 / Math.PI, [r0, r1] = ringR(d.depth), rm = (r0 + r1) / 2;
            const arcLen = (d.x1 - d.x0) * rm;
            const label = isDom ? T(d.data.domain!.name) : T(c!.label);
            const fits = isDom ? arcLen > 46 : arcLen > 13;
            const maxChars = isDom ? Math.floor(arcLen / 7) : Math.floor((r1 - r0 - 8) / 6.2);
            return (
              <g key={`${d.parent?.data.name}-${d.data.name}`}>
                <path d={arc(d) || ""} fill={fill} fillOpacity={isDom ? 0.85 : 1} stroke={c?.miscon ? "var(--danger)" : "var(--surface)"} strokeWidth={c?.miscon ? 2.5 : 1}
                  style={{ cursor: "pointer" }} onClick={() => (isDom ? setFocus(focus ? null : d.data.domain!.key) : open(c!.id))}
                  onMouseMove={(e) => tip.show(e, isDom ? <>{label}: {d.children?.length || 0} {t("concepts", "konsep")}</> : <ConceptTip c={c!} g={g} />)} />
                {fits && (isDom ? (
                  <text transform={`rotate(${ang - 90}) translate(${rm},0) rotate(${ang > 180 ? 90 : -90})`} textAnchor="middle" dy="0.35em" fontSize={12} fontWeight={600} fill="#fff" style={{ pointerEvents: "none" }}>{clip(label, maxChars)}</text>
                ) : (
                  <text transform={`rotate(${ang - 90}) translate(${rm},0) rotate(${ang > 180 ? 180 : 0})`} textAnchor="middle" dy="0.35em" fontSize={10.5} fill="var(--ink)" style={{ pointerEvents: "none", paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3 }}>{clip(label, maxChars)}</text>
                ))}
              </g>
            );
          })}
        </ZoomSvg>
        <MasteryKey />
      </div>
      <div className="box">
        <h3 style={{ marginTop: 0 }}>{t("By domain", "Per domain")}</h3>
        <ul className="plain">{g.domains.map((d) => {
          const cs = g.concepts.filter((c) => c.domains.includes(d.key));
          const lv = { solid: cs.filter((c) => c.mastery >= 60).length, shaky: cs.filter((c) => c.mastery > 0 && c.mastery < 60).length, unseen: cs.filter((c) => c.mastery === 0).length };
          return <li key={d.key} className="row-item">
            <button className="link" onClick={() => setFocus(focus === d.key ? null : d.key)}>{T(d.name)}</button> <span className="muted small">· {cs.length}</span>
            <div className="stack" style={{ height: 8, margin: "6px 0 0" }}>{(["solid", "shaky", "unseen"] as const).map((l) => <div key={l} style={{ flex: lv[l], background: `var(--${l})` }} />)}</div>
          </li>;
        })}</ul>
        <p className="muted small">{t(`${shared} concepts belong to more than one domain.`, `${shared} konsep masuk ke lebih dari satu domain.`)}</p>
      </div>
      {tip.el}
    </div>
  );
}
const clip = (s: string, n: number) => (n < 3 ? "" : s.length > n ? s.slice(0, n - 1) + "…" : s);
