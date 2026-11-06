"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Page from "@/components/Page";
import Markdown from "@/components/Markdown";
import Hint from "@/components/Hint";
import { api, errText, useGraph } from "@/components/store";
import { fmtDate, NodeBtn } from "@/components/ui";
import { CONF } from "@/lib/logic";
import type { Confidence, Lesson, LessonStep } from "@/lib/types";

const VERDICT: Record<string, { en: string; id: string; cls: string }> = {
  knows: { en: "Knew it", id: "Sudah paham", cls: "ok" },
  partly: { en: "Partly", id: "Sebagian", cls: "" },
  gap: { en: "Gap", id: "Belum tahu", cls: "warn" },
  misconception: { en: "Misconception", id: "Miskonsepsi", cls: "bad" },
};

export default function LessonsPage() {
  const { t, lang, toast } = useGraph();
  const [list, setList] = useState<Lesson[] | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const load = () => api<{ lessons: Lesson[] }>("/api/lessons").then((r) => setList(r.lessons)).catch((e) => toast(errText(e)));
  useEffect(() => {
    load();
    // Claude Desktop writes lessons while you watch: refresh when the tab comes back and every few seconds
    const f = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", f);
    const iv = setInterval(f, 5000);
    return () => { document.removeEventListener("visibilitychange", f); clearInterval(iv); };
  }, []);
  const cur = list?.find((l) => l.id === sel) || list?.[0] || null;
  const post = async (b: Record<string, unknown>) => { try { const r = await api<{ lessons: Lesson[]; correct?: boolean; mastery?: { delta: number; now: number } | null }>("/api/lessons", { method: "POST", body: JSON.stringify(b) }); setList(r.lessons); return r; } catch (e) { toast(errText(e)); return null; } };

  return (
    <Page title={t("Lessons", "Pelajaran")} lede={t("“Teach me” lessons from Claude Desktop: what you already knew, the plan to your goal, and every step with its explanation, diagrams and check. Answers here update your mastery and review schedule.", "Pelajaran “Ajari aku” dari Claude Desktop: apa yang sudah kamu tahu, rencana menuju tujuanmu, dan tiap langkah dengan penjelasan, diagram, dan soal cek. Jawaban di sini memperbarui penguasaan dan jadwal reviewmu.")}>
      {!list ? <p className="muted">{t("Loading…", "Memuat…")}</p> : !list.length ? <Empty /> : (
        <div className="writing-grid">
          <div className="box">
            <h3 style={{ marginTop: 0 }}>{t("Your lessons", "Pelajaranmu")}</h3>
            <ul className="plain">{list.map((l) => {
              const done = l.steps.filter((s) => s.status === "passed").length;
              return (
                <li key={l.id}><button className={`wr-item${cur?.id === l.id ? " on" : ""}`} onClick={() => setSel(l.id)}>
                  <span className="wr-title">{l.goal}</span>
                  <span className="muted small">{l.status === "done" ? t("Finished", "Selesai") : l.status === "probing" ? t("Checking what you know", "Mengecek yang kamu tahu") : t(`${done} of ${l.steps.length} steps`, `${done} dari ${l.steps.length} langkah`)} · {fmtDate(l.updatedAt, lang)}</span>
                  {l.steps.length > 0 && <span className="lesson-bar" aria-hidden><span style={{ width: `${(done / l.steps.length) * 100}%` }} /></span>}
                </button></li>
              );
            })}</ul>
            <ContinueBox lesson={cur} />
          </div>
          {cur && <LessonView key={cur.id} l={cur} post={post} />}
        </div>
      )}
    </Page>
  );
}

function Empty() {
  const { t, toast } = useGraph();
  const ex = t("Teach me why compound interest grows so fast", "Ajari aku kenapa bunga majemuk tumbuh begitu cepat");
  return (
    <div className="box">
      <h3 style={{ marginTop: 0 }}>{t("No lessons yet", "Belum ada pelajaran")}</h3>
      <p className="small">{t("In Claude Desktop (with Neuron connected), click + → neuron → Teach me, or just type:", "Di Claude Desktop (dengan Neuron terhubung), klik + → neuron → Teach me, atau ketik saja:")}</p>
      <button className="chip" onClick={async () => { try { await navigator.clipboard.writeText(ex); toast(t("Copied", "Disalin")); } catch {} }}>{ex}</button>
      <ol className="small" style={{ marginTop: 14 }}>
        <li>{t("Claude asks 3–5 questions to find what you already understand.", "Claude bertanya 3–5 hal untuk mengetahui apa yang sudah kamu pahami.")}</li>
        <li>{t("It plans the steps from your gaps to the goal, using your map.", "Claude menyusun langkah dari celah pemahamanmu ke tujuan, memakai petamu.")}</li>
        <li>{t("Each step: you predict, it explains (with flowcharts, equations, tables or figures), then checks you.", "Tiap langkah: kamu menebak, Claude menjelaskan (dengan diagram alur, persamaan, tabel, atau gambar), lalu mengecekmu.")}</li>
        <li>{t("Everything is saved here, and your answers update mastery and review.", "Semuanya tersimpan di sini, dan jawabanmu memperbarui penguasaan dan review.")}</li>
      </ol>
      <Link className="btn" href="/connect">{t("Connect Claude Desktop", "Hubungkan Claude Desktop")}</Link>
    </div>
  );
}

function ContinueBox({ lesson }: { lesson: Lesson | null }) {
  const { t, toast } = useGraph();
  if (!lesson || lesson.status === "done") return null;
  const text = t(`Continue my Neuron lesson #${lesson.id}`, `Lanjutkan pelajaran Neuron #${lesson.id}`);
  return (
    <div className="small" style={{ marginTop: 12 }}>
      <span className="muted">{t("To continue in Claude Desktop, paste:", "Untuk lanjut di Claude Desktop, tempel:")}</span>
      <button className="chip" style={{ marginTop: 6 }} onClick={async () => { try { await navigator.clipboard.writeText(text); toast(t("Copied", "Disalin")); } catch {} }}>{text}</button>
    </div>
  );
}

function LessonView({ l, post }: { l: Lesson; post: (b: Record<string, unknown>) => Promise<{ correct?: boolean; mastery?: { delta: number; now: number } | null } | null> }) {
  const { t, lang } = useGraph();
  const [i, setI] = useState(Math.min(l.current, Math.max(0, l.steps.length - 1)));
  const [armed, setArmed] = useState(false);
  const s = l.steps[i];
  const done = l.steps.filter((x) => x.status === "passed").length;
  return (
    <div className="box lesson">
      <div className="split" style={{ alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: 0 }}>{l.goal}</h2>
          <p className="muted small" style={{ margin: "4px 0 0" }}>{t("Started", "Dimulai")} {fmtDate(l.createdAt, lang)} · {t(`${done} of ${l.steps.length} steps passed`, `${done} dari ${l.steps.length} langkah lulus`)}</p>
        </div>
        <button className="btn small danger" onBlur={() => setArmed(false)} onClick={async () => { if (!armed) { setArmed(true); return; } await post({ action: "delete", id: l.id }); }}>{armed ? t("Click again to delete", "Klik lagi untuk menghapus") : t("Delete", "Hapus")}</button>
      </div>

      {l.startSummary && <div className="lesson-start">
        <h4>{t("Where you started", "Titik awalmu")}<Hint>{t("What the first questions showed about your understanding before the lesson.", "Apa yang ditunjukkan pertanyaan awal tentang pemahamanmu sebelum pelajaran.")}</Hint></h4>
        <p className="small" style={{ margin: "4px 0 8px" }}>{l.startSummary}</p>
        {l.probe.length > 0 && <ul className="plain probe-list">{l.probe.map((p, k) => (
          <li key={k} className="small"><span className={`badge ${VERDICT[p.verdict]?.cls || ""}`}>{t(VERDICT[p.verdict]?.en || p.verdict, VERDICT[p.verdict]?.id || p.verdict)}</span> {p.question} <span className="muted">→ “{p.answer}”</span></li>
        ))}</ul>}
      </div>}

      {l.steps.length > 0 && <ol className="stepper" aria-label={t("Lesson steps", "Langkah pelajaran")}>
        {l.steps.map((x, k) => (
          <li key={k}><button className={`step-pill ${x.status}${k === i ? " on" : ""}`} onClick={() => setI(k)} aria-current={k === i ? "step" : undefined}>
            <span className="step-n">{x.status === "passed" ? "✓" : k + 1}</span><span className="step-t">{x.title}</span>
          </button></li>
        ))}
      </ol>}

      {s ? <StepView key={i} l={l} i={i} s={s} post={post} next={() => setI(Math.min(l.steps.length - 1, i + 1))} /> : <p className="muted">{t("Claude is still checking what you know. The plan appears here when it’s ready.", "Claude masih mengecek yang kamu tahu. Rencananya muncul di sini setelah siap.")}</p>}

      {l.status === "done" && <div className="lesson-start" style={{ marginTop: 16 }}>
        <h4>{t("Summary", "Ringkasan")}</h4>
        {l.summary && <Markdown text={l.summary} />}
        {l.next.length > 0 && <><b className="small">{t("Next", "Selanjutnya")}</b><ul className="small">{l.next.map((n, k) => <li key={k}>{n}</li>)}</ul></>}
      </div>}
    </div>
  );
}

function StepView({ l, i, s, post, next }: { l: Lesson; i: number; s: LessonStep; post: (b: Record<string, unknown>) => Promise<{ correct?: boolean; mastery?: { delta: number; now: number } | null } | null>; next: () => void }) {
  const { t } = useGraph();
  const [choice, setChoice] = useState<number | null>(null), [conf, setConf] = useState<Confidence | null>(null);
  const [res, setRes] = useState<{ correct: boolean; mastery?: { delta: number; now: number } | null } | null>(null);
  const [retry, setRetry] = useState(false);
  const mc = s.check?.options && typeof s.check.answer_index === "number";
  const answered = s.result && !retry;
  const status = useMemo(() => ({ todo: t("Not started", "Belum mulai"), teaching: t("In progress", "Berjalan"), passed: t("Passed", "Lulus"), needs_review: t("Needs another look", "Perlu diulang") }[s.status]), [s.status, t]);
  return (
    <div className="step-body">
      <div className="split" style={{ alignItems: "baseline" }}>
        <h3 style={{ margin: 0 }}>{t("Step", "Langkah")} {i + 1}. {s.title}</h3>
        <span className={`badge ${s.status === "passed" ? "ok" : s.status === "needs_review" ? "bad" : ""}`}>{status}</span>
      </div>
      {(s.concept || s.why) && <p className="muted small" style={{ margin: "4px 0 0" }}>{s.concept && <NodeBtn id={s.concept} />} {s.why}</p>}

      {s.predict && <div className="predict">
        <b className="small">{t("Predict first", "Tebak dulu")}</b>
        <p style={{ margin: "4px 0 0" }}>{s.predict}</p>
        {s.prediction && <p className="muted small" style={{ margin: "4px 0 0" }}>{t("Your guess:", "Tebakanmu:")} “{s.prediction}”</p>}
      </div>}

      {s.explanation ? <div className="wr-body lesson-text"><Markdown text={s.explanation} /></div>
        : <p className="muted small">{t("Claude hasn’t explained this step yet.", "Claude belum menjelaskan langkah ini.")}</p>}

      {s.check && <div className="check">
        <b className="small">{t("Check", "Cek pemahaman")}</b>
        <div style={{ margin: "4px 0 8px" }}><Markdown text={s.check.question} /></div>
        {mc && !answered && <>
          <div className="opts">{s.check.options!.map((o, k) => <button key={k} className={`opt${choice === k ? " on" : ""}`} onClick={() => setChoice(k)}><Markdown text={o} /></button>)}</div>
          <div className="inline" style={{ marginTop: 8, flexWrap: "wrap" }}>
            <span className="small muted">{t("How sure are you?", "Seberapa yakin?")}</span>
            <div className="seg" role="group">{CONF.map((c) => <button key={c.k} aria-pressed={conf === c.k} onClick={() => setConf(c.k)}>{t(c.en, c.id)}</button>)}</div>
            <button className="btn primary small" disabled={choice == null || !conf} onClick={async () => { const r = await post({ action: "answer", id: l.id, step: i, choice, confidence: conf }); if (r) { setRes({ correct: !!r.correct, mastery: r.mastery }); setRetry(false); } }}>{t("Check my answer", "Cek jawabanku")}</button>
          </div>
        </>}
        {mc && answered && <div className="opts">{s.check.options!.map((o, k) => <div key={k} className={`opt ${k === s.check!.answer_index ? "right" : s.result?.answer === o && !s.result.correct ? "wrong" : ""}`}><Markdown text={o} /></div>)}</div>}
        {!mc && !s.result && <p className="muted small">{t("Answer this one in Claude Desktop.", "Jawab soal ini di Claude Desktop.")}</p>}
        {answered && s.result && <div className={`result ${s.result.correct ? "ok" : "bad"}`}>
          <b>{s.result.correct ? t("Right", "Benar") : t("Not yet", "Belum tepat")}</b>
          {(res?.mastery || null) && <span className="small"> · {t("mastery", "penguasaan")} {res!.mastery!.delta >= 0 ? "+" : ""}{res!.mastery!.delta} → {res!.mastery!.now}%</span>}
          {s.result.misconception && <p className="small" style={{ margin: "4px 0 0" }}>{t("The confusion:", "Yang membingungkan:")} {s.result.misconception}</p>}
          {s.check.why && <div className="small" style={{ marginTop: 4 }}><Markdown text={s.check.why} /></div>}
          {s.result.feedback && <div className="small" style={{ marginTop: 4 }}><Markdown text={s.result.feedback} /></div>}
          <div className="btnrow">
            {!s.result.correct && mc && <button className="btn small" onClick={() => { setRetry(true); setChoice(null); setConf(null); }}>{t("Try again", "Coba lagi")}</button>}
            {i < l.steps.length - 1 && <button className="btn small primary" onClick={next}>{t("Next step", "Langkah berikutnya")}</button>}
          </div>
        </div>}
      </div>}
    </div>
  );
}
