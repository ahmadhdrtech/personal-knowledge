"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGraph } from "@/components/store";
import GraphCanvas from "@/components/graph/GraphCanvas";
import ConceptPanel, { type Tab } from "@/components/ConceptPanel";
import Assistant from "@/components/Assistant";
import AddSource from "@/components/AddSource";
import { SelectProvider, domainColor, Dot } from "@/components/ui";
import { LEVEL_NAME } from "@/lib/logic";
import type { View } from "@/lib/types";

export default function MapPage() {
  return <Suspense fallback={<div className="content" />}><MapInner /></Suspense>;
}

const readPref = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const writePref = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

function MapInner() {
  const { graph, act, toast, T, t } = useGraph();
  const params = useSearchParams();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(params.get("c"));
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "overview");
  const [col, setCol] = useState<"assistant" | "concept">(params.get("c") ? "concept" : "assistant");
  const [colOpen, setColOpen] = useState(true);
  const [legend, setLegend] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(params.get("add") === "1");

  useEffect(() => { setColOpen(readPref("neuron.col", "1") === "1"); setLegend(readPref("neuron.legend", "0") === "1"); }, []);
  useEffect(() => { const c = params.get("c"); if (c) { setSelected(c); setTab((params.get("tab") as Tab) || "overview"); setCol("concept"); } }, [params]);

  const select = useCallback((id: string | null, tb?: string) => {
    setSelected(id); setTab((tb as Tab) || "overview");
    setCol(id ? "concept" : "assistant");
    if (id) { setColOpen(true); writePref("neuron.col", "1"); }
    router.replace(id ? `/?c=${encodeURIComponent(id)}${tb ? `&tab=${tb}` : ""}` : "/", { scroll: false });
  }, [router]);

  const opts = useMemo(() => ({ lang: graph?.prefs.lang || "en", view: graph?.prefs.view || "domains", hidden, selected, query }), [graph?.prefs.lang, graph?.prefs.view, hidden, selected, query]);

  if (!graph) return <div className="content"><div className="page muted">{t("Loading…", "Memuat…")}</div></div>;
  const concept = selected ? graph.concepts.find((c) => c.id === selected) : null;
  const setView = (v: View) => act("prefs", { prefs: { view: v } });
  const filterDomain = (key: string | null) => setHidden(new Set(key ? graph.domains.filter((d) => d.key !== key).map((d) => d.key) : []));
  const findEnter = () => {
    const v = query.trim().toLowerCase();
    const n = graph.concepts.find((d) => d.domains.some((k) => !hidden.has(k)) && `${d.label.en} ${d.label.id}`.toLowerCase().includes(v));
    if (n) { select(n.id); setQuery(""); } else if (v) toast(t(`No concept matches “${query.trim()}”. Try /find in the assistant to search by meaning.`, `Tidak ada konsep yang cocok dengan “${query.trim()}”. Coba /find di asisten untuk mencari berdasarkan makna.`));
  };
  const toggleCol = () => { const v = !colOpen; setColOpen(v); writePref("neuron.col", v ? "1" : "0"); };
  const ctl = { selected, select, filterDomain, setView, openAdd: () => setAdding(true) };

  return (
    <SelectProvider value={select}>
      <div className="content fixed">
        <div className="mapwrap">
          <header className="bar">
            <div className="search"><input className="field" type="search" placeholder={t("Search concepts", "Cari konsep")} aria-label={t("Search concepts", "Cari konsep")} autoComplete="off"
              value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") findEnter(); }} /></div>
            <div className="seg" role="group" aria-label={t("View", "Tampilan")}>
              <button aria-pressed={graph.prefs.view === "network"} onClick={() => setView("network")}>{t("Network", "Jaringan")}</button>
              <button aria-pressed={graph.prefs.view === "domains"} onClick={() => setView("domains")}>{t("Domains", "Domain")}</button>
            </div>
            <div className="actions">
              <button className="btn primary" onClick={() => setAdding(true)}>{t("Add source", "Tambah sumber")}</button>
              <button className="btn" onClick={toggleCol} aria-pressed={colOpen} title={colOpen ? t("Hide the side column", "Sembunyikan kolom samping") : t("Show the side column", "Tampilkan kolom samping")}>
                {colOpen ? t("Hide panel", "Sembunyikan panel") : t("Assistant", "Asisten")}
              </button>
            </div>
          </header>
          <main className={`mapmain${colOpen ? "" : " wide"}`}>
            <section id="graph" aria-label={t("Concept map", "Peta konsep")}>
              <GraphCanvas graph={graph} opts={opts} onSelect={(id) => select(id)} />
              {graph.concepts.length === 0 && (
                <div className="map-empty">
                  <h3 style={{ marginTop: 0 }}>{t("Your map is empty", "Petamu masih kosong")}</h3>
                  <p className="muted small">{t("Add an article, your notes, a PDF or a web page. The AI picks out the concepts and they appear here. Concepts that show up in two sources become one node, and that is how your topics connect.", "Tambahkan artikel, catatanmu, PDF, atau halaman web. AI memilih konsep-konsepnya lalu muncul di sini. Konsep yang muncul di dua sumber menjadi satu simpul, dan dari situ topik-topikmu terhubung.")}</p>
                  <button className="btn primary" onClick={() => setAdding(true)}>{t("Add your first source", "Tambahkan sumber pertamamu")}</button>
                </div>
              )}
              <div className="top">
                <div className="chips">
                  {graph.domains.map((d) => (
                    <button key={d.key} className="chip" aria-pressed={!hidden.has(d.key)} onClick={() => { const h = new Set(hidden); h.has(d.key) ? h.delete(d.key) : h.add(d.key); setHidden(h); }}>
                      <Dot color={domainColor(d.color)} />{T(d.name)}
                    </button>
                  ))}
                  {hidden.size > 0 && <button className="chip" onClick={() => setHidden(new Set())}>{t("Show all", "Tampilkan semua")}</button>}
                </div>
              </div>
              {legend ? <Legend close={() => { setLegend(false); writePref("neuron.legend", "0"); }} />
                : <button className="btn small legend-btn" onClick={() => { setLegend(true); writePref("neuron.legend", "1"); }}>{t("Legend", "Keterangan")}</button>}
            </section>
            {colOpen && (
              <aside className="panel side-col" id="panel">
                <div className="col-tabs" role="tablist">
                  <button role="tab" aria-selected={col === "assistant"} onClick={() => setCol("assistant")}>{t("Assistant", "Asisten")}</button>
                  {concept && <button role="tab" aria-selected={col === "concept"} onClick={() => setCol("concept")}>
                    <span className="col-tab-label">{T(concept.label)}</span>
                    <span className="x" role="button" aria-label={t("Close concept", "Tutup konsep")} onClick={(e) => { e.stopPropagation(); select(null); }}>×</span>
                  </button>}
                </div>
                <div className={col === "assistant" ? "col-body flush" : "col-body"}>
                  {col === "concept" && concept ? <ConceptPanel c={concept} tab={tab} setTab={(tb) => select(concept.id, tb === "overview" ? undefined : tb)} /> : <Assistant ctl={ctl} />}
                </div>
              </aside>
            )}
          </main>
        </div>
      </div>
      <AddSource open={adding} onClose={() => setAdding(false)} onDone={() => select(null)} />
    </SelectProvider>
  );
}

function Legend({ close }: { close: () => void }) {
  const { T, t } = useGraph();
  return (
    <div className="legend">
      <button className="link small legend-x" onClick={close} aria-label={t("Hide legend", "Sembunyikan keterangan")}>×</button>
      {(["unseen", "shaky", "solid"] as const).map((l) => <div key={l} className="row"><span className="dot" style={{ background: `var(--${l})` }} />{T(LEVEL_NAME[l])}</div>)}
      <div className="row"><span className="dot" style={{ background: "var(--danger)" }} />{t("Misconception", "Miskonsepsi")}</div>
      <div className="row lt"><svg viewBox="0 0 28 12" aria-hidden="true"><path d="M8 2a5 5 0 0 1 0 8" fill="none" stroke="var(--c0)" strokeWidth="3" /><path d="M8 10a5 5 0 0 1 0-8" fill="none" stroke="var(--c1)" strokeWidth="3" /></svg>{t("Split ring = in two domains", "Cincin terbelah = di dua domain")}</div>
      <div className="row lt"><svg viewBox="0 0 28 12" aria-hidden="true"><line x1="1" y1="6" x2="21" y2="6" stroke="var(--edge)" strokeWidth="1.6" /><path d="M20 3L26 6L20 9Z" fill="var(--edge)" /></svg>{t("Directional link", "Tautan berarah")}</div>
      <div className="row lt"><svg viewBox="0 0 28 12" aria-hidden="true"><line x1="1" y1="6" x2="27" y2="6" stroke="var(--edge)" strokeWidth="1.6" strokeDasharray="6 4" /></svg>{t("Contrasts", "Berlawanan")}</div>
      <div className="row lt"><svg viewBox="0 0 28 12" aria-hidden="true"><line x1="1" y1="6" x2="27" y2="6" stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="4 4" /></svg>{t("Suggested", "Saran")}</div>
    </div>
  );
}
