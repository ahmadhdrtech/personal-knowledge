"use client";
import { useEffect, useState } from "react";
import * as d3 from "d3";
import { api, useGraph } from "../store";
import { useOpen, useWidth } from "./common";
import type { Bi } from "@/lib/types";

type Day = { day: number; avg: number | null; answers: number; right: number; solid: number; concepts: number };
type Change = { id: string; label: Bi; now: number; before: number; gain: number; miscon: boolean; answers: number };
type P = { days: number; daily: Day[]; streak: number; improved: Change[]; slipping: Change[]; totals: { answers: number; right: number; activeDays: number } };

/** Mastery over time, rebuilt from your answers. */
export default function ProgressView() {
  const { graph, T, t, lang } = useGraph();
  const [days, setDays] = useState(30);
  const [p, setP] = useState<P | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [ref, w] = useWidth<HTMLDivElement>();
  const open = useOpen();
  useEffect(() => { api<P>(`/api/progress?days=${days}`).then(setP).catch(() => {}); }, [days, graph?.calibration.total]);

  const fmt = (ms: number) => new Date(ms).toLocaleDateString(lang === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "short" });
  if (!p) return <p className="muted">{t("Loading…", "Memuat…")}</p>;
  const known = p.daily.filter((d) => d.avg != null);
  const first = known[0] || p.daily[0], last = p.daily[p.daily.length - 1];
  const change = Math.round(((last.avg ?? 0) - (first.avg ?? 0)) * 10) / 10;
  const acc = p.totals.answers ? Math.round((p.totals.right / p.totals.answers) * 100) : null;

  const H1 = 220, H2 = 110, m = { l: 40, r: 14, t: 12, b: 24 };
  const x = d3.scaleBand<number>().domain(p.daily.map((d) => d.day)).range([m.l, w - m.r]).paddingInner(0.25);
  const xc = (d: number) => (x(d) ?? 0) + x.bandwidth() / 2;
  const lo = Math.max(0, Math.floor((d3.min(known, (d) => d.avg as number) ?? 0) / 10) * 10 - 10), hi = Math.min(100, Math.ceil((d3.max(known, (d) => d.avg as number) ?? 100) / 10) * 10 + 10);
  const y = d3.scaleLinear().domain([lo, hi]).range([H1 - m.b, m.t]);
  const line = d3.line<Day>().defined((d) => d.avg != null).x((d) => xc(d.day)).y((d) => y(d.avg as number)).curve(d3.curveMonotoneX);
  const area = d3.area<Day>().defined((d) => d.avg != null).x((d) => xc(d.day)).y0(H1 - m.b).y1((d) => y(d.avg as number)).curve(d3.curveMonotoneX);
  const maxA = Math.max(1, d3.max(p.daily, (d) => d.answers) ?? 1);
  const ya = d3.scaleLinear().domain([0, maxA]).range([H2 - m.b, m.t]);
  const hd = hover != null ? p.daily[hover] : null;
  const tickEvery = Math.ceil(p.daily.length / 6);
  const pick = (e: React.MouseEvent<SVGElement>) => {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * w;
    let best = 0, bd = Infinity;
    p.daily.forEach((d, i) => { const dd = Math.abs(xc(d.day) - px); if (dd < bd) { bd = dd; best = i; } });
    setHover(best);
  };

  const List = ({ title, rows, empty, sign }: { title: string; rows: Change[]; empty: string; sign: 1 | -1 }) => (
    <div className="box">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {rows.length ? <ul className="plain">{rows.map((r) => (
        <li key={r.id} className="row-item split">
          <span><button className="link" onClick={() => open(r.id, "test")}>{T(r.label)}</button>{r.miscon && <span className="pill bad">{t("Misconception", "Miskonsepsi")}</span>}</span>
          <span className="small" style={{ color: sign > 0 ? "var(--solid)" : r.gain < 0 ? "var(--danger)" : "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{r.before}% → {r.now}%</span>
        </li>
      ))}</ul> : <p className="muted small">{empty}</p>}
    </div>
  );

  return (
    <>
      <div className="split" style={{ marginBottom: 12 }}>
        <span />
        <div className="seg" role="group" aria-label={t("Time range", "Rentang waktu")}>{[30, 90, 365].map((d) => <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>{d === 365 ? t("1 year", "1 tahun") : t(`${d} days`, `${d} hari`)}</button>)}</div>
      </div>
      <div className="grid3" style={{ marginBottom: 16 }}>
        <div className="stat"><div className="k">{t("Average mastery", "Rata-rata penguasaan")}</div><div className="v">{last.avg ?? 0}%</div><div className="s" style={{ color: change > 0 ? "var(--solid)" : change < 0 ? "var(--danger)" : undefined }}>{change > 0 ? "+" : ""}{change} {t(`in ${days} days`, `dalam ${days} hari`)}</div></div>
        <div className="stat"><div className="k">{t("Solid concepts", "Konsep kuat")}</div><div className="v">{last.solid}</div><div className="s">{t(`was ${first.solid}`, `sebelumnya ${first.solid}`)} · {t(`of ${last.concepts}`, `dari ${last.concepts}`)}</div></div>
        <div className="stat"><div className="k">{t("Answers", "Jawaban")}</div><div className="v">{p.totals.answers}</div><div className="s">{acc != null ? t(`${acc}% right`, `${acc}% benar`) : t("none yet", "belum ada")}</div></div>
        <div className="stat"><div className="k">{t("Streak", "Hari beruntun")}</div><div className="v">{p.streak}</div><div className="s">{t(`days in a row · ${p.totals.activeDays} active days`, `hari berturut-turut · ${p.totals.activeDays} hari aktif`)}</div></div>
      </div>
      <div className="box" ref={ref} style={{ marginBottom: 16 }}>
        <div className="split"><h3 style={{ margin: 0 }}>{t("Average mastery", "Rata-rata penguasaan")}</h3>
          <span className="muted small">{hd ? `${fmt(hd.day)} · ${hd.avg ?? "–"}% · ${t(`${hd.answers} answers`, `${hd.answers} jawaban`)}` : t("Hover the chart for a day", "Arahkan ke grafik untuk melihat per hari")}</span></div>
        <svg width="100%" viewBox={`0 0 ${w} ${H1}`} role="img" aria-label={t("Line chart of average mastery per day", "Grafik garis rata-rata penguasaan per hari")} onMouseMove={pick} onMouseLeave={() => setHover(null)}>
          {y.ticks(4).map((v) => <g key={v}><line x1={m.l} x2={w - m.r} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray="2 4" /><text x={m.l - 6} y={y(v) + 4} fontSize={11} textAnchor="end" fill="var(--muted)">{v}%</text></g>)}
          <path d={area(p.daily) || ""} fill="var(--accent)" opacity={0.08} />
          <path d={line(p.daily) || ""} fill="none" stroke="var(--accent)" strokeWidth={2} />
          {hd && hd.avg != null && <><line x1={xc(hd.day)} x2={xc(hd.day)} y1={m.t} y2={H1 - m.b} stroke="var(--edge)" /><circle cx={xc(hd.day)} cy={y(hd.avg)} r={4.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} /></>}
          {p.daily.map((d, i) => i % tickEvery === 0 ? <text key={d.day} x={xc(d.day)} y={H1 - 6} fontSize={11} textAnchor="middle" fill="var(--muted)">{fmt(d.day)}</text> : null)}
        </svg>
        <div className="split" style={{ marginTop: 10 }}><h3 style={{ margin: 0 }}>{t("Answers per day", "Jawaban per hari")}</h3>
          <div className="keys"><span><span className="dot" style={{ background: "var(--accent)" }} /> {t("Right", "Benar")}</span><span><span className="dot" style={{ background: "var(--unseen)" }} /> {t("Wrong", "Salah")}</span></div></div>
        <svg width="100%" viewBox={`0 0 ${w} ${H2}`} role="img" aria-label={t("Bar chart of answers per day", "Diagram batang jawaban per hari")} onMouseMove={pick} onMouseLeave={() => setHover(null)}>
          <line x1={m.l} x2={w - m.r} y1={H2 - m.b} y2={H2 - m.b} stroke="var(--line)" />
          <text x={m.l - 6} y={ya(maxA) + 4} fontSize={11} textAnchor="end" fill="var(--muted)">{maxA}</text>
          {p.daily.map((d, i) => {
            const bw = Math.max(2, x.bandwidth()), x0 = x(d.day) ?? 0;
            const hr = H2 - m.b - ya(d.right), hw = ya(d.right) - ya(d.answers);
            return <g key={d.day} opacity={hover == null || hover === i ? 1 : 0.55}>
              {d.answers - d.right > 0 && <rect x={x0} y={ya(d.answers)} width={bw} height={Math.max(0, hw - (d.right ? 1 : 0))} rx={2} fill="var(--unseen)" />}
              {d.right > 0 && <rect x={x0} y={ya(d.right)} width={bw} height={hr} rx={2} fill="var(--accent)" />}
            </g>;
          })}
          {p.daily.map((d, i) => i % tickEvery === 0 ? <text key={d.day} x={xc(d.day)} y={H2 - 6} fontSize={11} textAnchor="middle" fill="var(--muted)">{fmt(d.day)}</text> : null)}
        </svg>
        <p className="muted small" style={{ margin: "6px 0 0" }}>{t("Rebuilt from your answers, so changes made before an answer was recorded (or bonus points from bridge questions) aren’t shown.", "Dibangun ulang dari jawabanmu, jadi perubahan sebelum ada jawaban tercatat (atau poin bonus soal jembatan) tidak terlihat.")}</p>
      </div>
      <div className="grid2">
        <List title={t("Most improved", "Paling meningkat")} rows={p.improved} sign={1} empty={t("Answer some test questions to see progress here.", "Jawab beberapa soal tes untuk melihat perkembangannya di sini.")} />
        <List title={t("Slipping or misunderstood", "Menurun atau salah paham")} rows={p.slipping} sign={-1} empty={t("Nothing is slipping.", "Tidak ada yang menurun.")} />
      </div>
    </>
  );
}
