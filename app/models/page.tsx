"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fragment, Suspense } from "react";
import Page from "@/components/Page";
import { api, errText, useGraph } from "@/components/store";
import Tour, { type TourStep } from "@/components/Tour";
import Hint from "@/components/Hint";
import { HowItFits, providerInfo } from "@/components/ModelsHelp";
import type { Depth, ModelRow, ProviderKind, ProviderRow } from "@/lib/types";

type Kind = { kind: ProviderKind; name: string; env: string | null; defaultUrl: string | null; keyUrl: string | null };
type State = { providers: ProviderRow[]; models: ModelRow[]; tiers: Record<Depth, number | null>; kinds: Kind[] };
type Cat = { modelId: string; label: string; inputPrice: number | null; outputPrice: number | null; contextWindow: number | null; free: boolean };
type TabK = "providers" | "models" | "use";
type Tr = (en: string, id: string) => string;
type Post = (j: Record<string, unknown>) => Promise<boolean>;

const money = (n: number, t: Tr) => (n === 0 ? t("Free", "Gratis") : `$${n < 0.1 ? n.toFixed(3) : n.toFixed(2)}`);
const depths = (t: Tr): { k: Depth; name: string; hint: string }[] => [
  { k: "quick", name: t("Quick", "Cepat"), hint: t("Runs every AI feature while the sidebar is on Quick. Pick something fast and cheap.", "Menjalankan semua fitur AI selama sidebar di Cepat. Pilih yang cepat dan murah.") },
  { k: "balanced", name: t("Balanced", "Seimbang"), hint: t("Runs everything on Balanced. On Deep, it still handles discussion, vocab and essay questions.", "Menjalankan semuanya di Seimbang. Di Mendalam, tetap menangani diskusi, istilah, dan soal esai.") },
  { k: "deep", name: t("Deep reasoning", "Penalaran mendalam"), hint: t("On Deep: imports, multiple-choice questions and essay grading. Pick your strongest model.", "Di Mendalam: impor, soal pilihan ganda, dan penilaian esai. Pilih model terkuatmu.") },
];

export default function ModelsPage() {
  return <Suspense fallback={<div className="content" />}><Inner /></Suspense>;
}

function Inner() {
  const { refresh, t } = useGraph();
  const params = useSearchParams();
  const [st, setSt] = useState<State | null>(null);
  const [tab, setTab] = useState<TabK | null>(null);
  const [err, setErr] = useState("");
  const [tour, setTour] = useState(params.get("tour") === "1");
  const load = () => api<State>("/api/models").then((s) => { setSt(s); return s; });
  useEffect(() => {
    load().then((s) => setTab((cur) => cur || (Object.values(s.tiers).some(Boolean) ? "use" : "providers"))).catch((e) => setErr(errText(e)));
  }, []);
  const post: Post = async (json) => {
    setErr("");
    try { const s = await api<State>("/api/models", { json }); setSt(s); refresh(); return true; } catch (e) { setErr(errText(e)); return false; }
  };

  const steps: TourStep[] = [
    { title: t("Welcome to Models", "Selamat datang di Model"), body: <><p>{t("Neuron doesn’t include an AI of its own. You connect one here, in three steps: a provider, a model from it, and which model each AI depth uses.", "Neuron tidak punya AI sendiri. Kamu menghubungkannya di sini dalam tiga langkah: penyedia, model dari penyedia itu, lalu model mana yang dipakai tiap tingkat AI.")}</p><p>{t("This tour takes about a minute. Use the arrow keys or the buttons.", "Tur ini sekitar satu menit. Pakai tombol panah atau tombol di bawah.")}</p></> },
    { target: "explain", title: t("Four words to know", "Empat istilah penting"), body: <p>{t("A provider runs the AI. A key proves the account is yours. A model is one specific AI from that provider. A depth decides which model does a job.", "Penyedia menjalankan AI. Kunci membuktikan akun itu milikmu. Model adalah satu AI tertentu dari penyedia itu. Tingkat menentukan model mana yang mengerjakan suatu tugas.")}</p> },
    { target: "checklist", title: t("Your setup checklist", "Daftar periksa pengaturan"), body: <p>{t("This shows what’s done and what’s left. When all four are green, every AI feature works.", "Ini menunjukkan apa yang sudah dan belum. Kalau keempatnya hijau, semua fitur AI bisa dipakai.")}</p> },
    { target: "tab-providers", before: () => setTab("providers"), title: t("Step 1: Providers and keys", "Langkah 1: Penyedia & kunci"), body: <p>{t("Each card is one provider. Anthropic, OpenRouter, Google Gemini and Ollama are already here; you only fill in the key.", "Setiap kartu adalah satu penyedia. Anthropic, OpenRouter, Google Gemini, dan Ollama sudah ada; kamu tinggal mengisi kuncinya.")}</p> },
    { target: "key", before: () => setTab("providers"), title: t("Paste a key", "Tempel kunci"), body: <><p>{t("Click “Get a key”, create one on the provider’s site, copy it, paste it here and press Save key. The badge turns green.", "Klik “Dapatkan kunci”, buat kunci di situs penyedia, salin, tempel di sini, lalu tekan Simpan kunci. Lencananya jadi hijau.")}</p><p className="muted small">{t("Keys stay on this PC. Treat them like passwords.", "Kunci hanya disimpan di PC ini. Perlakukan seperti kata sandi.")}</p></> },
    { target: "ollama", before: () => setTab("providers"), title: t("The free option: Ollama", "Pilihan gratis: Ollama"), body: <p>{t("No key and no cost. Install the Ollama app, then type a model name like qwen3:8b and press Download. Use “pull”, never “create”.", "Tanpa kunci dan tanpa biaya. Pasang aplikasi Ollama, ketik nama model seperti qwen3:8b, lalu tekan Unduh. Pakai “pull”, bukan “create”.")}</p> },
    { target: "tab-models", before: () => setTab("models"), title: t("Step 2: Models", "Langkah 2: Model"), body: <p>{t("Every model you can use is listed here, one row each. The prices are only used to estimate cost in Usage.", "Semua model yang bisa kamu pakai ada di sini, satu baris per model. Harganya hanya dipakai untuk memperkirakan biaya di Pemakaian.")}</p> },
    { target: "browse", before: () => setTab("models"), title: t("Add a model the easy way", "Cara mudah menambah model"), body: <p>{t("Click a provider’s name to see every model it offers, then press Add. No typing, no spelling mistakes. On OpenRouter, tick “Free models only”.", "Klik nama penyedia untuk melihat semua modelnya, lalu tekan Tambah. Tanpa mengetik, tanpa salah eja. Di OpenRouter, centang “Hanya model gratis”.")}</p> },
    { target: "addname", before: () => setTab("models"), title: t("Or type it yourself", "Atau ketik sendiri"), body: <p>{t("If you know the exact model code, add it here. Each box in the form explains what to put in it.", "Kalau kamu tahu kode model yang tepat, tambahkan di sini. Setiap kotak di formulir menjelaskan isinya.")}</p> },
    { target: "tab-use", before: () => setTab("use"), title: t("Step 3: Choose a model for each depth", "Langkah 3: Pilih model untuk tiap tingkat"), body: <p>{t("Quick, Balanced and Deep each use one model. You can use the same model for all three. Only models whose provider is ready show up in the lists.", "Cepat, Seimbang, dan Mendalam masing-masing memakai satu model. Boleh model yang sama untuk ketiganya. Hanya model dari penyedia yang siap yang muncul di daftar.")}</p> },
    { target: "depths", before: () => setTab("use"), title: t("Then test it", "Lalu tes"), body: <p>{t("Press Test model. Green text means it works. Red text tells you exactly what to fix.", "Tekan Tes model. Teks hijau berarti berhasil. Teks merah memberi tahu apa yang harus diperbaiki.")}</p> },
    { target: "sidebar-depth", title: t("Switch depth anytime", "Ganti tingkat kapan saja"), body: <p>{t("The AI depth in the sidebar decides which of the three models features use right now. The dot turns green when that depth has a model.", "Tingkat AI di sidebar menentukan model mana yang sedang dipakai fitur. Titiknya hijau kalau tingkat itu sudah punya model.")}</p> },
    { target: "nav-usage", title: t("Keep an eye on cost", "Pantau biayanya"), body: <p>{t("Usage logs every call with tokens and cost, and can stop AI calls when you hit a monthly budget. The Guide menu has the full explanation of every box on this page.", "Pemakaian mencatat setiap panggilan beserta token dan biayanya, dan bisa menghentikan AI saat anggaran bulanan habis. Menu Panduan berisi penjelasan lengkap setiap kotak di halaman ini.")}</p> },
  ];

  return (
    <Page title={t("Models", "Model")} lede={t("Connect the AI that powers Neuron. Set up a provider, add its models, then choose which model each AI depth uses.", "Hubungkan AI yang menjalankan Neuron. Atur penyedia, tambahkan modelnya, lalu pilih model untuk tiap tingkat AI.")}
      actions={<div className="inline"><button className="btn" onClick={() => setTour(true)}>{t("Take the tour", "Ikuti tur")}</button><Link className="btn" href="/guide#models">{t("Read the guide", "Baca panduan")}</Link></div>}>
      <HowItFits compact />
      {st && <Checklist st={st} goto={setTab} />}
      <div className="tabs-row" role="tablist" style={{ marginTop: 18 }}>
        {([["providers", t("1. Providers and keys", "1. Penyedia & kunci")], ["models", t("2. Models", "2. Model")], ["use", t("3. Use for each depth", "3. Pakai di tiap tingkat")]] as const).map(([k, l]) =>
          <button key={k} className="tab" role="tab" data-tour={`tab-${k}`} aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {err && <p className="err">{err}</p>}
      {!st || !tab ? <p className="muted">{t("Loading…", "Memuat…")}</p> : <>
        {tab === "use" && <InUse st={st} post={post} goModels={() => setTab("models")} />}
        {tab === "models" && <AllModels st={st} post={post} />}
        {tab === "providers" && <Providers st={st} post={post} reload={() => load().then(() => refresh())} />}
      </>}
      <Tour steps={steps} open={tour} onClose={() => setTour(false)} />
    </Page>
  );
}

/* ---------- checklist ---------- */
function Checklist({ st, goto }: { st: State; goto: (k: TabK) => void }) {
  const { t } = useGraph();
  const ready = st.providers.filter((p) => p.enabled && p.hasKey);
  const keyed = st.providers.some((p) => p.enabled && p.hasKey && p.kind !== "ollama");
  const usable = st.models.filter((m) => m.enabled && m.purpose !== "embed" && ready.some((p) => p.id === m.providerId));
  const tiers = Object.values(st.tiers).filter(Boolean).length;
  const tierUsable = (Object.values(st.tiers) as (number | null)[]).filter((id) => id && usable.some((m) => m.id === id)).length;
  const items: { ok: boolean; label: string; tab: TabK }[] = [
    { ok: keyed || st.models.some((m) => st.providers.find((p) => p.id === m.providerId)?.kind === "ollama"), label: t("A provider with a key (or Ollama)", "Penyedia dengan kunci (atau Ollama)"), tab: "providers" },
    { ok: usable.length > 0, label: t("At least one usable model", "Minimal satu model yang bisa dipakai"), tab: "models" },
    { ok: tiers === 3, label: t(`Models chosen for depths (${tiers}/3)`, `Model dipilih untuk tingkat (${tiers}/3)`), tab: "use" },
    { ok: tierUsable === 3, label: t("Every chosen model is ready", "Semua model terpilih siap dipakai"), tab: "use" },
  ];
  return (
    <div className="inline" data-tour="checklist" style={{ marginTop: 12, gap: 8 }}>
      {items.map((it, i) => (
        <button key={i} className="chip" onClick={() => goto(it.tab)} style={{ borderColor: it.ok ? "var(--solid)" : "var(--line)" }}>
          <span style={{ color: it.ok ? "var(--solid)" : "var(--muted)", fontWeight: 600 }}>{it.ok ? "✓" : "○"}</span>{it.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- which model per depth ---------- */
function InUse({ st, post, goModels }: { st: State; post: Post; goModels: () => void }) {
  const { graph, t } = useGraph();
  const prov = (id: number) => st.providers.find((p) => p.id === id);
  const usable = st.models.filter((m) => m.enabled && m.purpose !== "embed" && prov(m.providerId)?.enabled);
  return (
    <>
      <p className="muted small" style={{ marginTop: 0 }}>{t("Each AI feature runs on the model you pick for its depth. Using one model for all three is fine; a cheaper model for Quick saves money.", "Setiap fitur AI memakai model yang kamu pilih untuk tingkatnya. Satu model untuk ketiganya juga boleh; model yang lebih murah untuk Cepat bisa menghemat biaya.")}</p>
      <div className="grid3" data-tour="depths">
        {depths(t).map((d) => {
          const m = st.models.find((x) => x.id === st.tiers[d.k]);
          const p = m ? prov(m.providerId) : null;
          const warn = m && p && !p.hasKey ? t("This provider has no API key yet. Add it in step 1.", "Penyedia ini belum punya API key. Tambahkan di langkah 1.") : m && !p?.enabled ? t("This provider is turned off.", "Penyedia ini sedang dimatikan.") : null;
          return (
            <div key={d.k} className="box" style={graph?.prefs.depth === d.k ? { borderColor: "var(--accent)" } : undefined}>
              <div className="split"><h3 style={{ margin: 0 }}>{d.name}<Hint>{d.hint}</Hint>{warn && <Hint kind="warn">{warn}</Hint>}</h3>{graph?.prefs.depth === d.k && <span className="badge acc">{t("Current depth", "Tingkat aktif")}</span>}</div>
              <select className="field" style={{ marginTop: 10 }} value={st.tiers[d.k] ?? ""} onChange={(e) => post({ action: "setTiers", tiers: { [d.k]: e.target.value ? Number(e.target.value) : null } })}>
                <option value="">{t("Not set", "Belum dipilih")}</option>
                {usable.map((x) => <option key={x.id} value={x.id}>{x.label} · {prov(x.providerId)?.name}</option>)}
              </select>
              {m && <p className="small muted" style={{ margin: "8px 0 0" }}>{money(m.inputPrice, t)} {t("in", "masuk")} / {money(m.outputPrice, t)} {t("out per 1M tokens", "keluar per 1 juta token")}</p>}
              {m && <TestButton id={m.id} />}
            </div>
          );
        })}
      </div>
      <p className="muted small" style={{ marginTop: 14 }}>{t("Change the current depth in the sidebar. Vocab suggestions and discussion never go above Balanced; essay questions use Balanced unless depth is Quick.", "Ganti tingkat aktif di sidebar. Saran istilah dan diskusi tidak pernah di atas Seimbang; soal esai memakai Seimbang kecuali tingkatnya Cepat.")} {usable.length === 0 && <><b>{t("No usable models yet.", "Belum ada model yang bisa dipakai.")}</b> </>}<button className="link small" onClick={goModels}>{t("Add more models", "Tambah model lain")}</button></p>
      <SearchIndex st={st} />
    </>
  );
}

function TestButton({ id }: { id: number }) {
  const { t } = useGraph();
  const [s, setS] = useState<{ busy?: boolean; ok?: string; err?: string }>({});
  return (
    <div style={{ marginTop: 10 }}>
      <button className="btn small" disabled={s.busy} onClick={async () => {
        setS({ busy: true });
        try { const r = await api<{ text: string; ms: number }>("/api/models", { json: { action: "test", id } }); setS({ ok: `${r.text.slice(0, 80)} (${(r.ms / 1000).toFixed(1)}s)` }); }
        catch (e) { setS({ err: errText(e) }); }
      }}>{s.busy ? t("Testing…", "Menguji…") : t("Test model", "Tes model")}</button>
      {s.ok && <p className="small" style={{ color: "var(--solid)", margin: "6px 0 0" }}>{t("Works:", "Berhasil:")} {s.ok}</p>}
      {s.err && <p className="err">{s.err}</p>}
    </div>
  );
}

/* ---------- all models ---------- */
const blank = { id: 0, providerId: 0, modelId: "", label: "", inputPrice: 0, outputPrice: 0, contextWindow: null as number | null, maxOutput: 4096, purpose: "chat" as "chat" | "embed", notes: "", enabled: true };

function AllModels({ st, post }: { st: State; post: Post }) {
  const { t } = useGraph();
  const [form, setForm] = useState<typeof blank | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  const [browse, setBrowse] = useState<number | null>(null);
  const prov = (id: number) => st.providers.find((p) => p.id === id);
  const inUse = (id: number) => depths(t).filter((d) => st.tiers[d.k] === id).map((d) => d.name);
  // which Ollama models are downloaded on this PC (null = Ollama not running)
  const [local, setLocal] = useState<Record<number, string[] | null>>({});
  const ollamaIds = st.providers.filter((p) => p.kind === "ollama").map((p) => p.id).join(",");
  useEffect(() => {
    ollamaIds.split(",").filter(Boolean).forEach((id) => api<OllamaStatus>(`/api/ollama?providerId=${id}`)
      .then((r) => setLocal((x) => ({ ...x, [id]: r.running ? r.models.map((m) => m.name) : null }))).catch(() => setLocal((x) => ({ ...x, [id]: null }))));
  }, [ollamaIds, st.models.length]);
  const missing = (m: ModelRow): string | null => {
    const p = prov(m.providerId);
    if (!p) return t("No provider", "Tanpa penyedia");
    if (!p.enabled) return t("Provider off", "Penyedia mati");
    if (p.kind === "ollama") {
      if (!(p.id in local)) return null; // still checking
      const names = local[p.id];
      if (!names) return t("Ollama not running", "Ollama belum berjalan");
      const id = m.modelId.includes(":") ? m.modelId : `${m.modelId}:latest`;
      return names.includes(m.modelId) || names.includes(id) ? null : t("Not downloaded", "Belum diunduh");
    }
    return p.hasKey ? null : t("No key", "Tanpa kunci");
  };
  const groups = { ready: [] as { m: ModelRow; why: string | null }[], not: [] as { m: ModelRow; why: string | null }[] };
  for (const m of st.models) { const why = missing(m); (why ? groups.not : groups.ready).push({ m, why }); }
  return (
    <>
      <p className="muted small" style={{ marginTop: 0 }}>{t("A model is one specific AI. Add the ones you want to use; you can keep as many as you like and turn them off without deleting.", "Model adalah satu AI tertentu. Tambahkan yang ingin kamu pakai; boleh sebanyak apa pun dan bisa dimatikan tanpa dihapus.")}</p>
      <div className="inline" style={{ marginBottom: 12 }}>
        <span data-tour="browse" className="inline"><span className="muted small">{t("Browse what a provider offers:", "Lihat model dari penyedia:")}</span>
          {st.providers.map((p) => <button key={p.id} className="btn small" onClick={() => { setBrowse(p.id); setForm(null); }}>{p.name}</button>)}</span>
        <span className="muted small">{t("or", "atau")}</span>
        <button data-tour="addname" className="btn primary small" onClick={() => { setForm({ ...blank, providerId: st.providers[0]?.id || 0 }); setBrowse(null); }}>{t("Add a model by name", "Tambah model dengan nama")}</button>
      </div>
      {form && !form.id && <ModelForm st={st} form={form} setForm={setForm} save={async () => { if (await post({ action: "saveModel", model: { ...form, id: form.id || undefined } })) setForm(null); }} />}
      {browse && <Catalog provider={prov(browse)!} existing={st.models.filter((m) => m.providerId === browse).map((m) => m.modelId)} close={() => setBrowse(null)}
        add={(c) => post({ action: "saveModel", model: { providerId: browse, modelId: c.modelId, label: c.label, inputPrice: c.inputPrice ?? 0, outputPrice: c.outputPrice ?? 0, contextWindow: c.contextWindow, purpose: /embed/i.test(c.modelId) ? "embed" : "chat", notes: c.free ? t("Free model", "Model gratis") : null } })} />}
      {[{ key: "ready", rows: groups.ready }, { key: "not", rows: groups.not }].map((g) => g.rows.length > 0 && (
        <section key={g.key} style={{ marginBottom: 16 }}>
          <h4 className="models-head">
            {g.key === "ready" ? t("Installed and ready", "Terpasang dan siap") : t("Not installed or not ready", "Belum terpasang atau belum siap")} <span className="muted">({g.rows.length})</span>
            <Hint>{g.key === "ready" ? t("Local models are downloaded in Ollama; online models have a provider with an API key. These can be picked for a depth.", "Model lokal sudah diunduh di Ollama; model online punya penyedia dengan API key. Model ini bisa dipilih untuk tiap tingkat.") : t("Local models not downloaded yet (or Ollama isn’t running), and online models whose provider has no key or is turned off. The badge says what’s missing.", "Model lokal yang belum diunduh (atau Ollama belum berjalan), dan model online yang penyedianya belum punya kunci atau dimatikan. Labelnya menunjukkan apa yang kurang.")}</Hint>
          </h4>
          <div className="tablewrap"><table className="t">
            <thead><tr><th>{t("Model", "Model")}</th><th>{t("Provider", "Penyedia")}</th><th className="num">{t("Input / 1M", "Masuk / 1 jt")}</th><th className="num">{t("Output / 1M", "Keluar / 1 jt")}</th><th className="num">{t("Context", "Konteks")}</th><th>{t("Used for", "Dipakai untuk")}</th><th></th></tr></thead>
            <tbody>{g.rows.map(({ m, why }) => {
              const p = prov(m.providerId), editing = form?.id === m.id;
              return (
                <Fragment key={m.id}>
                  <tr style={!m.enabled ? { opacity: 0.55 } : undefined} className={editing ? "row-editing" : undefined}>
                    <td><div style={{ fontWeight: 500 }}>{m.label}</div><div className="mono muted">{m.modelId}</div>{m.notes && <div className="muted small">{m.notes}</div>}</td>
                    <td>{p?.name}{why && <div><span className="badge bad">{why}</span></div>}</td>
                    <td className="num">{money(m.inputPrice, t)}</td><td className="num">{money(m.outputPrice, t)}</td>
                    <td className="num">{m.contextWindow ? `${Math.round(m.contextWindow / 1000)}k` : "–"}</td>
                    <td>{m.purpose === "embed" && <span className="badge ok" style={{ marginRight: 4 }}>{t("Search", "Pencarian")}</span>}{inUse(m.id).map((x) => <span key={x} className="badge acc" style={{ marginRight: 4 }}>{x}</span>)}{!m.enabled && <span className="badge">{t("Off", "Mati")}</span>}</td>
                    <td><div className="inline">
                      <button className="btn small" aria-expanded={editing} onClick={() => { setForm(editing ? null : { ...m, notes: m.notes || "" }); setBrowse(null); }}>{editing ? t("Close", "Tutup") : t("Edit", "Ubah")}</button>
                      <button className="btn small" onClick={() => post({ action: "saveModel", model: { ...m, enabled: !m.enabled } })}>{m.enabled ? t("Turn off", "Matikan") : t("Turn on", "Nyalakan")}</button>
                      <button className="btn small" onClick={() => { if (armed !== m.id) setArmed(m.id); else { post({ action: "deleteModel", id: m.id }); setArmed(null); } }}>{armed === m.id ? t("Click again", "Klik lagi") : t("Delete", "Hapus")}</button>
                    </div>{!why && <TestButton id={m.id} />}</td>
                  </tr>
                  {editing && form && <tr className="edit-row"><td colSpan={7}>
                    <ModelForm st={st} form={form} setForm={setForm} save={async () => { if (await post({ action: "saveModel", model: { ...form, id: form.id || undefined } })) setForm(null); }} />
                  </td></tr>}
                </Fragment>
              );
            })}</tbody>
          </table></div>
        </section>
      ))}
      <p className="muted small" style={{ marginTop: 10 }}>{t("Prices are only for estimating cost in Usage; OpenRouter reports the real cost per call. Check current prices on each provider’s pricing page.", "Harga hanya untuk memperkirakan biaya di Pemakaian; OpenRouter melaporkan biaya sebenarnya per panggilan. Cek harga terbaru di halaman harga tiap penyedia.")}</p>
    </>
  );
}

function F({ label, hint, children }: { label: React.ReactNode; hint: React.ReactNode; children: React.ReactNode }) {
  return <label className="field-group" style={{ display: "block" }}><span className="lab">{label}<Hint>{hint}</Hint></span>{children}</label>;
}

function ModelForm({ st, form, setForm, save }: { st: State; form: typeof blank; setForm: (f: typeof blank | null) => void; save: () => void }) {
  const { t } = useGraph();
  const info = providerInfo(t);
  const f = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const kind = st.providers.find((p) => p.id === form.providerId)?.kind;
  const examples: Record<string, string> = { anthropic: "claude-haiku-5-5", gemini: "gemini-3.8-flash", openrouter: "meta-llama/llama-3.3-70b-instruct:free", ollama: "qwen3:8b", openai_compatible: "gpt-4o-mini" };
  return (
    <div className="box" style={{ marginBottom: 14 }}>
      <h3 style={{ marginTop: 0 }}>{form.id ? t("Edit model", "Ubah model") : t("Add a model", "Tambah model")}</h3>
      <p className="muted small">{t("Only the first two boxes are required. The rest help Usage estimate cost.", "Hanya dua kotak pertama yang wajib. Sisanya membantu Pemakaian memperkirakan biaya.")}</p>
      <div className="form-row">
        <F label={t("Provider *", "Penyedia *")} hint={t("Who runs this model. Its key must be set in step 1.", "Siapa yang menjalankan model ini. Kuncinya harus sudah diisi di langkah 1.")}>
          <select className="field" value={form.providerId} onChange={(e) => setForm({ ...form, providerId: Number(e.target.value) })}>{st.providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </F>
        <F label={t("Model code *", "Kode model *")} hint={<>{t("The exact code the provider uses, not its marketing name. Copy it from the provider’s model list, or use Browse instead. Example:", "Kode persis yang dipakai penyedia, bukan nama pemasarannya. Salin dari daftar model penyedia, atau pakai fitur Lihat model. Contoh:")} <span className="code">{examples[kind || "anthropic"]}</span></>}>
          <input className="field mono" placeholder={examples[kind || "anthropic"]} value={form.modelId} onChange={f("modelId")} />
        </F>
        <F label={t("Display name", "Nama tampilan")} hint={t("Any name you like. Only shown in Neuron’s menus. Leave empty to use the code.", "Nama bebas. Hanya tampil di menu Neuron. Kosongkan untuk memakai kodenya.")}>
          <input className="field" value={form.label} onChange={f("label")} />
        </F>
      </div>
      <div className="form-row">
        <F label={t("Input price (USD per 1M tokens)", "Harga masuk (USD per 1 juta token)")} hint={t("What you pay for text sent to the model: your source or answer plus Neuron’s instructions. 1 million tokens is roughly 750,000 English words. Free or local models: 0.", "Biaya untuk teks yang dikirim ke model: sumber atau jawabanmu ditambah instruksi Neuron. 1 juta token kira-kira 750.000 kata bahasa Inggris. Model gratis atau lokal: 0.")}>
          <input className="field" type="number" step="0.01" min="0" value={form.inputPrice} onChange={f("inputPrice")} />
        </F>
        <F label={t("Output price (USD per 1M tokens)", "Harga keluar (USD per 1 juta token)")} hint={t("What you pay for text the model writes back. Usually 4 to 5 times the input price. Find both on the provider’s pricing page.", "Biaya untuk teks yang ditulis model. Biasanya 4 sampai 5 kali harga masuk. Keduanya ada di halaman harga penyedia.")}>
          <input className="field" type="number" step="0.01" min="0" value={form.outputPrice} onChange={f("outputPrice")} />
        </F>
        <F label={t("Context window (tokens)", "Jendela konteks (token)")} hint={t("Optional. How much the model can read at once, e.g. 128000. Just for your reference.", "Opsional. Seberapa banyak yang bisa dibaca model sekaligus, mis. 128000. Hanya sebagai catatan.")}>
          <input className="field" type="number" min="0" value={form.contextWindow ?? ""} onChange={f("contextWindow")} />
        </F>
        <F label={t("Max reply length (tokens)", "Panjang balasan maks. (token)")} hint={t("Leave at 4096. Raise to 8000 only if long imports come back cut off. Small local models may need 2048.", "Biarkan 4096. Naikkan ke 8000 hanya kalau impor panjang terpotong. Model lokal kecil mungkin perlu 2048.")}>
          <input className="field" type="number" min="256" value={form.maxOutput} onChange={f("maxOutput")} />
        </F>
      </div>
      <F label={t("Used for", "Dipakai untuk")} hint={t("Chat models answer, write questions and grade. Search models (embeddings) only turn text into numbers so Neuron can find concepts and passages by meaning; their codes usually contain “embed”.", "Model chat menjawab, menulis soal, dan menilai. Model pencarian (embedding) hanya mengubah teks menjadi angka supaya Neuron bisa mencari konsep dan bagian sumber berdasarkan makna; kodenya biasanya mengandung “embed”.")}>
        <select className="field" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value as "chat" | "embed" })}>
          <option value="chat">{t("Chat (answers, questions, grading)", "Chat (jawaban, soal, penilaian)")}</option>
          <option value="embed">{t("Search (embeddings)", "Pencarian (embedding)")}</option>
        </select>
      </F>
      <F label={t("Notes", "Catatan")} hint={t("Anything you want to remember about this model.", "Apa saja yang ingin kamu ingat tentang model ini.")}><input className="field" value={form.notes || ""} onChange={f("notes")} /></F>
      {kind && <p className="muted small">{info[kind].what} {info[kind].cost}</p>}
      <div className="btnrow"><button className="btn primary small" disabled={!form.modelId.trim() || !form.providerId} onClick={save}>{t("Save model", "Simpan model")}</button><button className="btn small" onClick={() => setForm(null)}>{t("Cancel", "Batal")}</button></div>
    </div>
  );
}

function Catalog({ provider, existing, add, close }: { provider: ProviderRow; existing: string[]; add: (c: Cat) => Promise<boolean>; close: () => void }) {
  const { t } = useGraph();
  const [list, setList] = useState<Cat[] | null>(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [free, setFree] = useState(provider.kind === "openrouter");
  const [added, setAdded] = useState<string[]>([]);
  useEffect(() => {
    setList(null); setErr("");
    api<{ models: Cat[] }>("/api/models", { json: { action: "catalog", providerId: provider.id } }).then((r) => setList(r.models)).catch((e) => setErr(errText(e)));
  }, [provider.id]);
  const shown = useMemo(() => (list || []).filter((m) => (!free || m.free) && (!q || `${m.modelId} ${m.label}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 200), [list, q, free]);
  return (
    <div className="box" style={{ marginBottom: 14 }}>
      <div className="split"><h3 style={{ margin: 0 }}>{t("Models offered by", "Model dari")} {provider.name}</h3><button className="btn small" onClick={close}>{t("Close", "Tutup")}</button></div>
      <div className="inline" style={{ margin: "10px 0" }}>
        <input className="field" type="search" placeholder={t("Filter by name", "Saring berdasarkan nama")} style={{ maxWidth: 260 }} value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="inline small"><input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> {t("Free models only", "Hanya model gratis")}</label>
        {list && <span className="muted small">{shown.length} {t("of", "dari")} {list.length}</span>}
      </div>
      {err && <p className="err">{err}</p>}
      {!list && !err && <p className="muted">{t(`Asking ${provider.name} for its model list…`, `Meminta daftar model dari ${provider.name}…`)}</p>}
      {list && <div style={{ maxHeight: 360, overflowY: "auto" }}><table className="t">
        <thead><tr><th>{t("Model", "Model")}</th><th className="num">{t("Input / 1M", "Masuk / 1 jt")}</th><th className="num">{t("Output / 1M", "Keluar / 1 jt")}</th><th className="num">{t("Context", "Konteks")}</th><th></th></tr></thead>
        <tbody>{shown.map((m) => {
          const have = existing.includes(m.modelId) || added.includes(m.modelId);
          return <tr key={m.modelId}><td><div>{m.label}</div><div className="mono muted">{m.modelId}</div></td>
            <td className="num">{m.inputPrice == null ? "?" : money(m.inputPrice, t)}</td><td className="num">{m.outputPrice == null ? "?" : money(m.outputPrice, t)}</td>
            <td className="num">{m.contextWindow ? `${Math.round(m.contextWindow / 1000)}k` : "–"}</td>
            <td><button className="btn small" disabled={have} onClick={async () => { if (await add(m)) setAdded([...added, m.modelId]); }}>{have ? t("Added", "Ditambahkan") : t("Add", "Tambah")}</button></td></tr>;
        })}</tbody></table></div>}
      {list && provider.kind !== "openrouter" && provider.kind !== "ollama" && <p className="muted small">{t("This provider doesn’t publish prices in its model list. After adding, press Edit to type the prices from its pricing page.", "Penyedia ini tidak mencantumkan harga di daftar modelnya. Setelah ditambah, tekan Ubah untuk mengisi harga dari halaman harganya.")}</p>}
    </div>
  );
}

/* ---------- providers ---------- */
function Providers({ st, post, reload }: { st: State; post: Post; reload: () => void }) {
  const { t } = useGraph();
  const info = providerInfo(t);
  const [adding, setAdding] = useState<ProviderKind | "">("");
  const [nf, setNf] = useState({ name: "", baseUrl: "", apiKey: "" });
  const firstKeyed = st.providers.find((p) => p.kind !== "ollama")?.id;
  return (
    <>
      <p className="muted small" style={{ marginTop: 0 }}>{t("A provider is the company or app that runs the AI. You only need one. Fill in the API key for the provider you want to use; leave the others empty.", "Penyedia adalah perusahaan atau aplikasi yang menjalankan AI. Satu saja cukup. Isi API key untuk penyedia yang ingin kamu pakai; yang lain biarkan kosong.")}</p>
      <div className="grid2" data-tour="providers">{st.providers.map((p) => <ProviderCard key={p.id} p={p} first={p.id === firstKeyed} count={st.models.filter((m) => m.providerId === p.id).length} post={post} reload={reload} models={st.models.filter((m) => m.providerId === p.id)} />)}</div>
      <div className="box" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{t("Add another provider", "Tambah penyedia lain")}</h3>
        <p className="muted small">{t("Only needed for services not listed above, such as OpenAI, Groq, DeepSeek or LM Studio. Choose “OpenAI-compatible”.", "Hanya perlu untuk layanan yang belum ada di atas, seperti OpenAI, Groq, DeepSeek, atau LM Studio. Pilih “Kompatibel OpenAI”.")}</p>
        <div className="form-row">
          <F label={t("Type", "Jenis")} hint={adding ? info[adding].what : t("What kind of service it is.", "Jenis layanannya.")}>
            <select className="field" value={adding} onChange={(e) => { const k = e.target.value as ProviderKind; setAdding(k); setNf({ name: k ? info[k].name : "", baseUrl: k ? info[k].url || "" : "", apiKey: "" }); }}>
              <option value="">{t("Choose…", "Pilih…")}</option>{st.kinds.map((k) => <option key={k.kind} value={k.kind}>{info[k.kind].name}</option>)}</select>
          </F>
          {adding && <>
            <F label={t("Name", "Nama")} hint={t("A label for you, e.g. “Groq” or “OpenAI”.", "Label untukmu, mis. “Groq” atau “OpenAI”.")}><input className="field" value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} /></F>
            <F label={t("Base URL", "Base URL")} hint={info[adding].urlHelp}><input className="field mono" placeholder="https://api.example.com/v1" value={nf.baseUrl} onChange={(e) => setNf({ ...nf, baseUrl: e.target.value })} /></F>
            {adding !== "ollama" && <F label={t("API key", "API key")} hint={info[adding].key}><input className="field mono" type="password" autoComplete="off" value={nf.apiKey} onChange={(e) => setNf({ ...nf, apiKey: e.target.value })} /></F>}
          </>}
        </div>
        <div className="btnrow"><button className="btn primary small" disabled={!adding || (adding === "openai_compatible" && !nf.baseUrl)} onClick={async () => {
          if (await post({ action: "saveProvider", provider: { kind: adding, ...nf } })) { setAdding(""); setNf({ name: "", baseUrl: "", apiKey: "" }); }
        }}>{t("Add provider", "Tambah penyedia")}</button></div>
      </div>
      <p className="muted small" style={{ marginTop: 12 }}>{t("Keys typed here are saved in data/neuron.db on this PC and are never included in exports. You can put them in .env.local instead; a key typed here wins.", "Kunci yang diketik di sini disimpan di data/neuron.db di PC ini dan tidak pernah ikut diekspor. Bisa juga ditaruh di .env.local; kunci yang diketik di sini yang dipakai.")}</p>
    </>
  );
}

function ProviderCard({ p, first, count, post, reload, models }: { p: ProviderRow; first: boolean; count: number; post: Post; reload: () => void; models: ModelRow[] }) {
  const { t } = useGraph();
  const info = providerInfo(t)[p.kind];
  const [key, setKey] = useState("");
  const [url, setUrl] = useState(p.baseUrl || "");
  const [armed, setArmed] = useState(false);
  const save = (extra: Record<string, unknown>) => post({ action: "saveProvider", provider: { id: p.id, kind: p.kind, name: p.name, baseUrl: url, ...extra } });
  return (
    <div className="box" style={!p.enabled ? { opacity: 0.6 } : undefined} data-tour={p.kind === "ollama" ? "ollama" : undefined}>
      <div className="split"><h3 style={{ margin: 0 }}>{p.name}</h3>
        {p.kind === "ollama" ? <span className="badge">{t("No key needed", "Tanpa kunci")}</span> : p.hasKey ? <span className="badge ok">{p.keySource === "env" ? t("Key from .env.local", "Kunci dari .env.local") : t("Key saved", "Kunci tersimpan")}</span> : <span className="badge bad">{t("No key", "Tanpa kunci")}</span>}</div>
      <p className="muted small">{info.what} {info.cost} {t(`${count} models.`, `${count} model.`)}</p>
      {p.kind !== "ollama" && <div data-tour={first ? "key" : undefined}>
        <F label={<>{t("API key", "API key")} {p.keyHint && <span className="muted mono">({p.keyHint})</span>}</>} hint={<>{info.key} {info.keyUrl && <a className="link" href={info.keyUrl} target="_blank" rel="noreferrer">{t("Get a key", "Dapatkan kunci")} ↗</a>}</>}>
          <div className="split"><input className="field mono" type="password" autoComplete="off" placeholder={p.hasKey ? t("Paste a new key to replace it", "Tempel kunci baru untuk mengganti") : t("Paste your key here", "Tempel kuncimu di sini")} value={key} onChange={(e) => setKey(e.target.value)} />
            <button className="btn small" disabled={!key.trim()} onClick={async (e) => { e.preventDefault(); if (await save({ apiKey: key })) setKey(""); }}>{t("Save key", "Simpan kunci")}</button></div>
        </F>
      </div>}
      <details style={{ marginTop: 8 }}>
        <summary className="small">{t("Advanced: base URL", "Lanjutan: base URL")}</summary>
        <F label={t("Base URL", "Base URL")} hint={info.urlHelp}><input className="field mono" placeholder={info.url || ""} value={url} onChange={(e) => setUrl(e.target.value)} onBlur={() => url !== (p.baseUrl || "") && save({})} /></F>
      </details>
      {p.kind === "ollama" && <OllamaPanel providerId={p.id} models={models} reload={reload} />}
      <div className="btnrow">
        <button className="btn small" onClick={() => save({ enabled: !p.enabled })}>{p.enabled ? t("Turn off", "Matikan") : t("Turn on", "Nyalakan")}</button>
        {p.keySource === "app" && <button className="btn small" onClick={() => save({ clearKey: true })}>{t("Remove saved key", "Hapus kunci tersimpan")}</button>}
        <button className="btn small" onClick={() => { if (!armed) setArmed(true); else post({ action: "deleteProvider", id: p.id }); }}>{armed ? t(`Click again to delete it and its ${count} models`, `Klik lagi untuk menghapus beserta ${count} modelnya`) : t("Delete", "Hapus")}</button>
      </div>
    </div>
  );
}

/* ---------- Ollama: status and downloads ---------- */
type OllamaStatus = { running: boolean; version: string | null; base: string; models: { name: string; size: number; params: string | null }[] };
const SUGGESTED = ["qwen3:8b", "qwen3:4b", "deepseek-r1:8b", "gemma3:4b", "llama3.2:3b", "nomic-embed-text"];
const gb = (n: number) => `${(n / 1e9).toFixed(1)} GB`;

function OllamaPanel({ providerId, models, reload }: { providerId: number; models: ModelRow[]; reload: () => void }) {
  const { t } = useGraph();
  const [st, setSt] = useState<OllamaStatus | null>(null);
  const [name, setName] = useState("qwen3:8b");
  const [prog, setProg] = useState<{ status: string; pct: number | null } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const ctl = useRef<AbortController | null>(null);
  const check = () => api<OllamaStatus>(`/api/ollama?providerId=${providerId}`).then(setSt).catch(() => setSt(null));
  useEffect(() => { check(); }, [providerId]);

  const pull = async (model: string) => {
    setMsg(null); setProg({ status: t("Starting…", "Memulai…"), pct: null });
    ctl.current = new AbortController();
    try {
      const res = await fetch("/api/ollama", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ providerId, model }), signal: ctl.current.signal });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.message || t("Download failed", "Unduhan gagal")); }
      const reader = res.body!.getReader(), dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const ev = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1);
          if (ev.done) {
            if (ev.success) setMsg({ ok: true, text: ev.added ? t(`${model} is ready and was added to your models. Pick it in step 3.`, `${model} siap dan sudah ditambahkan ke modelmu. Pilih di langkah 3.`) : t(`${model} is ready.`, `${model} siap.`) });
            else setMsg({ ok: false, text: ev.error || t("Download failed.", "Unduhan gagal.") });
          } else setProg({ status: ev.status, pct: ev.total ? Math.round((ev.completed / ev.total) * 100) : null });
        }
      }
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).name === "AbortError" ? t("Download stopped.", "Unduhan dihentikan.") : (e as Error).message });
    } finally {
      setProg(null); ctl.current = null; check(); reload();
    }
  };

  const added = new Set(models.map((m) => m.modelId));
  return (
    <div style={{ marginTop: 10 }}>
      {!st ? <p className="muted small">{t("Checking Ollama…", "Memeriksa Ollama…")}</p> : st.running ? (
        <p className="small" style={{ margin: 0 }}><span className="badge ok">{t("Running", "Berjalan")}</span> {st.version ? `Ollama ${st.version}` : ""} · {t(`${st.models.length} models downloaded`, `${st.models.length} model terunduh`)} <button className="link small" onClick={check}>{t("Refresh", "Muat ulang")}</button></p>
      ) : (
        <p className="err">{t(`Ollama isn’t running at ${st.base}. Install it from ollama.com and open the Ollama app, then`, `Ollama tidak berjalan di ${st.base}. Pasang dari ollama.com dan buka aplikasi Ollama, lalu`)} <button className="link small" onClick={check}>{t("check again", "periksa lagi")}</button>. <a className="link" href="https://ollama.com/download" target="_blank" rel="noreferrer">ollama.com ↗</a></p>
      )}
      {st?.running && st.models.length > 0 && (
        <ul className="plain" style={{ marginTop: 6 }}>{st.models.map((m) => (
          <li key={m.name} className="row-item split"><span className="mono">{m.name}</span>
            <span className="inline"><span className="muted small">{m.params || ""} {gb(m.size)}</span>
              {added.has(m.name) ? <span className="badge acc">{t("In your models", "Ada di modelmu")}</span> : <button className="btn small" onClick={async () => { await api("/api/models", { json: { action: "saveModel", model: { providerId, modelId: m.name, label: `${m.name} (local)`, inputPrice: 0, outputPrice: 0, purpose: /embed/i.test(m.name) ? "embed" : "chat" } } }); reload(); }}>{t("Add to models", "Tambah ke model")}</button>}</span></li>
        ))}</ul>
      )}
      {models.filter((m) => st?.running && !st.models.some((x) => x.name === m.modelId || x.name === `${m.modelId}:latest`)).map((m) => (
        <p key={m.id} className="err" style={{ marginTop: 6 }}><span className="mono">{m.modelId}</span> {t("is in your list but not downloaded yet.", "ada di daftarmu tapi belum diunduh.")} <button className="link small" disabled={!!prog} onClick={() => pull(m.modelId)}>{t("Download it now", "Unduh sekarang")}</button></p>
      ))}
      <F label={t("Download a model", "Unduh model")} hint={<>{t("Type a name from", "Ketik nama dari")} <a className="link" href="https://ollama.com/library" target="_blank" rel="noreferrer">ollama.com/library</a>. {t("An 8B model needs about 5 GB of disk and runs best with 16 GB of RAM; try 4B or 3B on a smaller PC. This is the same as running “ollama pull <name>”.", "Model 8B butuh sekitar 5 GB disk dan paling lancar dengan RAM 16 GB; coba 4B atau 3B untuk PC yang lebih kecil. Sama dengan menjalankan “ollama pull <nama>”.")}</>}>
        <div className="split"><input className="field mono" list="ollama-suggest" value={name} onChange={(e) => setName(e.target.value)} disabled={!!prog} />
          {prog ? <button className="btn small" onClick={(e) => { e.preventDefault(); ctl.current?.abort(); }}>{t("Stop", "Berhenti")}</button> : <button className="btn small" disabled={!st?.running || !name.trim()} onClick={(e) => { e.preventDefault(); pull(name.trim()); }}>{t("Download", "Unduh")}</button>}</div>
      </F>
      <datalist id="ollama-suggest">{SUGGESTED.map((x) => <option key={x} value={x} />)}</datalist>
      {prog && <div style={{ marginTop: 8 }}><div className="split small"><span>{prog.status}</span><span>{prog.pct != null ? `${prog.pct}%` : ""}</span></div>
        <div className="progress" style={{ marginTop: 4 }}><div style={{ width: `${prog.pct ?? 0}%`, background: "var(--accent)" }} /></div></div>}
      {msg && <p className={msg.ok ? "small" : "err"} style={msg.ok ? { color: "var(--solid)", marginTop: 6 } : undefined}>{msg.text}</p>}
    </div>
  );
}

/* ---------- search index (embeddings) ---------- */
type IndexStatus = { modelRowId: number | null; model: string | null; concepts: { done: number; total: number }; chunks: { done: number; total: number }; ready: boolean; remaining?: number };

function SearchIndex({ st }: { st: State }) {
  const { t } = useGraph();
  const [s, setS] = useState<IndexStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const stop = useRef(false);
  const prov = (id: number) => st.providers.find((p) => p.id === id);
  const embedModels = st.models.filter((m) => m.purpose === "embed" && m.enabled && prov(m.providerId)?.enabled);
  const call = (json: Record<string, unknown>) => api<IndexStatus>("/api/search", { json });
  useEffect(() => { call({ action: "status" }).then(setS).catch(() => {}); }, [st.models.length]);

  const build = async () => {
    setBusy(true); setMsg(null); stop.current = false;
    try {
      for (let i = 0; i < 500 && !stop.current; i++) {
        const r = await call({ action: "step" });
        setS(r);
        if (!r.remaining) break;
      }
      setMsg({ ok: true, text: t("Search index is up to date.", "Indeks pencarian sudah terbaru.") });
    } catch (e) { setMsg({ ok: false, text: errText(e) }); }
    setBusy(false);
  };
  const total = s ? s.concepts.total + s.chunks.total : 0, done = s ? s.concepts.done + s.chunks.done : 0;
  return (
    <div className="box" style={{ marginTop: 16 }} data-tour="search-index">
      <div className="split"><h3 style={{ margin: 0 }}>{t("Search index (optional)", "Indeks pencarian (opsional)")}</h3>{s?.ready && s.modelRowId ? <span className="badge ok">{t("Up to date", "Terbaru")}</span> : null}</div>
      <p className="muted small">{t("A search model lets Neuron find concepts and passages by meaning, not just exact words. It also merges a new concept into an existing one when they mean the same thing, and gives the Assistant the right passages from your sources. Free with Ollama: download nomic-embed-text on the Ollama card.", "Model pencarian membuat Neuron bisa mencari konsep dan bagian sumber berdasarkan makna, bukan hanya kata yang sama persis. Juga menggabungkan konsep baru ke konsep lama kalau maknanya sama, dan memberi Asisten bagian sumber yang tepat. Gratis dengan Ollama: unduh nomic-embed-text di kartu Ollama.")}</p>
      <div className="form-row">
        <F label={t("Search model", "Model pencarian")} hint={t("Only models marked “Search” appear here. Changing it rebuilds the index.", "Hanya model bertanda “Pencarian” yang muncul di sini. Menggantinya akan membangun ulang indeks.")}>
          <select className="field" value={s?.modelRowId ?? ""} onChange={async (e) => { setS(await call({ action: "setModel", modelRowId: e.target.value ? Number(e.target.value) : null })); setMsg(null); }}>
            <option value="">{t("Off (word matching only)", "Mati (hanya pencocokan kata)")}</option>
            {embedModels.map((m) => <option key={m.id} value={m.id}>{m.label} · {prov(m.providerId)?.name}</option>)}
          </select>
        </F>
        {s?.modelRowId && <div className="field-group">
          <span className="lab">{t("Indexed", "Terindeks")}</span>
          <div className="small">{t("Concepts", "Konsep")} {s.concepts.done}/{s.concepts.total} · {t("Passages", "Bagian sumber")} {s.chunks.done}/{s.chunks.total}</div>
          <div className="progress" style={{ marginTop: 6 }}><div style={{ width: `${total ? (done / total) * 100 : 100}%`, background: "var(--accent)" }} /></div>
        </div>}
      </div>
      {s?.modelRowId && <div className="btnrow">
        {busy ? <button className="btn small" onClick={() => { stop.current = true; }}>{t("Stop", "Berhenti")}</button>
          : <button className="btn primary small" disabled={!!s.ready} onClick={build}>{s.ready ? t("Nothing to index", "Tidak ada yang perlu diindeks") : t(`Build index (${total - done} items)`, `Bangun indeks (${total - done} item)`)}</button>}
        <button className="btn small" disabled={busy} onClick={async () => { try { const r = await api<{ dims: number; ms: number }>("/api/search", { json: { action: "test" } }); setMsg({ ok: true, text: t(`Works: ${r.dims} numbers per text (${(r.ms / 1000).toFixed(1)}s).`, `Berhasil: ${r.dims} angka per teks (${(r.ms / 1000).toFixed(1)} dtk).`) }); } catch (e) { setMsg({ ok: false, text: errText(e) }); } }}>{t("Test search model", "Tes model pencarian")}</button>
      </div>}
      {msg && <p className={msg.ok ? "small" : "err"} style={msg.ok ? { color: "var(--solid)", marginTop: 6 } : undefined}>{msg.text}</p>}
      {embedModels.length === 0 && <p className="muted small">{t("No search models yet. In 2. Models, add one and set “Used for” to Search, e.g. nomic-embed-text (Ollama) or gemini-embedding-001 (Gemini).", "Belum ada model pencarian. Di 2. Model, tambahkan satu dan atur “Dipakai untuk” ke Pencarian, mis. nomic-embed-text (Ollama) atau gemini-embedding-001 (Gemini).")}</p>}
    </div>
  );
}
