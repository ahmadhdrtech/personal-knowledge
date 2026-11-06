"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, Bil, useGraph } from "./store";
import { ConfButtons, domainColor, Dot, fmtRel, LinkSentence, Meter, NodeBtn, useBusy, useSelect } from "./ui";
import { chainBack, chainFwd, due, level, LEVEL_NAME, neighbors, TYPES, VERDICT } from "@/lib/logic";
import type { Bi, Concept, Confidence, Graph, LinkType, SourceRef } from "@/lib/types";

export type Tab = "overview" | "words" | "test" | "discuss" | "path";

export default function ConceptPanel({ c, tab, setTab }: { c: Concept; tab: Tab; setTab: (t: Tab) => void }) {
  const { graph, T, t } = useGraph();
  const select = useSelect();
  const sugg = graph!.links.filter((l) => l.status === "suggested" && (l.from === c.id || l.to === c.id));
  const dom = (k: string) => graph!.domains.find((d) => d.key === k);
  const tabs: [Tab, string][] = [
    ["overview", t("Overview", "Ringkasan") + (sugg.length ? ` (${sugg.length} ${t("new", "baru")})` : "")],
    ["words", t("Words", "Istilah")], ["test", t("Test", "Tes")], ["discuss", t("Discuss", "Diskusi")], ["path", t("Path", "Urutan")],
  ];
  return (
    <>
      <div>
        {c.domains.map((k) => <span key={k} className="tag"><Dot color={domainColor(dom(k)?.color ?? 0)} />{T(dom(k)?.name)}</span>)}
        {c.miscon && <span className="pill bad">{t("Misconception", "Miskonsepsi")}</span>}
        {c.auto && <span className="pill">{t("Added by AI", "Ditambahkan AI")}</span>}
      </div>
      <h2><Bil o={c.label} /></h2>
      <Meter c={c} />
      <div className="tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} className="tab" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      <div key={c.id + tab}>
        {tab === "overview" && <Overview c={c} />}
        {tab === "words" && <Words c={c} />}
        {tab === "test" && <TestTab c={c} />}
        {tab === "discuss" && <Discuss c={c} />}
        {tab === "path" && <PathTab c={c} />}
      </div>
    </>
  );
}

/* ---------------- overview ---------------- */
function Overview({ c }: { c: Concept }) {
  const { graph, act, toast, T, t } = useGraph();
  const sugg = graph!.links.filter((l) => l.status === "suggested" && (l.from === c.id || l.to === c.id));
  const conns = graph!.links.filter((l) => l.status === "approved" && (l.from === c.id || l.to === c.id));
  const decide = async (lid: number, ok: boolean) => { await act("decideLink", { lid, ok }); toast(ok ? t("Link approved", "Tautan disetujui") : t("Link rejected", "Tautan ditolak")); };
  return (
    <>
      <h3>{t("Summary", "Ringkasan")}</h3>
      <p className="summary"><Bil o={c.summary} /></p>
      <h3>{t("Your definition", "Definisimu")}</h3>
      <Definition c={c} />
      {sugg.length > 0 && <>
        <h3>{t("Suggested links to review", "Saran tautan untuk diperiksa")}</h3>
        {sugg.map((l) => (
          <div className="card dashed" key={l.lid}>
            <p><LinkSentence l={l} here={c.id} /></p>
            {l.why && T(l.why) && <p className="muted small">{T(l.why)}</p>}
            <div className="btnrow">
              <button className="btn primary small" onClick={() => decide(l.lid, true)}>{t("Approve link", "Setujui tautan")}</button>
              <button className="btn small" onClick={() => decide(l.lid, false)}>{t("Reject", "Tolak")}</button>
            </div>
          </div>
        ))}
      </>}
      <h3>{t("Connections", "Koneksi")} ({conns.length})</h3>
      {conns.length ? <ul className="plain">{conns.map((l) => <li key={l.lid} className="row-item"><LinkSentence l={l} here={c.id} /></li>)}</ul>
        : <p className="muted">{t("No links yet. Approve a suggestion or add a source that mentions this concept.", "Belum ada tautan. Setujui saran tautan atau tambahkan sumber yang membahas konsep ini.")}</p>}
      <div className="inline" style={{ marginTop: 8 }}><AddLink c={c} /><Link className="link small" href={`/views?v=neighborhood&c=${encodeURIComponent(c.id)}`}>{t("See its neighborhood", "Lihat sekitarnya")}</Link></div>
      <h3>{t("Sources", "Sumber")} ({c.sources.length})</h3>
      <ul className="plain">{c.sources.map((s, i) => <SourceItem key={i} s={s} />)}</ul>
    </>
  );
}

function SourceItem({ s }: { s: SourceRef }) {
  const { t } = useGraph();
  const [passage, setPassage] = useState<{ text: string; page: number | null } | null>(null);
  const [open, setOpen] = useState(false);
  const toggle = async () => {
    if (!open && !passage && s.chunkId) setPassage(await api(`/api/sources?chunk=${s.chunkId}`));
    setOpen(!open);
  };
  return (
    <li className="row-item src">
      <b>{s.title}{s.page ? <span className="muted small"> · {t("p.", "hlm.")} {s.page}</span> : null}</b>
      <span>{s.note}</span>
      {s.quote && <span style={{ display: "block", fontStyle: "italic", marginTop: 4 }}>“{s.quote}”</span>}
      {s.chunkId && <button className="link small" onClick={toggle}>{open ? t("Hide passage", "Sembunyikan kutipan") : t("Show the passage", "Lihat bagian sumbernya")}</button>}
      {open && passage && <div className="card" style={{ marginTop: 6, fontFamily: "Newsreader, Georgia, serif", fontSize: 15, whiteSpace: "pre-wrap", maxHeight: 260, overflowY: "auto" }}>{passage.text}</div>}
    </li>
  );
}

const LINK_ORDER: LinkType[] = ["prerequisite", "part_of", "causes", "contrasts", "example_of", "related"];
function AddLink({ c }: { c: Concept }) {
  const { graph, act, toast, T, t } = useGraph();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [type, setType] = useState("related");
  if (!open) return <button className="link small" onClick={() => setOpen(true)}>{t("Add a link yourself", "Tambah tautan sendiri")}</button>;
  const others = graph!.concepts.filter((x) => x.id !== c.id).sort((a, b) => T(a.label).localeCompare(T(b.label)));
  return (
    <div className="card" style={{ marginTop: 10, width: "100%" }}>
      <div className="inline">
        <span className="small">{T(c.label)}</span>
        <select className="field" style={{ width: "auto" }} value={type} onChange={(e) => setType(e.target.value)}>
          {LINK_ORDER.map((k) => <option key={k} value={k}>{T(TYPES[k].say)}</option>)}
        </select>
        <select className="field" style={{ width: "auto", flex: 1 }} value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">{t("Pick a concept", "Pilih konsep")}</option>
          {others.map((o) => <option key={o.id} value={o.id}>{T(o.label)}</option>)}
        </select>
      </div>
      <div className="btnrow">
        <button className="btn primary small" disabled={!to} onClick={async () => { const r = await act("addLink", { from: c.id, to, type }); toast(r ? t("Link added", "Tautan ditambahkan") : t("These two are already linked", "Keduanya sudah tertaut")); setOpen(false); }}>{t("Add link", "Tambah tautan")}</button>
        <button className="btn small" onClick={() => setOpen(false)}>{t("Cancel", "Batal")}</button>
      </div>
    </div>
  );
}

function Definition({ c }: { c: Concept }) {
  const { act, toast, t } = useGraph();
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(c.userDef || "");
  if (editing) return (
    <>
      <textarea className="field" rows={4} autoFocus value={v} onChange={(e) => setV(e.target.value)} placeholder={t("Explain it the way you understand it, in English or Indonesian", "Jelaskan dengan pemahamanmu sendiri, dalam bahasa Inggris atau Indonesia")} />
      <div className="btnrow">
        <button className="btn primary small" onClick={async () => { await act("setDefinition", { id: c.id, definition: v }); setEditing(false); toast(v.trim() ? t("Definition saved. The AI will treat it as the source of truth.", "Definisi disimpan. AI akan menjadikannya acuan utama.") : t("Definition removed", "Definisi dihapus")); }}>{t("Save definition", "Simpan definisi")}</button>
        <button className="btn small" onClick={() => { setV(c.userDef || ""); setEditing(false); }}>{t("Cancel", "Batal")}</button>
        {c.userDef && <button className="btn small" onClick={async () => { await act("setDefinition", { id: c.id, definition: null }); setV(""); setEditing(false); }}>{t("Remove", "Hapus")}</button>}
      </div>
    </>
  );
  if (c.userDef) return (
    <div className="card"><p>{c.userDef}</p><p className="muted small">{t("The AI uses this as the source of truth in tests, grading and discussion.", "AI memakai ini sebagai acuan utama dalam tes, penilaian, dan diskusi.")}</p>
      <button className="link small" onClick={() => setEditing(true)}>{t("Edit definition", "Ubah definisi")}</button></div>
  );
  return <><p className="muted">{t("Write the concept in your own words. The AI follows your definition over its own knowledge, which keeps answers grounded in what you learned.", "Tulis konsep ini dengan kata-katamu sendiri. AI akan mengikuti definisimu di atas pengetahuannya sendiri, jadi jawabannya tetap sesuai dengan yang kamu pelajari.")}</p>
    <button className="btn small" onClick={() => setEditing(true)}>{t("Add your definition", "Tambah definisimu")}</button></>;
}

/* ---------------- words ---------------- */
function NeedsAI({ what }: { what: string }) {
  const { t } = useGraph();
  return <p className="muted small">{what} {t("need an AI model.", "butuh model AI.")} <Link className="link" href="/models">{t("Set one up in Models", "Atur di menu Model")}</Link>.</p>;
}

function Words({ c }: { c: Concept }) {
  const { graph, act, setGraph, t } = useGraph();
  const [en, setEn] = useState(""), [ind, setInd] = useState(""), [ex, setEx] = useState(""), [err, setErr] = useState("");
  const ai = useBusy();
  const add = async () => {
    if (!en.trim() || !ind.trim()) { setErr(t("Enter the English and the Indonesian term.", "Isi istilah bahasa Inggris dan Indonesianya.")); return; }
    await act("addVocab", { id: c.id, items: [{ en, ind, ex }] }); setEn(""); setInd(""); setEx("");
  };
  const suggest = () => ai.run(t("Finding terms…", "Mencari istilah…"), async (signal) => {
    const r = await api<{ graph: Graph }>("/api/ai", { json: { task: "vocab", conceptId: c.id }, signal }); setGraph(r.graph);
  });
  return (
    <>
      <h3>{t("Terms in English and Indonesian", "Istilah bahasa Inggris dan Indonesia")} ({c.vocab.length})</h3>
      {c.vocab.length ? c.vocab.map((v) => (
        <div className="vocab" key={v.vid}><b>{v.en}</b><b>{v.ind}</b>{v.ex && <span className="ex">{v.ex}</span>}
          <span className="ex"><button className="link small" onClick={() => act("deleteVocab", { vid: v.vid })}>{t("Remove", "Hapus")}</button></span></div>
      )) : <p className="muted">{t("No terms yet.", "Belum ada istilah.")}</p>}
      <div className="btnrow">
        {graph!.ai.ready ? (ai.status || <button className="btn small" onClick={suggest}>{t("Suggest 3 more terms with AI", "Minta AI menyarankan 3 istilah lagi")}</button>) : <NeedsAI what={t("AI suggestions", "Saran AI")} />}
      </div>
      {ai.error}
      <h3>{t("Add a term", "Tambah istilah")}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input className="field" placeholder={t("English term", "Istilah bahasa Inggris")} value={en} onChange={(e) => { setEn(e.target.value); setErr(""); }} />
        <input className="field" placeholder={t("Indonesian term", "Istilah bahasa Indonesia")} value={ind} onChange={(e) => { setInd(e.target.value); setErr(""); }} />
      </div>
      <input className="field" placeholder={t("Example sentence (optional)", "Contoh kalimat (opsional)")} style={{ marginTop: 8 }} value={ex} onChange={(e) => setEx(e.target.value)} />
      {err && <div className="err">{err}</div>}
      <div className="btnrow"><button className="btn small" onClick={add}>{t("Add term", "Tambah istilah")}</button></div>
    </>
  );
}

/* ---------------- test ---------------- */
function TestTab({ c }: { c: Concept }) {
  const { t } = useGraph();
  const [mode, setMode] = useState<"mcq" | "essay">("mcq");
  return (
    <>
      <div className="btnrow" style={{ margin: "12px 0 14px" }}>
        <div className="seg" role="group" aria-label={t("Test type", "Jenis tes")}>
          <button aria-pressed={mode === "mcq"} onClick={() => setMode("mcq")}>{t("Multiple choice", "Pilihan ganda")}</button>
          <button aria-pressed={mode === "essay"} onClick={() => setMode("essay")}>{t("Essay", "Esai")}</button>
        </div>
      </div>
      {mode === "mcq" ? <Mcq c={c} /> : <Essay c={c} />}
    </>
  );
}

/** After an answer: when it comes back, and a jump to the next concept that's due. */
function AfterAnswer({ c, nextReview }: { c: Concept; nextReview?: number }) {
  const { graph, T, t, lang } = useGraph();
  const select = useSelect();
  const next = due(graph!.concepts).find((x) => x.id !== c.id);
  return (
    <div className="btnrow" style={{ alignItems: "center" }}>
      {nextReview && <span className="muted small">{t("Comes back for review", "Muncul lagi untuk review")} {fmtRel(nextReview, lang)}.</span>}
      {next && <button className="btn small" onClick={() => select(next.id, "test")}>{t("Next due:", "Berikutnya:")} {T(next.label)} →</button>}
    </div>
  );
}

const quizPos: Record<string, number> = {};

function Mcq({ c }: { c: Concept }) {
  const { graph, act, setGraph, T, t } = useGraph();
  const [idx, setIdx] = useState(() => quizPos[c.id] || 0);
  const [sel, setSel] = useState<number | null>(null);
  const [res, setRes] = useState<{ right: boolean; delta: number; mastery: number; answer: number; conf: Confidence; nextReview?: number } | null>(null);
  const [err, setErr] = useState("");
  const ai = useBusy();
  const nb = [...neighbors(graph!.links, c.id)].filter((x) => x !== c.id);
  useEffect(() => { quizPos[c.id] = idx; }, [c.id, idx]);

  const gen = (bridge: boolean) => ai.run(t("Writing a question…", "Menulis soal…"), async (signal) => {
    const r = await api<{ graph: Graph; qid: number }>("/api/ai", { json: { task: "mcq", conceptId: c.id, bridge }, signal });
    setGraph(r.graph);
    const nc = r.graph.concepts.find((x) => x.id === c.id)!;
    setIdx(nc.quiz.findIndex((q) => q.qid === r.qid)); setSel(null); setRes(null);
  });
  const genBox = graph!.ai.ready
    ? <div className="btnrow">{ai.status || <><button className="btn small" onClick={() => gen(false)}>{t("New question with AI", "Soal baru dari AI")}</button>{nb.length > 0 && <button className="btn small" onClick={() => gen(true)}>{t("New bridge question", "Soal jembatan baru")}</button>}</>}</div>
    : <div className="btnrow"><NeedsAI what={t("AI-written questions", "Soal buatan AI")} /></div>;

  if (!c.quiz.length) return <><p className="muted">{t("No questions for this concept yet.", "Belum ada soal untuk konsep ini.")}</p>{genBox}{ai.error}</>;
  const i = ((idx % c.quiz.length) + c.quiz.length) % c.quiz.length, q = c.quiz[i];
  const bridge = q.bridge ? graph!.concepts.find((x) => x.id === q.bridge) : null;

  const submit = async (conf: Confidence) => {
    if (sel == null) { setErr(t("Pick an answer first.", "Pilih jawaban dulu.")); return; }
    const r = await act<{ right: boolean; delta: number; mastery: number; answer: number; nextReview?: number }>("answerMcq", { id: c.id, qid: q.qid, choice: sel, confidence: conf });
    setRes({ ...r, conf });
  };
  const cls = (j: number) => {
    if (!res) return sel === j ? "opt picked" : "opt";
    if (j === res.answer) return "opt right";
    if (j === sel && !res.right) return "opt wrong";
    return "opt";
  };
  const v = res ? VERDICT[`${res.right ? "right" : "wrong"}-${res.conf}`] : null;
  return (
    <>
      <div className="card">
        {bridge ? <div className="kind bridge">{t("Bridge question linking to", "Soal jembatan yang menghubungkan ke")} {T(bridge.label)}</div>
          : <div className="kind">{t(`Question ${i + 1} of ${c.quiz.length}`, `Soal ${i + 1} dari ${c.quiz.length}`)}{q.ai ? t(", written by AI", ", ditulis AI") : ""}</div>}
        <p className="prompt"><Bil o={q.q} /></p>
        {q.o.map((o, j) => <button key={j} className={cls(j)} disabled={!!res} onClick={() => { setSel(j); setErr(""); }}><Bil o={o} /></button>)}
        {!res && <div className="conf"><p>{t("How sure are you?", "Seberapa yakin kamu?")}</p><div className="btnrow"><ConfButtons onPick={submit} /></div>{err && <div className="err">{err}</div>}</div>}
        {res && v && (
          <div className="verdict">
            <p><strong>{T(v[0])}</strong> {T(v[1])}</p>
            <p><Bil o={q.why} /></p>
            <p className="muted small">{t("Mastery", "Penguasaan")} {res.delta >= 0 ? "+" : "−"}{Math.abs(res.delta)}%, {t("now", "sekarang")} {res.mastery}%.</p>
            <div className="btnrow"><button className="btn small" onClick={() => { setIdx(i + 1); setSel(null); setRes(null); }}>{c.quiz.length > 1 ? t("Next question", "Soal berikutnya") : t("Try again", "Coba lagi")}</button></div>
            <AfterAnswer c={c} nextReview={res.nextReview} />
          </div>
        )}
      </div>
      {genBox}{ai.error}
    </>
  );
}

type EssayQ = { q: Bi; rubric: string[] };
type EssayRes = { score: number; verdict: string; got: string[]; missing: string[]; misconceptions: string[]; feedback_en: string; feedback_id: string; model_answer_en: string; model_answer_id: string; unknown_terms: string[] };
type EssaySt = { q?: EssayQ; answer?: string; res?: EssayRes; delta?: number; mastery?: number; conf?: Confidence; nextReview?: number };
const essayState: Record<string, EssaySt> = {};

function Essay({ c }: { c: Concept }) {
  const { graph, setGraph, t } = useGraph();
  const [st, setSt] = useState<EssaySt>(() => essayState[c.id] || {});
  const [err, setErr] = useState("");
  const ai = useBusy();
  const update = (s: EssaySt) => { essayState[c.id] = s; setSt(s); };
  if (!graph!.ai.ready) return <div className="card"><p><strong>{t("Essay tests need an AI model.", "Tes esai butuh model AI.")}</strong></p><p className="muted">{t("The AI writes an open question, then grades your answer against your sources and definitions.", "AI menulis soal terbuka, lalu menilai jawabanmu berdasarkan sumber dan definisimu.")} <Link className="link" href="/models">{t("Set up a model", "Atur model")}</Link>.</p></div>;

  if (!st.q) return (
    <>
      <p className="muted">{t("The AI writes an open question about this concept. You answer in your own words, in English or Indonesian, and say how sure you are. It grades the understanding, not the wording.", "AI menulis soal terbuka tentang konsep ini. Kamu menjawab dengan kata-katamu sendiri, dalam bahasa Inggris atau Indonesia, lalu menyebut seberapa yakin. Yang dinilai pemahamannya, bukan susunan katanya.")}</p>
      <div className="btnrow">{ai.status || <button className="btn primary small" onClick={() => ai.run(t("Writing a question…", "Menulis soal…"), async (signal) => {
        const r = await api<{ question: EssayQ }>("/api/ai", { json: { task: "essayQuestion", conceptId: c.id }, signal });
        update({ q: r.question, answer: "" });
      })}>{t("Write me an essay question", "Buatkan soal esai")}</button>}</div>{ai.error}
    </>
  );

  if (st.res) return <EssayResult c={c} st={st} again={() => update({})} />;

  const submit = (conf: Confidence) => {
    const ans = (st.answer || "").trim();
    if (ans.split(/\s+/).length < 8) { setErr(t("Write at least a couple of sentences before submitting.", "Tulis minimal beberapa kalimat sebelum mengirim.")); return; }
    ai.run(graph!.prefs.depth === "deep" ? t("Grading with deep reasoning. This can take a minute…", "Menilai dengan penalaran mendalam. Bisa sampai semenit…") : t("Grading…", "Menilai…"), async (signal) => {
      const r = await api<{ graph: Graph; result: EssayRes; delta: number; mastery: number; nextReview?: number }>("/api/ai", { json: { task: "essayGrade", conceptId: c.id, question: st.q, answer: ans, confidence: conf }, signal });
      setGraph(r.graph);
      update({ ...st, res: r.result, delta: r.delta, mastery: r.mastery, conf, nextReview: r.nextReview });
    });
  };
  return (
    <>
      <div className="card">
        <div className="kind">{t("Essay question", "Soal esai")}</div>
        <p className="prompt"><Bil o={st.q.q} /></p>
        <textarea className="field" rows={7} placeholder={t("Write your answer in English or Indonesian", "Tulis jawabanmu dalam bahasa Inggris atau Indonesia")} aria-label={t("Your answer", "Jawabanmu")} disabled={ai.busy}
          value={st.answer || ""} onChange={(e) => { update({ ...st, answer: e.target.value }); setErr(""); }} />
        <div className="conf"><p style={{ marginTop: 12 }}>{t("How sure are you? Pick one to submit.", "Seberapa yakin kamu? Pilih salah satu untuk mengirim.")}</p><div className="btnrow"><ConfButtons onPick={submit} disabled={ai.busy} /></div></div>
        {err && <div className="err">{err}</div>}
        {ai.status}{ai.error}
      </div>
      <div className="btnrow"><button className="link small" onClick={() => update({})}>{t("Ask a different question", "Minta soal lain")}</button></div>
    </>
  );
}

function EssayResult({ c, st, again }: { c: Concept; st: EssaySt; again: () => void }) {
  const { T, t } = useGraph();
  const r = st.res!;
  const vword = ({ understood: t("Understood", "Paham"), partial: t("Partly understood", "Paham sebagian"), not_yet: t("Not yet", "Belum paham") } as Record<string, string>)[r.verdict] || t("Graded", "Dinilai");
  const calib = st.conf === "sure" && r.score < 50 ? t("You were certain, but the answer shows gaps. That’s a signal to review, not a failure.", "Kamu yakin, tapi jawabannya masih ada celah. Itu tanda untuk review, bukan kegagalan.")
    : st.conf === "guess" && r.score >= 70 ? t("You understood more than you thought. Next time, trust it a little more.", "Pemahamanmu lebih baik dari yang kamu kira. Lain kali, lebih percaya diri sedikit.") : "";
  const list = (title: string, a: string[]) => a.length ? <><h3>{title}</h3><ul className="plain">{a.map((x, i) => <li key={i} className="row-item">{x}</li>)}</ul></> : null;
  return (
    <>
      <div className="card">
        <div className="split"><div><div className="kind">{vword}</div><div className="score">{r.score}<span className="muted" style={{ fontSize: 16 }}> / 100</span></div></div>
          <div className="muted small">{t("Mastery", "Penguasaan")} {st.delta! >= 0 ? "+" : "−"}{Math.abs(st.delta!)}%, {t("now", "sekarang")} {st.mastery}%</div></div>
        {calib && <p className="small" style={{ marginTop: 10 }}>{calib}</p>}
        <p style={{ marginTop: 10 }}>{T({ en: r.feedback_en, id: r.feedback_id })}</p>
      </div>
      {list(t("What you got right", "Yang sudah benar"), r.got)}{list(t("What’s missing", "Yang masih kurang"), r.missing)}
      {r.misconceptions.length > 0 && <><h3>{t("Misconceptions", "Miskonsepsi")}</h3><ul className="plain">{r.misconceptions.map((x, i) => <li key={i} className="row-item"><span className="pill bad" style={{ margin: "0 6px 0 0" }}>{t("Fix", "Perbaiki")}</span>{x}</li>)}</ul></>}
      <details><summary>{t("Model answer", "Contoh jawaban")}</summary><p className="summary" style={{ marginTop: 8, fontSize: 16 }}>{T({ en: r.model_answer_en, id: r.model_answer_id })}</p></details>
      {r.unknown_terms.length > 0 && <TeachBox terms={r.unknown_terms} />}
      <div className="btnrow"><button className="btn small" onClick={again}>{t("Try another question", "Coba soal lain")}</button></div>
      <AfterAnswer c={c} nextReview={st.nextReview} />
    </>
  );
}

export function TeachBox({ terms }: { terms: string[] }) {
  const { act, toast, t } = useGraph();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  return (
    <div className="card warn" style={{ marginTop: 14 }}>
      <p><strong>{t("The AI wasn’t sure about these terms.", "AI kurang yakin dengan istilah-istilah ini.")}</strong></p>
      <p className="muted small">{t("Teach it a definition so future questions, grading and answers stay accurate.", "Ajari definisinya supaya soal, penilaian, dan jawaban berikutnya tetap akurat.")}</p>
      {terms.map((term) => (
        <div key={term}>
          <label className="lab">{term}</label>
          <div className="split">
            <input className="field" placeholder={t("What does it mean?", "Apa artinya?")} disabled={saved[term]} value={vals[term] || ""} onChange={(e) => setVals({ ...vals, [term]: e.target.value })} />
            <button className="btn small" disabled={saved[term]} onClick={async () => {
              if (!(vals[term] || "").trim()) return;
              await act("glossaryUpsert", { term, definition: vals[term] }); setSaved({ ...saved, [term]: true }); toast(t("Definition saved to your glossary", "Definisi disimpan ke glosarium"));
            }}>{saved[term] ? t("Saved", "Tersimpan") : t("Save", "Simpan")}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- discuss ---------------- */
type Turn = { role: "user" | "assistant"; content: string };
function Discuss({ c }: { c: Concept }) {
  const { graph, T, t } = useGraph();
  const [turns, setTurns] = useState<Turn[] | null>(null);
  const [input, setInput] = useState("");
  const [live, setLive] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const ctl = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { api<Turn[]>(`/api/ai/chat?conceptId=${encodeURIComponent(c.id)}`).then(setTurns).catch(() => setTurns([])); }, [c.id]);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [turns, live]);

  if (!graph!.ai.ready) return <div className="card" style={{ marginTop: 12 }}><p><strong>{t("Discussion needs an AI model.", "Diskusi butuh model AI.")}</strong></p><p className="muted"><Link className="link" href="/models">{t("Set one up in Models", "Atur di menu Model")}</Link>.</p></div>;
  if (!turns) return <p className="muted" style={{ marginTop: 12 }}>{t("Loading…", "Memuat…")}</p>;

  const nb = [...neighbors(graph!.links, c.id)].filter((x) => x !== c.id).map((id) => graph!.concepts.find((x) => x.id === id)!).filter(Boolean);
  const L = T(c.label);
  const starters = [
    t(`Explain ${L} simply, with a real-world example`, `Jelaskan ${L} dengan sederhana, pakai contoh nyata`),
    t("Ask me a question to check my understanding", "Beri aku satu pertanyaan untuk cek pemahamanku"),
    t("What do people often get wrong about this?", "Apa yang sering disalahpahami tentang ini?"),
  ];
  if (nb[0]) starters.push(t(`How does it connect to ${T(nb[0].label)}?`, `Apa hubungannya dengan ${T(nb[0].label)}?`));

  const send = async (text: string) => {
    text = text.trim(); if (!text || live !== null) return;
    setErr(""); setInput("");
    const before = turns;
    setTurns([...before, { role: "user", content: text }]); setLive("");
    ctl.current = new AbortController();
    let acc = "";
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ conceptId: c.id, text }), signal: ctl.current.signal });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.message || t("Something went wrong. Try again.", "Ada yang salah. Coba lagi.")); }
      const reader = res.body!.getReader(), dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        acc += dec.decode(value, { stream: true });
        const e = acc.indexOf("\u0000ERR:");
        if (e >= 0) { const msg = acc.slice(e + 5).replace(/^[a-z_]+:/, ""); acc = acc.slice(0, e); throw new Error(msg); }
        setLive(acc);
      }
      setTurns([...before, { role: "user", content: text }, { role: "assistant", content: acc }]);
    } catch (e) {
      setTurns(before); setInput(text);
      setErr((e as Error).name === "AbortError" ? t("Stopped.", "Dihentikan.") : (e as Error).message);
    } finally { setLive(null); ctl.current = null; }
  };
  return (
    <>
      <div className="chat" style={{ marginTop: 12 }}>
        {turns.map((m, i) => <div key={i} className={`bubble ${m.role === "user" ? "me" : "ai"}`}>{m.content}</div>)}
        {live !== null && <div className="bubble ai">{live || t("Thinking…", "Berpikir…")}</div>}
        <div ref={end} />
      </div>
      {!turns.length && live === null && <div className="btnrow" style={{ marginBottom: 10 }}>{starters.map((s, i) => <button key={i} className="btn small" onClick={() => send(s)}>{s}</button>)}</div>}
      <textarea className="field" rows={3} placeholder={t(`Ask anything about ${L}, in English or Indonesian`, `Tanya apa saja tentang ${L}, dalam bahasa Inggris atau Indonesia`)} aria-label={t("Message", "Pesan")} value={input}
        onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(input); }} />
      <div className="btnrow">
        <button className="btn primary small" disabled={live !== null} onClick={() => send(input)}>{t("Send", "Kirim")}</button>
        {live !== null && <button className="btn small" onClick={() => ctl.current?.abort()}>{t("Stop", "Berhenti")}</button>}
        {turns.length > 0 && live === null && <button className="btn small" onClick={async () => { await api(`/api/ai/chat?conceptId=${encodeURIComponent(c.id)}`, { method: "DELETE" }); setTurns([]); }}>{t("Clear chat", "Hapus obrolan")}</button>}
        <span className="muted small" style={{ alignSelf: "center" }}><span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> {t("to send", "untuk kirim")}</span>
      </div>
      {err && <p className="err">{err}</p>}
    </>
  );
}

/* ---------------- path ---------------- */
function PathTab({ c }: { c: Concept }) {
  const { graph, T, t } = useGraph();
  const back = chainBack(graph!.links, c.id), fwd = chainFwd(graph!.links, c.id);
  const item = (id: string, here = false) => {
    const m = graph!.concepts.find((x) => x.id === id)!;
    return <li key={id} className={here ? "here" : ""}>{here ? <span>{T(m.label)}</span> : <NodeBtn id={m.id} />}
      <span className="sub">{here ? t("You are here", "Posisimu sekarang") : T(LEVEL_NAME[level(m.mastery)]) + (m.miscon ? t(", misconception", ", miskonsepsi") : "")}</span></li>;
  };
  return (
    <>
      <h3>{t("Order to learn it in", "Urutan belajarnya")}</h3>
      {!back.length && !fwd.length ? <p className="muted">{t("No prerequisite or cause-and-effect links for this concept yet. They appear as you add sources and approve links.", "Belum ada tautan prasyarat atau sebab-akibat untuk konsep ini. Akan muncul saat kamu menambah sumber dan menyetujui tautan.")}</p>
        : <p className="muted">{t("Study from the top. Steps above build up to this concept; steps below are what it unlocks or leads to.", "Pelajari dari atas. Langkah di atas membangun ke konsep ini; langkah di bawah adalah yang dibuka atau disebabkannya.")}</p>}
      <ol className="path">{back.map((x) => item(x.id))}{item(c.id, true)}{fwd.map((x) => item(x.id))}</ol>
    </>
  );
}
