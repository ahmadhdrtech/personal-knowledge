"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Page from "@/components/Page";
import Markdown from "@/components/Markdown";
import Hint from "@/components/Hint";
import { api, errText, useGraph } from "@/components/store";
import { NodeBtn } from "@/components/ui";
import { CONF } from "@/lib/logic";
import type { Confidence, SourceRow, Study, StudyItem, StudyMode, StudyPassage } from "@/lib/types";

type Progress = Record<number, { questions: number; answered: number; right: number }>;

export default function StudyPage() {
  return <Suspense><StudyInner /></Suspense>;
}

function StudyInner() {
  const params = useSearchParams();
  const id = Number(params.get("source"));
  return id ? <Reader id={id} /> : <Pick />;
}

/* ---------- choose a source ---------- */
function Pick() {
  const { t, toast } = useGraph();
  const [d, setD] = useState<{ sources: SourceRow[]; progress: Progress } | null>(null);
  useEffect(() => { api<{ sources: SourceRow[]; progress: Progress }>("/api/study").then(setD).catch((e) => toast(errText(e))); }, []);
  return (
    <Page title={t("Study", "Belajar")} lede={t("Read a source passage by passage, with a question after each one. Switch any passage to a simpler version, one with examples from your interests, or a deeper one. At the end you get Glows (what you did well) and Grows (what to work on).", "Baca sumber bagian demi bagian, dengan satu pertanyaan setelah tiap bagian. Ubah bagian mana pun menjadi versi lebih sederhana, versi dengan contoh dari minatmu, atau versi lebih dalam. Di akhir kamu mendapat Glows (yang sudah bagus) dan Grows (yang perlu dilatih).")}>
      {!d ? <p className="muted">{t("Loading…", "Memuat…")}</p> : !d.sources.length ? (
        <div className="box">
          <p style={{ marginTop: 0 }}>{t("No sources with text yet. Add an article, PDF or your notes first.", "Belum ada sumber berisi teks. Tambahkan artikel, PDF, atau catatanmu dulu.")}</p>
          <Link className="btn primary" href="/?add=1">{t("Add a source", "Tambah sumber")}</Link>
        </div>
      ) : (
        <div className="tablewrap"><table className="t">
          <thead><tr><th>{t("Source", "Sumber")}</th><th className="num">{t("Passages", "Bagian")}</th><th>{t("Progress", "Kemajuan")}</th><th></th></tr></thead>
          <tbody>{d.sources.map((s) => {
            const p = d.progress[s.id];
            return (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.title}</td>
                <td className="num">{s.chunks}</td>
                <td>{p ? <><span className="small">{t(`${p.answered} of ${p.questions} answered`, `${p.answered} dari ${p.questions} terjawab`)}{p.answered ? ` · ${Math.round((p.right / p.answered) * 100)}% ${t("right", "benar")}` : ""}</span>
                  <span className="lesson-bar" style={{ maxWidth: 200 }}><span style={{ width: `${(p.answered / Math.max(1, p.questions)) * 100}%` }} /></span></> : <span className="muted small">{t("Not started", "Belum mulai")}</span>}</td>
                <td><Link className="btn small primary" href={`/study?source=${s.id}`}>{p?.answered ? t("Continue", "Lanjutkan") : t("Study", "Pelajari")}</Link></td>
              </tr>
            );
          })}</tbody>
        </table></div>
      )}
    </Page>
  );
}

/* ---------- the reader ---------- */
const MODES: { k: StudyMode; en: string; id: string; hint: [string, string] }[] = [
  { k: "original", en: "Original", id: "Asli", hint: ["The source exactly as you added it.", "Sumber persis seperti yang kamu tambahkan."] },
  { k: "simple", en: "Simpler", id: "Lebih sederhana", hint: ["Short sentences and everyday words, with every fact kept.", "Kalimat pendek dan kata sehari-hari, semua fakta tetap ada."] },
  { k: "interest", en: "My interests", id: "Minatku", hint: ["Examples swapped for ones from your interests (Settings → About you). Changed sentences are highlighted.", "Contoh diganti dengan contoh dari minatmu (Pengaturan → Tentang kamu). Kalimat yang diubah ditandai."] },
  { k: "deeper", en: "Deeper", id: "Lebih dalam", hint: ["Why it works, an edge case, and links to your map. Anything beyond the source is labelled.", "Kenapa bisa begitu, kasus khusus, dan kaitan ke petamu. Apa pun di luar sumber diberi label."] },
];

function Reader({ id }: { id: number }) {
  const { t, lang, toast, graph } = useGraph();
  const router = useRouter();
  const [st, setSt] = useState<Study | null>(null);
  const [mode, setMode] = useState<StudyMode>("original");
  const [busy, setBusy] = useState<string | null>(null);
  const ctl = useRef<AbortController | null>(null);
  const load = () => api<Study>(`/api/study?source=${id}&lang=${lang}`).then(setSt).catch((e) => toast(errText(e)));
  useEffect(() => { load(); }, [id, lang]);
  const post = async (b: Record<string, unknown>, label?: string) => {
    if (label) { setBusy(label); ctl.current = new AbortController(); }
    try {
      const r = await api<{ study?: Study; added?: number; left?: number; correct?: boolean; mastery?: { delta: number; now: number } | null }>("/api/study", { method: "POST", body: JSON.stringify({ sourceId: id, lang, ...b }), signal: ctl.current?.signal });
      if (r.study) setSt(r.study);
      return r;
    } catch (e) { if ((e as Error).name !== "AbortError") toast(errText(e)); return null; }
    finally { if (label) { setBusy(null); ctl.current = null; } }
  };

  // remember where you are
  const seen = useRef(0);
  useEffect(() => {
    if (!st) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const i = Number((e.target as HTMLElement).dataset.idx); if (i > seen.current) { seen.current = i; post({ action: "pos", pos: i }); } } }), { rootMargin: "0px 0px -60% 0px" });
    document.querySelectorAll(".study-passage").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [st?.passages.length]);

  const items = useMemo(() => st?.passages.flatMap((p) => p.items) || [], [st]);
  const answered = items.filter((i) => i.answeredAt);
  const missing = st?.passages.filter((p) => !p.items.length && p.text.trim().split(/\s+/).length >= 25).length || 0;
  const ready = !!graph?.ai.ready;
  const claudePrompt = st ? t(`Prepare my Neuron source "${st.source.title}" for study`, `Siapkan sumber Neuron "${st.source.title}" untuk belajar`) : "";
  const copy = async (s: string) => { try { await navigator.clipboard.writeText(s); toast(t("Copied", "Disalin")); } catch {} };

  if (!st) return <Page title={t("Study", "Belajar")}><p className="muted">{t("Loading…", "Memuat…")}</p></Page>;
  return (
    <Page title={st.source.title} lede={st.source.url ? <a className="link" href={st.source.url} target="_blank" rel="noreferrer">{new URL(st.source.url).hostname}</a> : undefined}
      actions={<button className="btn" onClick={() => router.push("/study")}>{t("All sources", "Semua sumber")}</button>}>
      <div className="study-bar">
        <div className="seg" role="group" aria-label={t("Version", "Versi")}>
          {MODES.map((m) => <button key={m.k} aria-pressed={mode === m.k} onClick={() => setMode(m.k)} title={t(m.hint[0], m.hint[1])}>{t(m.en, m.id)}</button>)}
        </div>
        <Hint>{t(MODES.find((m) => m.k === mode)!.hint[0], MODES.find((m) => m.k === mode)!.hint[1])}</Hint>
        <span className="study-progress">
          <span className="small">{t(`${answered.length} of ${items.length} questions`, `${answered.length} dari ${items.length} soal`)}</span>
          <span className="lesson-bar"><span style={{ width: `${(answered.length / Math.max(1, items.length)) * 100}%` }} /></span>
        </span>
        {st.pos > 0 && <button className="btn small" onClick={() => document.querySelector(`.study-passage[data-idx="${st.pos}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" })}>{t(`Continue from passage ${st.pos + 1}`, `Lanjut dari bagian ${st.pos + 1}`)}</button>}
        <a className="btn small" href="#glows">{t("Glows & Grows", "Glows & Grows")}</a>
      </div>
      {mode === "interest" && !graph?.profile.interests && !graph?.profile.examples && <p className="small muted">{t("Tip: add your interests in Settings → About you, so the examples fit you.", "Tips: isi minatmu di Pengaturan → Tentang kamu, supaya contohnya cocok untukmu.")} <Link className="link" href="/settings">{t("Open Settings", "Buka Pengaturan")}</Link></p>}

      {missing > 0 && <div className="study-gen">
        <span className="small">{t(`${missing} passages have no question yet.`, `${missing} bagian belum punya pertanyaan.`)}</span>
        {ready ? (busy === "gen" ? <><span className="small muted">{t("Writing questions…", "Menulis pertanyaan…")}</span><button className="btn small" onClick={() => ctl.current?.abort()}>{t("Stop", "Berhenti")}</button></>
          : <button className="btn small primary" onClick={async () => { let left = missing; while (left > 0) { const r = await post({ action: "generate", max: 4 }, "gen"); if (!r || !r.added) break; left = r.left ?? 0; } }}>{t("Write questions with AI", "Tulis pertanyaan dengan AI")}</button>)
          : <Link className="btn small" href="/models">{t("Set up a model", "Atur model")}</Link>}
        <span className="small muted">{t("or, free with your Claude subscription, ask Claude Desktop:", "atau, gratis dengan langganan Claude, minta Claude Desktop:")}</span>
        <button className="chip" onClick={() => copy(claudePrompt)}>{claudePrompt}</button>
      </div>}

      <div className="study-text">
        {st.passages.map((p, i) => <PassageView key={p.chunkId} p={p} i={i} mode={mode} ready={ready} busy={busy} post={post} />)}
      </div>
      <Glows st={st} />
    </Page>
  );
}

function PassageView({ p, i, mode, ready, busy, post }: { p: StudyPassage; i: number; mode: StudyMode; ready: boolean; busy: string | null; post: (b: Record<string, unknown>, label?: string) => Promise<any> }) {
  const { t } = useGraph();
  const [showOrig, setShowOrig] = useState(false);
  const text = mode === "original" ? null : p.adapted[mode];
  const key = `adapt-${p.chunkId}-${mode}`;
  return (
    <section className="study-passage" data-idx={i} id={`p${i + 1}`}>
      <div className="passage-head">
        <span className="muted small">{t("Passage", "Bagian")} {i + 1}{p.page ? ` · ${t("p.", "hlm.")} ${p.page}` : ""}</span>
        {p.concepts.length > 0 && <span className="inline" style={{ flexWrap: "wrap" }}>{p.concepts.map((c) => <NodeBtn key={c} id={c} />)}</span>}
      </div>
      {mode === "original" || showOrig ? <div className="passage-orig">{p.text.split(/\n\s*\n/).map((para, k) => <p key={k}>{para}</p>)}</div> : null}
      {mode !== "original" && (text ? <>
        {!showOrig && <div className={`passage-adapt ${mode}`}><Markdown text={text} /></div>}
        <button className="link small" onClick={() => setShowOrig(!showOrig)}>{showOrig ? t("Back to this version", "Kembali ke versi ini") : t("Compare with the original", "Bandingkan dengan aslinya")}</button>
      </> : (
        <div className="passage-missing">
          <div className="passage-orig muted">{p.text.split(/\n\s*\n/).slice(0, 1).map((para, k) => <p key={k}>{para.slice(0, 220)}{para.length > 220 ? "…" : ""}</p>)}</div>
          {ready ? <button className="btn small" disabled={!!busy} onClick={() => post({ action: "adapt", chunkId: p.chunkId, mode }, key)}>{busy === key ? t("Writing…", "Menulis…") : t("Make this version", "Buat versi ini")}</button>
            : <span className="muted small">{t("Set up a model in Models, or ask Claude Desktop to prepare this source.", "Atur model di Model, atau minta Claude Desktop menyiapkan sumber ini.")}</span>}
        </div>
      ))}
      {p.items.map((it) => <Question key={it.id} it={it} post={post} />)}
    </section>
  );
}

function Question({ it, post }: { it: StudyItem; post: (b: Record<string, unknown>) => Promise<any> }) {
  const { t } = useGraph();
  const [choice, setChoice] = useState<number | null>(null), [conf, setConf] = useState<Confidence | null>(null);
  const [delta, setDelta] = useState<{ delta: number; now: number } | null>(null);
  const done = it.answeredAt != null;
  return (
    <div className={`check study-q${done ? (it.correct ? " right" : " wrong") : ""}`}>
      <b className="small">{t("Check your understanding", "Cek pemahamanmu")}</b>
      <div style={{ margin: "4px 0 8px" }}><Markdown text={it.question} /></div>
      <div className="opts">{it.options.map((o, k) => done
        ? <div key={k} className={`opt ${k === it.answer ? "right" : k === it.choice ? "wrong" : ""}`}><Markdown text={o} /></div>
        : <button key={k} className={`opt${choice === k ? " on" : ""}`} onClick={() => setChoice(k)}><Markdown text={o} /></button>)}</div>
      {!done ? (
        <div className="inline" style={{ marginTop: 8, flexWrap: "wrap" }}>
          <span className="small muted">{t("How sure are you?", "Seberapa yakin?")}</span>
          <div className="seg" role="group">{CONF.map((c) => <button key={c.k} aria-pressed={conf === c.k} onClick={() => setConf(c.k)}>{t(c.en, c.id)}</button>)}</div>
          <button className="btn primary small" disabled={choice == null || !conf} onClick={async () => { const r = await post({ action: "answer", itemId: it.id, choice, confidence: conf }); if (r?.mastery) setDelta(r.mastery); }}>{t("Check", "Cek")}</button>
        </div>
      ) : (
        <div className={`result ${it.correct ? "ok" : "bad"}`}>
          <b>{it.correct ? t("Right", "Benar") : t("Not quite", "Belum tepat")}</b>
          {delta && <span className="small"> · {t("mastery", "penguasaan")} {delta.delta >= 0 ? "+" : ""}{delta.delta} → {delta.now}%</span>}
          {!it.correct && it.confidence === "sure" && <span className="pill bad" style={{ marginLeft: 6 }}>{t("Misconception", "Miskonsepsi")}</span>}
          {it.why && <div className="small" style={{ marginTop: 4 }}><Markdown text={it.why} /></div>}
        </div>
      )}
    </div>
  );
}

/** Glows (strengths) and Grows (what to work on), built from your answers in this source. */
function Glows({ st }: { st: Study }) {
  const { t, graph, toast } = useGraph();
  const rows = st.passages.flatMap((p, i) => p.items.filter((it) => it.answeredAt).map((it) => ({ it, i })));
  const label = (id: string | null) => (id ? graph?.concepts.find((c) => c.id === id)?.label : null);
  const T = (b: { en: string; id: string } | null | undefined) => (b ? t(b.en, b.id || b.en) : null);
  if (!rows.length) return <div className="box glows" id="glows"><h3 style={{ marginTop: 0 }}>{t("Glows & Grows", "Glows & Grows")}</h3><p className="muted small" style={{ marginBottom: 0 }}>{t("Answer the questions as you read; your strengths and what to work on show up here.", "Jawab pertanyaan sambil membaca; kekuatanmu dan yang perlu dilatih akan muncul di sini.")}</p></div>;
  const right = rows.filter((r) => r.it.correct), wrong = rows.filter((r) => !r.it.correct);
  const sureRight = right.filter((r) => r.it.confidence === "sure"), guessed = right.filter((r) => r.it.confidence === "guess");
  const miscon = wrong.filter((r) => r.it.confidence === "sure");
  const pct = Math.round((right.length / rows.length) * 100);
  const total = st.passages.reduce((n, p) => n + p.items.length, 0);
  const teach = (c: string | null, q: string) => t(`Teach me ${c ? `“${c}”` : "this"}: I got this wrong while reading — ${q}`, `Ajari aku ${c ? `“${c}”` : "ini"}: aku salah menjawab ini saat membaca — ${q}`);
  const copy = async (s: string) => { try { await navigator.clipboard.writeText(s); toast(t("Copied: paste it in Claude Desktop", "Disalin: tempel di Claude Desktop")); } catch {} };
  return (
    <div className="box glows" id="glows">
      <div className="split"><h3 style={{ margin: 0 }}>{t("Glows & Grows", "Glows & Grows")}</h3><span className="badge acc">{pct}% · {rows.length}/{total}</span></div>
      <div className="grid2" style={{ marginTop: 12 }}>
        <div>
          <h4 className="glow-h">✦ {t("Glows: what you did well", "Glows: yang sudah bagus")}</h4>
          {right.length ? <ul className="small">
            {sureRight.length > 0 && <li>{t(`${sureRight.length} answered right and sure: solid understanding.`, `${sureRight.length} dijawab benar dan yakin: pemahamanmu kuat.`)}</li>}
            {[...new Set(right.map((r) => r.it.conceptId).filter(Boolean))].slice(0, 6).map((c) => <li key={c!}>{t("You understand", "Kamu paham")} <NodeBtn id={c!} /></li>)}
            {right.filter((r) => !r.it.conceptId).slice(0, 3).map((r) => <li key={r.it.id}><a className="link" href={`#p${r.i + 1}`}>{t("Passage", "Bagian")} {r.i + 1}</a>: {r.it.question.slice(0, 90)}</li>)}
          </ul> : <p className="small muted">{t("Nothing right yet. That's fine: the Grows show where to start.", "Belum ada yang benar. Tidak apa-apa: Grows menunjukkan dari mana mulai.")}</p>}
        </div>
        <div>
          <h4 className="grow-h">↗ {t("Grows: what to work on", "Grows: yang perlu dilatih")}</h4>
          {wrong.length || guessed.length ? <ul className="small">
            {miscon.length > 0 && <li><b>{t(`${miscon.length} confident but wrong`, `${miscon.length} yakin tapi salah`)}</b> {t("— these are misconceptions; they come back first in Review.", "— ini miskonsepsi; akan muncul paling awal di Review.")}</li>}
            {wrong.map((r) => (
              <li key={r.it.id}>
                <a className="link" href={`#p${r.i + 1}`}>{t("Re-read passage", "Baca ulang bagian")} {r.i + 1}</a>{r.it.conceptId && <> · <NodeBtn id={r.it.conceptId} tab="test" /></>}
                <div className="muted">{r.it.question.slice(0, 120)}</div>
                <button className="link small" onClick={() => copy(teach(T(label(r.it.conceptId)), r.it.question))}>{t("Copy a “Teach me” prompt", "Salin prompt “Ajari aku”")}</button>
              </li>
            ))}
            {guessed.length > 0 && <li>{t(`${guessed.length} right but guessed: worth a second look.`, `${guessed.length} benar tapi menebak: layak dicek lagi.`)}</li>}
          </ul> : <p className="small muted">{t("No gaps found in what you answered.", "Tidak ada celah di yang sudah kamu jawab.")}</p>}
        </div>
      </div>
    </div>
  );
}
