"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Page from "@/components/Page";
import { ClaimCard, STATUS } from "@/components/Claims";
import { api, errText, useGraph } from "@/components/store";
import type { Claim, ClaimStatus } from "@/lib/types";

type Counts = { total: number; byStatus: Record<ClaimStatus, number>; concepts: number };

export default function ClaimsPage() {
  const { t, toast, graph, T } = useGraph();
  const [d, setD] = useState<{ claims: Claim[]; counts: Counts } | null>(null);
  const [f, setF] = useState<ClaimStatus | "attention" | "all">("all");
  const [q, setQ] = useState("");
  const [run, setRun] = useState<{ label: string; done: number; total: number } | null>(null);
  const stop = useRef(false);
  const load = () => api<{ claims: Claim[]; counts: Counts }>("/api/claims").then(setD).catch((e) => toast(errText(e)));
  useEffect(() => { load(); }, []);
  const post = async (b: Record<string, unknown>) => {
    try { const r = await api<{ claims: Claim[]; counts: Counts }>("/api/claims", { method: "POST", body: JSON.stringify(b) }); await load(); return r; }
    catch (e) { toast(errText(e)); return null; }
  };
  const ready = !!graph?.ai.ready;
  const label = (id: string) => T(graph?.concepts.find((c) => c.id === id)?.label);
  const shown = useMemo(() => (d?.claims || []).filter((c) =>
    (f === "all" || (f === "attention" ? ["partly", "unsupported", "contradicted", "disputed"].includes(c.status) : c.status === f)) &&
    (!q || `${c.text} ${c.because.join(" ")} ${label(c.conceptId)}`.toLowerCase().includes(q.toLowerCase()))), [d, f, q, graph]);

  // run one AI call per concept, one after another
  const batch = async (kind: "extract" | "check") => {
    const ids = kind === "check" ? [...new Set((d?.claims || []).filter((c) => c.status === "unchecked").map((c) => c.conceptId))]
      : (graph?.concepts || []).filter((c) => c.sources.length > 0 && !(d?.claims || []).some((x) => x.conceptId === c.id)).map((c) => c.id);
    if (!ids.length) { toast(kind === "check" ? t("Nothing left to check.", "Tidak ada yang perlu dicek.") : t("Every concept with a source already has claims.", "Semua konsep yang punya sumber sudah punya klaim.")); return; }
    stop.current = false;
    for (let i = 0; i < ids.length && !stop.current; i++) {
      setRun({ label: kind === "check" ? t("Checking", "Mengecek") : t("Finding claims", "Mencari klaim"), done: i, total: ids.length });
      const r = await post({ action: kind, conceptId: ids[i] });
      if (!r) break;
    }
    setRun(null);
  };
  const prompt = t("Fact-check the unchecked claims on my Neuron map", "Cek fakta klaim yang belum dicek di peta Neuron-ku");
  const pct = (n: number) => (d && d.counts.total ? Math.round((n / d.counts.total) * 100) : 0);

  return (
    <Page title={t("Claims", "Klaim")} lede={t("What your sources actually say: the key claims under each concept, the reasons behind them, the sentence each one comes from, and whether it checks out against its source, your definitions and your glossary.", "Apa yang sebenarnya dikatakan sumbermu: klaim utama di tiap konsep, alasan di baliknya, kalimat asalnya, dan apakah klaim itu sesuai dengan sumber, definisimu, dan glosariummu.")}>
      {!d ? <p className="muted">{t("Loading…", "Memuat…")}</p> : <>
        <div className="grid3" style={{ marginBottom: 14 }}>
          <div className="stat"><div className="k">{t("Claims", "Klaim")}</div><div className="v">{d.counts.total}</div><div className="s">{t(`in ${d.counts.concepts} concepts`, `di ${d.counts.concepts} konsep`)}</div></div>
          <div className="stat"><div className="k">{t("Supported", "Didukung")}</div><div className="v" style={{ color: "var(--solid)" }}>{d.counts.byStatus.supported}</div><div className="s">{pct(d.counts.byStatus.supported)}%</div></div>
          <div className="stat"><div className="k">{t("Need a look", "Perlu diperiksa")}</div><div className="v" style={{ color: "var(--danger)" }}>{d.counts.byStatus.partly + d.counts.byStatus.unsupported + d.counts.byStatus.contradicted + d.counts.byStatus.disputed}</div><div className="s">{t("partly, not in source, contradicted or disputed", "sebagian, tidak di sumber, bertentangan, atau diperdebatkan")}</div></div>
          <div className="stat"><div className="k">{t("Not checked", "Belum dicek")}</div><div className="v">{d.counts.byStatus.unchecked}</div><div className="s">{pct(d.counts.byStatus.unchecked)}%</div></div>
        </div>
        <div className="box" style={{ marginBottom: 14 }}>
          <div className="inline" style={{ flexWrap: "wrap", gap: 8 }}>
            {run ? <><span className="small">{run.label} {run.done + 1}/{run.total}…</span><button className="btn small" onClick={() => { stop.current = true; }}>{t("Stop", "Berhenti")}</button></>
              : ready ? <>
                <button className="btn small primary" onClick={() => batch("check")}>{t("Check all unchecked", "Cek semua yang belum dicek")}</button>
                <button className="btn small" onClick={() => batch("extract")}>{t("Find claims for concepts without any", "Cari klaim untuk konsep yang belum punya")}</button>
              </> : <Link className="btn small" href="/models">{t("Set up a model", "Atur model")}</Link>}
            <span className="small muted">{t("Free with your Claude subscription:", "Gratis dengan langganan Claude:")}</span>
            <button className="chip" onClick={async () => { try { await navigator.clipboard.writeText(prompt); toast(t("Copied", "Disalin")); } catch {} }}>{prompt}</button>
          </div>
          <p className="small muted" style={{ margin: "8px 0 0" }}>{t("Each concept is one AI call (see Usage for the cost). Claims you mark yourself are never overwritten.", "Tiap konsep memakai satu panggilan AI (lihat Pemakaian untuk biayanya). Klaim yang kamu tandai sendiri tidak pernah ditimpa.")}</p>
        </div>
        <div className="split" style={{ flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <div className="seg" role="group" aria-label={t("Show", "Tampilkan")}>
            <button aria-pressed={f === "all"} onClick={() => setF("all")}>{t("All", "Semua")}</button>
            <button aria-pressed={f === "attention"} onClick={() => setF("attention")}>{t("Need a look", "Perlu diperiksa")}</button>
            {(Object.keys(STATUS) as ClaimStatus[]).map((k) => <button key={k} aria-pressed={f === k} onClick={() => setF(k)}>{t(STATUS[k].en, STATUS[k].id)} ({d.counts.byStatus[k]})</button>)}
          </div>
          <input className="field" type="search" style={{ maxWidth: 240 }} placeholder={t("Filter", "Saring")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {d.counts.total === 0 ? <div className="box"><p style={{ margin: 0 }}>{t("No claims yet. Open a concept → Claims to find them in its sources, or use “Find claims for concepts without any” above.", "Belum ada klaim. Buka konsep → Klaim untuk mencarinya di sumber, atau pakai “Cari klaim untuk konsep yang belum punya” di atas.")}</p></div>
          : shown.length ? <ul className="plain claims">{shown.map((c) => <ClaimCard key={c.id} c={c} post={post} showConcept />)}</ul>
          : <p className="muted">{t("Nothing matches.", "Tidak ada yang cocok.")}</p>}
      </>}
    </Page>
  );
}
