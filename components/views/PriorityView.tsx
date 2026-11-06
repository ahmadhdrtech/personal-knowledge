"use client";
import { useMemo } from "react";
import * as d3 from "d3";
import { useGraph } from "../store";
import { ConceptTip, degree, MasteryKey, mColor, placeLabels, useOpen, useTip, useWidth } from "./common";

/** Mastery vs. how connected a concept is. Weak hubs hold up the most of your map. */
export default function PriorityView() {
  const { graph, T, t } = useGraph();
  const g = graph!;
  const [ref, w] = useWidth<HTMLDivElement>();
  const tip = useTip();
  const open = useOpen();
  const H = Math.max(520, Math.min(900, 300 + g.concepts.length * 14)), m = { t: 24, r: 24, b: 46, l: 52 };

  const data = useMemo(() => g.concepts.map((c) => ({ c, deg: degree(g, c.id) })), [g]);
  const maxDeg = Math.max(4, ...data.map((d) => d.deg));
  const x = d3.scaleLinear().domain([0, maxDeg + 0.5]).range([m.l, w - m.r]);
  const y = d3.scaleLinear().domain([0, 100]).range([H - m.b, m.t]);
  const r = (n: number) => 6 + Math.min(n, 5) * 2.2;
  const splitX = Math.max(2, d3.median(data, (d) => d.deg) ?? 2);

  // nudge points apart so labels don't sit on top of each other
  const pts = useMemo(() => {
    const nodes = data.map((d) => ({ ...d, tx: x(d.deg), ty: y(d.c.mastery), x: x(d.deg), y: y(d.c.mastery) }));
    const sim = d3.forceSimulation(nodes as any)
      .force("x", d3.forceX((d: any) => d.tx).strength(0.35))
      .force("y", d3.forceY((d: any) => d.ty).strength(0.6))
      .force("c", d3.forceCollide((d: any) => r(d.c.sources.length) + 6))
      .stop();
    for (let i = 0; i < 200; i++) sim.tick();
    const lab = placeLabels(nodes.map((n) => ({ id: n.c.id, x: n.x, y: n.y, r: r(n.c.sources.length), text: T(n.c.label), weight: r(n.c.sources.length) + (n.c.miscon ? 20 : 0) + n.deg })), { x0: m.l, y0: 2, x1: w - 2, y1: H - m.b - 2 }, 11, [
      // the four corner captions
      { x0: w - m.r - 190, y0: m.t, x1: w - m.r, y1: m.t + 34 }, { x0: m.l, y0: m.t, x1: m.l + 170, y1: m.t + 34 },
      { x0: w - m.r - 190, y0: H - m.b - 48, x1: w - m.r, y1: H - m.b - 14 }, { x0: m.l, y0: H - m.b - 48, x1: m.l + 170, y1: H - m.b - 14 },
    ]);
    return nodes.map((n) => ({ ...n, lab: lab[n.c.id] }));
  }, [data, w, H, T]);

  const priority = [...data]
    .map((d) => ({ ...d, score: (d.deg + 1) * (100 - d.c.mastery) + (d.c.miscon ? 400 : 0) }))
    .filter((d) => d.c.mastery < 60 || d.c.miscon)
    .sort((a, b) => b.score - a.score).slice(0, 6);

  const qx = x(splitX), qy = y(60);
  const Q = ({ x1, y1, label, sub, anchor }: { x1: number; y1: number; label: string; sub: string; anchor: "start" | "end" }) => (
    <g><text x={x1} y={y1} textAnchor={anchor} fontSize={12} fontWeight={600} fill="var(--muted)">{label}</text>
      <text x={x1} y={y1 + 15} textAnchor={anchor} fontSize={11} fill="var(--muted)">{sub}</text></g>
  );

  return (
    <div className="grid2" style={{ gridTemplateColumns: "minmax(0,2.2fr) minmax(260px,1fr)" }}>
      <div className="box" ref={ref}>
        <h3 style={{ marginTop: 0 }}>{t("Mastery vs. connections", "Penguasaan vs. koneksi")}</h3>
        <p className="muted small" style={{ marginTop: 0 }}>{t("Each dot is a concept. Right means more links to other concepts; up means better mastery. Dot size is the number of sources.", "Setiap titik adalah satu konsep. Makin ke kanan makin banyak tautannya; makin ke atas makin dikuasai. Ukuran titik = jumlah sumber.")}</p>
        <svg width="100%" viewBox={`0 0 ${w} ${H}`} role="img" aria-label={t("Scatter plot of mastery against number of links", "Diagram sebar penguasaan terhadap jumlah tautan")} onMouseLeave={tip.hide}>
          <rect x={qx} y={qy} width={w - m.r - qx} height={H - m.b - qy} fill="var(--danger-soft)" opacity={0.55} rx={6} />
          <line x1={qx} x2={qx} y1={m.t} y2={H - m.b} stroke="var(--line)" strokeDasharray="4 4" />
          <line x1={m.l} x2={w - m.r} y1={qy} y2={qy} stroke="var(--line)" strokeDasharray="4 4" />
          {y.ticks(5).map((t) => <g key={t}><line x1={m.l - 4} x2={m.l} y1={y(t)} y2={y(t)} stroke="var(--edge)" /><text x={m.l - 8} y={y(t) + 4} fontSize={11} textAnchor="end" fill="var(--muted)">{t}%</text></g>)}
          {x.ticks(Math.min(maxDeg, 8)).filter(Number.isInteger).map((t) => <g key={t}><line x1={x(t)} x2={x(t)} y1={H - m.b} y2={H - m.b + 4} stroke="var(--edge)" /><text x={x(t)} y={H - m.b + 17} fontSize={11} textAnchor="middle" fill="var(--muted)">{t}</text></g>)}
          <line x1={m.l} x2={w - m.r} y1={H - m.b} y2={H - m.b} stroke="var(--edge)" />
          <text x={(m.l + w - m.r) / 2} y={H - 8} fontSize={12} textAnchor="middle" fill="var(--muted)">{t("Approved links", "Tautan disetujui")}</text>
          <text transform={`translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)`} fontSize={12} textAnchor="middle" fill="var(--muted)">{t("Mastery", "Penguasaan")}</text>
          <Q x1={w - m.r - 8} y1={H - m.b - 34} label={t("Study first", "Pelajari dulu")} sub={t("well connected, still weak", "banyak tautan, masih lemah")} anchor="end" />
          <Q x1={w - m.r - 8} y1={m.t + 14} label={t("Strong hubs", "Pusat yang kuat")} sub={t("they hold your map together", "penopang petamu")} anchor="end" />
          <Q x1={m.l + 8} y1={H - m.b - 34} label={t("Loose ends", "Ujung lepas")} sub={t("weak and barely linked", "lemah dan jarang tertaut")} anchor="start" />
          <Q x1={m.l + 8} y1={m.t + 14} label={t("Solid details", "Detail yang kuat")} sub={t("known, few links", "dikuasai, sedikit tautan")} anchor="start" />
          {pts.map((p) => (
            <g key={p.c.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }} onClick={() => open(p.c.id)}
              onMouseMove={(e) => tip.show(e, <ConceptTip c={p.c} g={g} />)} tabIndex={0} role="button" aria-label={`${T(p.c.label)}, ${p.c.mastery}%`}
              onKeyDown={(e) => { if (e.key === "Enter") open(p.c.id); }}>
              <circle r={r(p.c.sources.length)} fill={mColor(p.c.mastery)} stroke={p.c.miscon ? "var(--danger)" : "var(--surface)"} strokeWidth={p.c.miscon ? 3 : 2} />
            </g>
          ))}
          {pts.map((p) => p.lab.show && (
            <g key={"l" + p.c.id} style={{ pointerEvents: "none" }}>
              {p.lab.leader && <line x1={p.lab.leader[0]} y1={p.lab.leader[1]} x2={p.lab.leader[2]} y2={p.lab.leader[3]} stroke="var(--edge)" strokeWidth={1} />}
              <text x={p.lab.x} y={p.lab.y} fontSize={11} textAnchor={p.lab.anchor} fill="var(--ink)" style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 4 }}>{T(p.c.label)}</text>
            </g>
          ))}
        </svg>
        <MasteryKey />
      </div>
      <div className="box">
        <h3 style={{ marginTop: 0 }}>{t("Study these first", "Pelajari ini dulu")}</h3>
        <p className="muted small">{t("Ranked by how many concepts depend on them and how weak they are. Misconceptions jump the queue.", "Diurutkan dari berapa banyak konsep yang bergantung padanya dan seberapa lemah. Miskonsepsi didahulukan.")}</p>
        {priority.length ? <ol style={{ paddingLeft: 20, margin: 0 }}>{priority.map((d) => (
          <li key={d.c.id} style={{ padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
            <button className="link" onClick={() => open(d.c.id, "test")}>{T(d.c.label)}</button>
            {d.c.miscon && <span className="pill bad">{t("Misconception", "Miskonsepsi")}</span>}
            <div className="muted small">{d.c.mastery}% {t("mastery", "penguasaan")} · {d.deg} {t(d.deg === 1 ? "link" : "links", "tautan")}</div>
          </li>
        ))}</ol> : <p className="muted">{t("Nothing weak right now.", "Tidak ada yang lemah saat ini.")}</p>}
      </div>
      {tip.el}
    </div>
  );
}
