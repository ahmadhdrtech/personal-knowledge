"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Page from "@/components/Page";
import { api, useGraph } from "@/components/store";
import { CalibrationBlock, CrossLinks, ImportReportCard, MasteryBlock, Overlaps, ReviewList, UpcomingList } from "@/components/HomePanel";
import { domainColor, Dot, fmtDate, NodeBtn } from "@/components/ui";
import { due, level } from "@/lib/logic";

type Attempt = { id: number; conceptId: string; kind: string; correct: boolean; score: number | null; confidence: string; delta: number; at: number };

export default function Dashboard() {
  const { graph, T, t } = useGraph();
  const [acts, setActs] = useState<Attempt[]>([]);
  const [spend, setSpend] = useState<{ spend: number; budget: number; calls: number } | null>(null);
  useEffect(() => {
    api<Attempt[]>("/api/activity").then(setActs).catch(() => {});
    api<any>("/api/usage?days=30").then((u) => setSpend({ spend: u.month.spend, budget: u.month.budget, calls: u.totals.calls })).catch(() => {});
  }, [graph?.calibration.total]);

  return (
    <Page title={t("Dashboard", "Dasbor")} lede={t("How your knowledge is growing: mastery, how well your confidence matches reality, and where topics meet.", "Perkembangan pengetahuanmu: penguasaan, seberapa tepat rasa yakinmu, dan di mana topik-topik bertemu.")}>
      {graph && <Body acts={acts} spend={spend} T={T} />}
    </Page>
  );
}

function Body({ acts, spend, T }: { acts: Attempt[]; spend: { spend: number; budget: number; calls: number } | null; T: ReturnType<typeof useGraph>["T"] }) {
  const { graph, t, lang } = useGraph();
  const g = graph!;
  const approved = g.links.filter((l) => l.status === "approved").length;
  const pending = g.links.length - approved;
  const avg = g.concepts.length ? Math.round(g.concepts.reduce((s, c) => s + c.mastery, 0) / g.concepts.length) : 0;
  const CONF_NAME: Record<string, string> = { guess: t("Guessing", "Menebak"), fair: t("Fairly sure", "Cukup yakin"), sure: t("Certain", "Yakin sekali") };
  return (
    <>
      <div className="grid3" style={{ marginBottom: 16 }}>
        <div className="stat"><div className="k">{t("Concepts", "Konsep")}</div><div className="v">{g.concepts.length}</div><div className="s">{t(`in ${g.domains.length} domains`, `dalam ${g.domains.length} domain`)}</div></div>
        <div className="stat"><div className="k">{t("Average mastery", "Rata-rata penguasaan")}</div><div className="v">{avg}%</div><div className="s">{g.concepts.filter((c) => level(c.mastery) === "solid").length} {t("solid", "kuat")}</div></div>
        <div className="stat"><div className="k">{t("Due for review", "Waktunya review")}</div><div className="v">{due(g.concepts).length}</div><div className="s">{g.concepts.filter((c) => c.miscon).length} {t("misconceptions", "miskonsepsi")}</div></div>
        <div className="stat"><div className="k">{t("Links", "Tautan")}</div><div className="v">{approved}</div><div className="s">{pending} {t("waiting for review", "menunggu diperiksa")}</div></div>
        <div className="stat"><div className="k">{t("Answers given", "Jawaban diberikan")}</div><div className="v">{g.calibration.total}</div><div className="s">{g.glossary.length} {t("glossary terms", "istilah glosarium")}</div></div>
        <div className="stat"><div className="k">{t("AI spend this month", "Biaya AI bulan ini")}</div><div className="v">${(spend?.spend ?? 0).toFixed(2)}</div><div className="s"><Link className="link" href="/usage">{spend ? t(`${spend.calls} calls in 30 days`, `${spend.calls} panggilan dalam 30 hari`) : t("Open usage", "Buka pemakaian")}</Link></div></div>
      </div>
      {g.lastImport && <div style={{ marginBottom: 16 }}><ImportReportCard /></div>}
      <div className="grid2">
        <div className="box">
          <h3>{t("Mastery", "Penguasaan")}</h3><MasteryBlock />
          <h3>{t("By domain", "Per domain")}</h3>
          <ul className="plain">{g.domains.map((d) => {
            const cs = g.concepts.filter((c) => c.domains.includes(d.key));
            const m = cs.length ? Math.round(cs.reduce((s, c) => s + c.mastery, 0) / cs.length) : 0;
            return <li key={d.key} className="row-item"><div className="split"><span><Dot color={domainColor(d.color)} /> {T(d.name)} <span className="muted small">· {cs.length}</span></span><span className="muted small">{m}%</span></div>
              <div className="hbar" style={{ marginTop: 6 }}><div style={{ width: `${m}%`, background: domainColor(d.color) }} /></div></li>;
          })}</ul>
        </div>
        <div className="box">
          <h3>{t("Confidence check", "Cek keyakinan")}</h3><CalibrationBlock />
          {g.calibration.total > 0 && <table className="t" style={{ marginTop: 10 }}><thead><tr><th>{t("When you say", "Saat kamu bilang")}</th><th className="num">{t("Answers", "Jawaban")}</th><th className="num">{t("Right", "Benar")}</th></tr></thead>
            <tbody>{(["sure", "fair", "guess"] as const).map((k) => <tr key={k}><td>{CONF_NAME[k]}</td><td className="num">{g.calibration[k].n}</td><td className="num">{g.calibration[k].n ? Math.round((g.calibration[k].right / g.calibration[k].n) * 100) + "%" : "–"}</td></tr>)}</tbody></table>}
          <h3>{t("Due for review", "Waktunya review")}</h3><ReviewList limit={5} />
          <h3>{t("Coming up", "Berikutnya")}</h3><UpcomingList limit={4} />
          <p className="small"><Link className="link" href="/review">{t("Open review", "Buka review")}</Link></p>
        </div>
        <div className="box"><Overlaps /></div>
        <div className="box"><CrossLinks /></div>
        <div className="box" style={{ gridColumn: "1 / -1" }}>
          <h3>{t("Recent answers", "Jawaban terakhir")}</h3>
          {acts.length ? <div style={{ overflowX: "auto" }}><table className="t"><thead><tr><th>{t("When", "Waktu")}</th><th>{t("Concept", "Konsep")}</th><th>{t("Type", "Jenis")}</th><th>{t("Confidence", "Keyakinan")}</th><th>{t("Result", "Hasil")}</th><th className="num">{t("Mastery", "Penguasaan")}</th></tr></thead>
            <tbody>{acts.slice(0, 12).map((a) => <tr key={a.id}><td className="muted">{fmtDate(a.at, lang)}</td><td><NodeBtn id={a.conceptId} /></td><td>{a.kind === "mcq" ? t("Multiple choice", "Pilihan ganda") : t("Essay", "Esai")}</td><td>{CONF_NAME[a.confidence]}</td>
              <td>{a.kind === "essay" ? `${a.score}/100` : a.correct ? <span className="badge ok">{t("Right", "Benar")}</span> : <span className="badge bad">{t("Wrong", "Salah")}</span>}</td><td className="num">{a.delta >= 0 ? "+" : "−"}{Math.abs(a.delta)}</td></tr>)}</tbody></table></div>
            : <p className="muted">{t("No answers yet. Open a concept and use the Test tab.", "Belum ada jawaban. Buka satu konsep lalu pakai tab Tes.")}</p>}
        </div>
      </div>
    </>
  );
}
