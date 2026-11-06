"use client";
import { useMemo, useState } from "react";
import { useGraph } from "../store";
import { LinkSentence, NodeBtn, Dot, domainColor } from "../ui";
import { useTip } from "./common";
import type { Domain, Link } from "@/lib/types";

type Cell = { a: Domain; b: Domain; shared: string[]; links: Link[]; avg: number };

/** Domains against domains: where topics share concepts and links. */
export default function MatrixView() {
  const { graph, T, t } = useGraph();
  const g = graph!;
  const tip = useTip();
  const [pick, setPick] = useState<Cell | null>(null);
  const byId = (id: string) => g.concepts.find((c) => c.id === id)!;

  const cells = useMemo(() => {
    const out: Cell[][] = g.domains.map((a) => g.domains.map((b) => {
      const shared = g.concepts.filter((c) => c.domains.includes(a.key) && c.domains.includes(b.key)).map((c) => c.id);
      const links = a.key === b.key ? g.links.filter((l) => l.status === "approved" && byId(l.from).domains.includes(a.key) && byId(l.to).domains.includes(a.key))
        : g.links.filter((l) => l.status === "approved" && ((byId(l.from).domains.includes(a.key) && byId(l.to).domains.includes(b.key)) || (byId(l.from).domains.includes(b.key) && byId(l.to).domains.includes(a.key))));
      const cs = shared.map(byId);
      return { a, b, shared, links, avg: cs.length ? Math.round(cs.reduce((s, c) => s + c.mastery, 0) / cs.length) : 0 };
    }));
    return out;
  }, [g]);

  const off = cells.flatMap((r, i) => r.filter((_, j) => j !== i));
  const maxOff = Math.max(1, ...off.map((c) => c.shared.length + c.links.length));
  const maxDiag = Math.max(1, ...cells.map((r, i) => r[i].shared.length));
  const n = g.domains.length, S = Math.max(58, Math.min(92, 560 / Math.max(1, n)));
  // room for the longest domain name on the left and for the slanted names on top
  const longest = Math.max(6, ...g.domains.map((d) => T(d.name).length));
  const LW = 34 + longest * 6.5, TOP = 24 + Math.round(longest * 6.5 * Math.sin((40 * Math.PI) / 180));
  const RIGHT = Math.round(longest * 6.5 * Math.cos((40 * Math.PI) / 180));
  const VW = Math.ceil(LW + n * S + RIGHT), VH = TOP + n * S + 10;

  return (
    <div className="grid2" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(260px,1fr)" }}>
      <div className="box">
        <h3 style={{ marginTop: 0 }}>{t("Domain matrix", "Matriks domain")}</h3>
        <p className="muted small" style={{ marginTop: 0 }}>{t("The diagonal counts concepts in each domain. Other cells count concepts the two domains share plus approved links between them. Darker means more connected. Click a cell for details.", "Diagonal menghitung konsep di tiap domain. Sel lain menghitung konsep yang dimiliki bersama oleh dua domain ditambah tautan yang disetujui di antara keduanya. Makin gelap makin terhubung. Klik sel untuk detailnya.")}</p>
        <div style={{ overflowX: "auto" }} onMouseLeave={tip.hide}>
          <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ maxWidth: VW, display: "block" }} role="img" aria-label={t("Matrix of how domains connect", "Matriks hubungan antardomain")}>
            {g.domains.map((d, j) => (
              <g key={d.key} transform={`translate(${LW + j * S + S / 2},${TOP - 8}) rotate(-40)`}>
                <text fontSize={12} fill="var(--ink)">{T(d.name)}</text>
              </g>
            ))}
            {g.domains.map((d, i) => (
              <g key={d.key}>
                <circle cx={10} cy={TOP + i * S + S / 2} r={5} fill={domainColor(d.color)} />
                <text x={22} y={TOP + i * S + S / 2 + 4} fontSize={12} fill="var(--ink)">{T(d.name)}</text>
              </g>
            ))}
            {cells.map((row, i) => row.map((c, j) => {
              const diag = i === j, v = diag ? c.shared.length : c.shared.length + c.links.length;
              const pct = Math.round((v / (diag ? maxDiag : maxOff)) * 70) + (v ? 8 : 0);
              const on = pick && pick.a.key === c.a.key && pick.b.key === c.b.key;
              return (
                <g key={`${i}-${j}`} transform={`translate(${LW + j * S},${TOP + i * S})`} style={{ cursor: "pointer" }} onClick={() => setPick(c)}
                  onMouseMove={(e) => tip.show(e, diag ? <>{T(c.a.name)}: {t(`${c.shared.length} concepts, ${c.links.length} links inside, average mastery ${c.avg}%`, `${c.shared.length} konsep, ${c.links.length} tautan di dalam, rata-rata penguasaan ${c.avg}%`)}</> : <>{T(c.a.name)} ∩ {T(c.b.name)}: {t(`${c.shared.length} shared concepts, ${c.links.length} links`, `${c.shared.length} konsep bersama, ${c.links.length} tautan`)}</>)}>
                  <rect x={2} y={2} width={S - 4} height={S - 4} rx={6}
                    fill={v ? `color-mix(in oklab, ${diag ? domainColor(c.a.color) : "var(--accent)"} ${pct}%, var(--surface))` : "var(--paper)"}
                    stroke={on ? "var(--ink)" : "var(--line)"} strokeWidth={on ? 2 : 1} />
                  <text x={S / 2} y={S / 2 + (diag ? 0 : -2)} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--ink)">{v || "·"}</text>
                  {!diag && v > 0 && <text x={S / 2} y={S / 2 + 15} textAnchor="middle" fontSize={10} fill="var(--ink)">{c.shared.length}{t("c", "k")} · {c.links.length}{t("l", "t")}</text>}
                  {diag && <text x={S / 2} y={S / 2 + 15} textAnchor="middle" fontSize={10} fill="var(--ink)">{c.avg}% {t("avg", "rata2")}</text>}
                </g>
              );
            }))}
          </svg>
        </div>
        <p className="muted small">{t("c = shared concepts, l = links. Empty cells are topics you haven’t connected yet; a source that touches both is the fastest way to bridge them.", "k = konsep bersama, t = tautan. Sel kosong adalah topik yang belum kamu hubungkan; sumber yang membahas keduanya adalah cara tercepat menjembataninya.")}</p>
      </div>
      <div className="box">
        {!pick ? <><h3 style={{ marginTop: 0 }}>{t("Details", "Detail")}</h3><p className="muted">{t("Click a cell to see the concepts and links behind it.", "Klik sel untuk melihat konsep dan tautan di baliknya.")}</p></> : (
          <>
            <h3 style={{ marginTop: 0 }}><Dot color={domainColor(pick.a.color)} /> {T(pick.a.name)}{pick.a.key !== pick.b.key && <> ∩ <Dot color={domainColor(pick.b.color)} /> {T(pick.b.name)}</>}</h3>
            <h3>{pick.a.key === pick.b.key ? t("Concepts", "Konsep") : t("Shared concepts", "Konsep bersama")} ({pick.shared.length})</h3>
            {pick.shared.length ? <ul className="plain">{pick.shared.map((id) => <li key={id} className="row-item split"><NodeBtn id={id} /><span className="muted small">{byId(id).mastery}%</span></li>)}</ul> : <p className="muted">{t("None.", "Tidak ada.")}</p>}
            <h3>{pick.a.key === pick.b.key ? t("Links inside", "Tautan di dalam") : t("Links between them", "Tautan di antaranya")} ({pick.links.length})</h3>
            {pick.links.length ? <ul className="plain">{pick.links.map((l) => <li key={l.lid} className="row-item"><LinkSentence l={l} /></li>)}</ul> : <p className="muted">{t("None yet.", "Belum ada.")}</p>}
          </>
        )}
      </div>
      {tip.el}
    </div>
  );
}
