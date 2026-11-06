"use client";
import { useEffect, useState } from "react";
import Page from "@/components/Page";
import { api, errText, useGraph } from "@/components/store";
import { fmtDate } from "@/components/ui";
import type { UsageGroup, UsageSummary } from "@/lib/ai/usage";

type Tr = (en: string, id: string) => string;
const featureName = (t: Tr): Record<string, string> => ({
  import: t("Add source", "Tambah sumber"), vocab: t("Vocab suggestions", "Saran istilah"), mcq: t("Multiple-choice question", "Soal pilihan ganda"),
  bridge_question: t("Bridge question", "Soal jembatan"), essay_question: t("Essay question", "Soal esai"), essay_grade: t("Essay grading", "Penilaian esai"),
  discuss: t("Discussion", "Diskusi"), test: t("Model test", "Tes model"),
  assistant: t("Assistant", "Asisten"), index: t("Search index", "Indeks pencarian"), search: t("Search", "Pencarian"),
});
const depthName = (t: Tr): Record<string, string> => ({ quick: t("Quick", "Cepat"), balanced: t("Balanced", "Seimbang"), deep: t("Deep", "Mendalam"), manual: t("Test", "Tes"), search: t("Search", "Pencarian") });
const usd = (n: number) => (n === 0 ? "$0" : n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`);
const num = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.round(n / 1000)}k` : n.toLocaleString());

export default function UsagePage() {
  const { t } = useGraph();
  const [days, setDays] = useState(30);
  const [u, setU] = useState<UsageSummary | null>(null);
  const [err, setErr] = useState("");
  const [metric, setMetric] = useState<"cost" | "calls" | "tokens">("cost");
  const load = () => api<UsageSummary>(`/api/usage?days=${days}`).then(setU).catch((e) => setErr(errText(e)));
  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, [days]);

  return (
    <Page title={t("Usage", "Pemakaian")} lede={t("Every AI call is logged here: which model, what for, tokens, cost and speed. Updates every 15 seconds while this page is open.", "Setiap panggilan AI tercatat di sini: model apa, untuk apa, token, biaya, dan kecepatan. Diperbarui tiap 15 detik selama halaman ini terbuka.")}
      actions={<div className="seg" role="group" aria-label={t("Time range", "Rentang waktu")}>
        {([[1, t("Today", "Hari ini")], [7, t("7 days", "7 hari")], [30, t("30 days", "30 hari")], [0, t("All", "Semua")]] as const).map(([d, l]) => <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>{l}</button>)}
      </div>}>
      {err && <p className="err">{err}</p>}
      {!u ? <p className="muted">{t("Loading…", "Memuat…")}</p> : <Body u={u} days={days} metric={metric} setMetric={setMetric} setU={setU} />}
    </Page>
  );
}

function Body({ u, days, metric, setMetric, setU }: { u: UsageSummary; days: number; metric: "cost" | "calls" | "tokens"; setMetric: (m: "cost" | "calls" | "tokens") => void; setU: (u: UsageSummary) => void }) {
  const { t, lang } = useGraph();
  const tot = u.totals, F = featureName(t), D = depthName(t);
  return (
    <>
      <div className="grid3" style={{ marginBottom: 16 }}>
        <div className="stat"><div className="k">{t("Cost", "Biaya")}</div><div className="v">{usd(tot.cost)}</div><div className="s">{tot.estimatedShare > 0 ? t(`${Math.round(tot.estimatedShare * 100)}% of calls estimated`, `${Math.round(tot.estimatedShare * 100)}% panggilan diperkirakan`) : t("from provider token counts", "dari jumlah token penyedia")}</div></div>
        <div className="stat"><div className="k">{t("Calls", "Panggilan")}</div><div className="v">{tot.calls}</div><div className="s">{tot.errors ? t(`${tot.errors} failed or stopped`, `${tot.errors} gagal atau dihentikan`) : t("no failures", "tidak ada yang gagal")}</div></div>
        <div className="stat"><div className="k">{t("Tokens", "Token")}</div><div className="v">{num(tot.input + tot.output)}</div><div className="s">{num(tot.input)} {t("in", "masuk")} · {num(tot.output)} {t("out", "keluar")}</div></div>
        <div className="stat"><div className="k">{t("Average response time", "Rata-rata waktu respons")}</div><div className="v">{(tot.avgLatency / 1000).toFixed(1)}s</div><div className="s">{t("per call", "per panggilan")}</div></div>
      </div>
      <Budget u={u} days={days} setU={setU} />
      <div className="box" style={{ marginBottom: 16 }}>
        <div className="split"><h3 style={{ margin: 0 }}>{metric === "cost" ? t("Cost per day", "Biaya per hari") : metric === "calls" ? t("Calls per day", "Panggilan per hari") : t("Tokens per day", "Token per hari")}</h3>
          <div className="seg" role="group" aria-label={t("Metric", "Ukuran")}>{(["cost", "calls", "tokens"] as const).map((m) => <button key={m} aria-pressed={metric === m} onClick={() => setMetric(m)}>{m === "cost" ? t("Cost", "Biaya") : m === "calls" ? t("Calls", "Panggilan") : t("Tokens", "Token")}</button>)}</div></div>
        <DayChart u={u} metric={metric} />
      </div>
      <div className="grid2" style={{ marginBottom: 16 }}>
        <GroupTable title={t("By model", "Per model")} head={t("Model", "Model")} rows={u.byModel} total={tot.cost} />
        <GroupTable title={t("By feature", "Per fitur")} head={t("Feature", "Fitur")} rows={u.byFeature.map((g) => ({ ...g, label: F[g.key] || g.key }))} total={tot.cost} />
      </div>
      <h3>{t("Recent calls", "Panggilan terakhir")}</h3>
      {u.recent.length ? <div className="tablewrap"><table className="t">
        <thead><tr><th>{t("When", "Waktu")}</th><th>{t("Feature", "Fitur")}</th><th>{t("Model", "Model")}</th><th>{t("Depth", "Tingkat")}</th><th className="num">{t("In", "Masuk")}</th><th className="num">{t("Out", "Keluar")}</th><th className="num">{t("Cost", "Biaya")}</th><th className="num">{t("Time", "Durasi")}</th><th>{t("Status", "Status")}</th></tr></thead>
        <tbody>{u.recent.map((r) => (
          <tr key={r.id}>
            <td className="muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(r.createdAt, lang)}</td>
            <td>{F[r.feature] || r.feature}</td>
            <td><span className="mono">{r.modelId}</span><div className="muted small">{r.providerName}</div></td>
            <td>{D[r.depth] || r.depth}</td>
            <td className="num">{num(r.inputTokens)}{r.estimated ? "*" : ""}</td><td className="num">{num(r.outputTokens)}{r.estimated ? "*" : ""}</td>
            <td className="num">{usd(r.costUsd)}</td><td className="num">{(r.latencyMs / 1000).toFixed(1)}s</td>
            <td>{r.status === "ok" ? <span className="badge ok">OK</span> : <span className="badge bad" title={r.error || ""}>{r.status === "aborted" ? t("Stopped", "Dihentikan") : t("Failed", "Gagal")}</span>}
              {r.error && r.status !== "ok" && <div className="muted small" style={{ maxWidth: 260 }}>{r.error.slice(0, 120)}</div>}</td>
          </tr>
        ))}</tbody>
      </table></div> : <div className="empty">{t("No AI calls in this range yet.", "Belum ada panggilan AI di rentang ini.")}</div>}
      <p className="muted small" style={{ marginTop: 10 }}>{t("* Estimated: the provider didn’t report tokens, so they’re counted as about 4 characters per token. Costs use the prices set in Models, except OpenRouter, which reports the real cost.", "* Perkiraan: penyedia tidak melaporkan token, jadi dihitung sekitar 4 karakter per token. Biaya memakai harga yang kamu isi di Model, kecuali OpenRouter yang melaporkan biaya sebenarnya.")}</p>
      <ClearUsage days={days} setU={setU} />
    </>
  );
}

function DayChart({ u, metric }: { u: UsageSummary; metric: "cost" | "calls" | "tokens" }) {
  const { t, lang } = useGraph();
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const val = (d: UsageSummary["byDay"][number]) => (metric === "cost" ? d.cost : metric === "calls" ? d.calls : d.tokens);
  const max = Math.max(...u.byDay.map(val), 0);
  const fmt = (v: number) => (metric === "cost" ? usd(v) : metric === "calls" ? `${v} ${t("calls", "panggilan")}` : `${num(v)} ${t("tokens", "token")}`);
  const label = (s: string) => new Date(s + "T00:00").toLocaleDateString(lang === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "short" });
  if (!max) return <p className="muted" style={{ margin: "18px 0 6px" }}>{t("Nothing in this range yet.", "Belum ada data di rentang ini.")}</p>;
  return (
    <>
      <div className="muted small" style={{ marginTop: 8 }}>{t("Peak", "Tertinggi")} {fmt(max)}</div>
      <div className="bars" onMouseLeave={() => setTip(null)}>
        {u.byDay.map((d) => {
          const v = val(d);
          return <div key={d.day} className={`b${v ? "" : " zero"}`} style={{ height: `${(v / max) * 100}%` }}
            onMouseMove={(e) => setTip({ x: e.clientX + 12, y: e.clientY - 34, text: `${label(d.day)} · ${fmt(v)}` })} aria-label={`${label(d.day)}: ${fmt(v)}`} />;
        })}
      </div>
      <div className="axis"><span>{label(u.byDay[0].day)}</span><span>{label(u.byDay[u.byDay.length - 1].day)}</span></div>
      {tip && <div className="tooltip" style={{ left: tip.x, top: tip.y }}>{tip.text}</div>}
    </>
  );
}

function GroupTable({ title, head, rows, total }: { title: string; head: string; rows: UsageGroup[]; total: number }) {
  const { t } = useGraph();
  return (
    <div className="box">
      <h3>{title}</h3>
      {rows.length ? <table className="t"><thead><tr><th>{head}</th><th className="num">{t("Calls", "Panggilan")}</th><th className="num">{t("Tokens", "Token")}</th><th className="num">{t("Cost", "Biaya")}</th><th>{t("Share", "Porsi")}</th></tr></thead>
        <tbody>{rows.map((g) => (
          <tr key={g.key}><td>{g.label}{g.errors ? <span className="muted small"> · {g.errors} {t("failed", "gagal")}</span> : null}</td><td className="num">{g.calls}</td><td className="num">{num(g.input + g.output)}</td><td className="num">{usd(g.cost)}</td>
            <td style={{ minWidth: 80 }}><div className="hbar"><div style={{ width: `${total ? (g.cost / total) * 100 : 0}%` }} /></div></td></tr>
        ))}</tbody></table> : <p className="muted">{t("No calls yet.", "Belum ada panggilan.")}</p>}
    </div>
  );
}

function Budget({ u, days, setU }: { u: UsageSummary; days: number; setU: (u: UsageSummary) => void }) {
  const { t } = useGraph();
  const [v, setV] = useState(String(u.month.budget || ""));
  const [block, setBlock] = useState(u.month.block);
  const pct = u.month.budget ? Math.min(100, (u.month.spend / u.month.budget) * 100) : 0;
  const save = async (b = block) => setU(await api<UsageSummary>("/api/usage", { json: { action: "setBudget", monthlyUsd: Number(v) || 0, block: b, days } }));
  return (
    <div className="box" style={{ marginBottom: 16 }}>
      <div className="split"><h3 style={{ margin: 0 }}>{t("This month", "Bulan ini")}</h3><span className="muted small">{usd(u.month.spend)}{u.month.budget ? ` ${t("of", "dari")} ${usd(u.month.budget)}` : ""}</span></div>
      {u.month.budget > 0 && <div className={`progress${pct >= 100 ? " over" : pct >= 80 ? " warn" : ""}`} style={{ margin: "10px 0" }}><div style={{ width: `${pct}%` }} /></div>}
      {u.month.budget > 0 && pct >= 80 && <p className="small" style={{ margin: "0 0 8px" }}>{pct >= 100 ? (u.month.block ? t("Budget reached. AI calls are paused until next month or until you raise it.", "Anggaran habis. Panggilan AI dihentikan sampai bulan depan atau sampai kamu menaikkannya.") : t("Budget reached.", "Anggaran habis.")) : t("You’ve used over 80% of this month’s budget.", "Kamu sudah memakai lebih dari 80% anggaran bulan ini.")}</p>}
      <div className="inline">
        <label className="sel-wrap">{t("Monthly budget, USD", "Anggaran bulanan, USD")} <input className="field" style={{ width: 110 }} type="number" min="0" step="1" placeholder={t("No limit", "Tanpa batas")} value={v} onChange={(e) => setV(e.target.value)} /></label>
        <label className="inline small"><input type="checkbox" checked={block} onChange={(e) => { setBlock(e.target.checked); save(e.target.checked); }} /> {t("Stop AI calls when it’s reached", "Hentikan panggilan AI saat habis")}</label>
        <button className="btn small" onClick={() => save()}>{t("Save budget", "Simpan anggaran")}</button>
      </div>
    </div>
  );
}

function ClearUsage({ days, setU }: { days: number; setU: (u: UsageSummary) => void }) {
  const { t } = useGraph();
  const [armed, setArmed] = useState(false);
  return <button className="link small" style={{ marginTop: 14 }} onClick={async () => {
    if (!armed) { setArmed(true); return; }
    setU(await api<UsageSummary>("/api/usage", { json: { action: "clear", days } })); setArmed(false);
  }}>{armed ? t("Click again to delete the whole usage history", "Klik lagi untuk menghapus seluruh riwayat pemakaian") : t("Clear usage history", "Hapus riwayat pemakaian")}</button>;
}
