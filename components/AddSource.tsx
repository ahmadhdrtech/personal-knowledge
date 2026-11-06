"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, errText, useGraph } from "./store";
import { SAMPLE_TEXT, SAMPLE_TITLE } from "@/lib/seed-data";
import type { Graph, ImportReport } from "@/lib/types";
import Hint from "./Hint";

type Mode = "paste" | "file" | "url";
type Doc = { title: string; text: string; kind: string; urlOrPath: string | null; pages: number };
type Part = { text: string; pageStart: number };

const PART_CHARS = 20000;

/** Long documents go to the AI in parts; each part adds to the same source. */
function splitParts(text: string): Part[] {
  if (text.length <= PART_CHARS) return [{ text, pageStart: 1 }];
  const pages = text.split("\f");
  const parts: Part[] = [];
  let cur: string[] = [], curStart = 1, len = 0;
  const push = () => { if (cur.length) parts.push({ text: cur.join("\f"), pageStart: curStart }); cur = []; len = 0; };
  pages.forEach((p, i) => {
    if (p.length > PART_CHARS) {
      push();
      let buf = "";
      // paragraphs, then lines, then plain slices for text with no breaks at all
      const pieces = p.split(/\n\s*\n/).flatMap((x) => (x.length > PART_CHARS ? x.split("\n") : [x])).flatMap((x) => (x.length > PART_CHARS ? x.match(new RegExp(`[\\s\\S]{1,${PART_CHARS}}`, "g")) || [x] : [x]));
      for (const para of pieces) {
        if ((buf + para).length > PART_CHARS && buf) { parts.push({ text: buf, pageStart: i + 1 }); buf = ""; }
        buf = buf ? buf + "\n\n" + para : para;
      }
      if (buf) parts.push({ text: buf, pageStart: i + 1 });
      curStart = i + 2;
      return;
    }
    if (len + p.length > PART_CHARS && cur.length) { push(); curStart = i + 1; }
    if (!cur.length) curStart = i + 1;
    cur.push(p); len += p.length + 1;
  });
  push();
  return parts;
}

export default function AddSource({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone?: (r: ImportReport | null) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { graph, setGraph, act, toast, t } = useGraph();
  const [mode, setMode] = useState<Mode>("paste");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [doc, setDoc] = useState<Doc | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [resume, setResume] = useState<{ parts: Part[]; next: number; sourceId: number | null; doc: Doc } | null>(null);
  const ctl = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const d = ref.current!;
    if (open && !d.open) { d.showModal(); setErr(""); }
    if (!open && d.open) d.close();
  }, [open]);

  const reset = () => { setTitle(""); setText(""); setUrl(""); setDoc(null); setResume(null); setFileName(""); if (fileRef.current) fileRef.current.value = ""; };
  const ready = graph?.ai.ready;
  const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

  const readFile = async (f: File) => {
    setErr(""); setDoc(null); setBusy(t("Reading the file…", "Membaca file…"));
    try {
      const fd = new FormData(); fd.append("file", f);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message);
      setDoc(j); setTitle(j.title);
    } catch (e) { setErr(errText(e)); } finally { setBusy(null); }
  };
  const readUrl = async () => {
    setErr(""); setDoc(null); setBusy(t("Opening the page…", "Membuka halaman…"));
    try { const j = await api<Doc>("/api/extract", { json: { url } }); setDoc(j); setTitle(j.title); }
    catch (e) { setErr(errText(e)); } finally { setBusy(null); }
  };

  const run = async (d: Doc, parts: Part[], from: number, sourceId: number | null) => {
    setErr(""); setResume(null);
    ctl.current = new AbortController();
    let sid = sourceId, report: ImportReport | null = null;
    for (let i = from; i < parts.length; i++) {
      setBusy(parts.length > 1
        ? t(`Reading part ${i + 1} of ${parts.length} and finding concepts…`, `Membaca bagian ${i + 1} dari ${parts.length} dan mencari konsep…`)
        : t("Reading and finding concepts. This can take a minute…", "Membaca dan mencari konsep. Bisa sampai semenit…"));
      try {
        const res = await api<{ graph: Graph; report: ImportReport }>("/api/ai", {
          json: { task: "import", title: d.title, text: parts[i].text, kind: d.kind, urlOrPath: d.urlOrPath, sourceId: sid, pageStart: parts[i].pageStart, paged: d.pages > 1 },
          signal: ctl.current.signal,
        });
        setGraph(res.graph); report = res.report; sid = res.report.sourceId;
      } catch (e) {
        setErr(errText(e));
        if (i > 0 || parts.length > 1) setResume({ parts, next: i, sourceId: sid, doc: d });
        setBusy(null); ctl.current = null;
        return;
      }
    }
    setBusy(null); ctl.current = null;
    if (report) {
      toast(t(`Added ${report.added.length} new concepts, merged ${report.merged.length}`, `${report.added.length} konsep baru ditambahkan, ${report.merged.length} digabung`));
      reset(); onClose(); onDone?.(report);
    }
  };

  const go = () => {
    const d: Doc | null = mode === "paste" ? { title: title.trim() || t("Untitled source", "Sumber tanpa judul"), text: text.trim(), kind: "text", urlOrPath: null, pages: 1 } : doc ? { ...doc, title: title.trim() || doc.title } : null;
    if (!d) { setErr(mode === "file" ? t("Choose a file first.", "Pilih file dulu.") : t("Open a page first.", "Buka halamannya dulu.")); return; }
    if (words(d.text) < 25) { setErr(t("Paste at least a paragraph so there’s something to learn from.", "Tempel minimal satu paragraf supaya ada yang bisa dipelajari.")); return; }
    run(d, splitParts(d.text), 0, null);
  };
  const offline = async () => {
    const r = await act<ImportReport | null>("offlineDemo");
    toast(r ? t("Offline demo source added", "Sumber demo offline ditambahkan") : t("The offline demo is already in your map", "Demo offline sudah ada di petamu"));
    onClose(); onDone?.(r);
  };

  const current = mode === "paste" ? text : doc?.text || "";
  const parts = current ? splitParts(current).length : 0;

  return (
    <dialog ref={ref} aria-labelledby="addTitle" onClose={onClose} onCancel={onClose}>
      <h2 id="addTitle">{t("Add a source", "Tambah sumber")}</h2>
      <p className="muted">{t("The AI picks out the key concepts, matches them to concepts you already have, assigns domains, adds English and Indonesian terms, quotes the passage each concept comes from, and suggests links for you to approve.", "AI memilih konsep-konsep penting, mencocokkannya dengan konsep yang sudah ada, menentukan domain, menambahkan istilah bahasa Inggris dan Indonesia, mengutip bagian sumber tiap konsep, lalu menyarankan tautan untuk kamu setujui.")}</p>
      <div className="seg" role="group" aria-label={t("Source type", "Jenis sumber")} style={{ marginBottom: 4 }}>
        <button aria-pressed={mode === "paste"} onClick={() => { setMode("paste"); setErr(""); }}>{t("Paste text", "Tempel teks")}</button>
        <button aria-pressed={mode === "file"} onClick={() => { setMode("file"); setErr(""); }}>{t("Upload a file", "Unggah file")}</button>
        <button aria-pressed={mode === "url"} onClick={() => { setMode("url"); setErr(""); }}>{t("Web page", "Halaman web")}</button>
      </div>

      {mode === "file" && <>
        <label className="lab" htmlFor="srcFile">{t("File", "File")}<Hint>{t("PDF, Word (.docx), .txt, .md, or subtitles (.srt, .vtt) such as a YouTube transcript. Scanned PDFs need OCR first.", "PDF, Word (.docx), .txt, .md, atau subtitle (.srt, .vtt) seperti transkrip YouTube. PDF hasil scan perlu OCR dulu.")}</Hint></label>
        <div className="inline">
          <input id="srcFile" ref={fileRef} type="file" hidden accept=".pdf,.docx,.txt,.md,.markdown,.srt,.vtt" disabled={!!busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFileName(f.name); readFile(f); } }} />
          <button className="btn" disabled={!!busy} onClick={() => fileRef.current?.click()}>{t("Choose a file", "Pilih file")}</button>
          <span className="muted small">{fileName || t("No file chosen", "Belum ada file")}</span>
        </div>
      </>}
      {mode === "url" && <>
        <label className="lab" htmlFor="srcUrl">{t("Web address", "Alamat web")}<Hint>{t("Works for articles and online PDFs. Pages behind a login, or that need JavaScript, won’t open; copy their text and paste it instead.", "Bisa untuk artikel dan PDF online. Halaman yang butuh login atau JavaScript tidak bisa dibuka; salin teksnya lalu tempel.")}</Hint></label>
        <div className="split"><input id="srcUrl" className="field" type="url" placeholder="https://…" value={url} disabled={!!busy} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && url) readUrl(); }} />
          <button className="btn" disabled={!url || !!busy} onClick={readUrl}>{t("Open page", "Buka halaman")}</button></div>
      </>}

      {(mode === "paste" || doc) && <>
        <label className="lab" htmlFor="srcTitle">{t("Title", "Judul")}</label>
        <input id="srcTitle" className="field" placeholder={t("e.g. Chapter 3, Consumer Behavior", "mis. Bab 3, Perilaku Konsumen")} value={title} onChange={(e) => setTitle(e.target.value)} />
      </>}
      {mode === "paste" && <>
        <label className="lab" htmlFor="srcText">{t("Text", "Teks")}</label>
        <textarea id="srcText" className="field" rows={9} placeholder={t("Paste an article, your notes or a transcript", "Tempel artikel, catatanmu, atau transkrip")} value={text} onChange={(e) => setText(e.target.value)} />
      </>}
      {doc && mode !== "paste" && (
        <div className="card" style={{ marginTop: 10 }}>
          <p className="small" style={{ margin: 0 }}><strong>{t("Ready to import", "Siap diimpor")}</strong> · {words(doc.text).toLocaleString()} {t("words", "kata")}{doc.pages > 1 ? ` · ${doc.pages} ${t("pages", "halaman")}` : ""}</p>
          <p className="muted small" style={{ margin: "6px 0 0", maxHeight: 90, overflow: "hidden" }}>{doc.text.replace(/\f/g, " ").slice(0, 400)}…</p>
        </div>
      )}
      {parts > 1 && <p className="muted small" style={{ margin: "8px 0 0" }}>{t(`This is long, so it will be read in ${parts} parts, one after another. Each part costs one AI call; see Usage for the cost.`, `Teks ini panjang, jadi akan dibaca dalam ${parts} bagian berurutan. Setiap bagian memakai satu panggilan AI; lihat biayanya di Pemakaian.`)}</p>}

      {!ready && <p className="err">{t("No AI model is set for the current depth, so concepts can’t be extracted yet.", "Belum ada model AI untuk tingkat yang dipilih, jadi konsep belum bisa diambil.")} <Link className="link" href="/models" onClick={onClose}>{t("Set up a model", "Atur model")}</Link>{t(", or add the offline demo.", ", atau tambahkan demo offline.")}</p>}
      {err && <div className="err">{err}</div>}
      {busy && <div className="status"><span>{busy}</span>{ctl.current && <button className="btn small" onClick={() => ctl.current?.abort()}>{t("Stop", "Berhenti")}</button>}</div>}
      {resume && !busy && <div className="btnrow"><button className="btn small" onClick={() => run(resume.doc, resume.parts, resume.next, resume.sourceId)}>{t(`Continue from part ${resume.next + 1}`, `Lanjutkan dari bagian ${resume.next + 1}`)}</button></div>}
      <div className="btnrow">
        <button className="btn primary" disabled={!ready || !!busy} onClick={go}>{t("Find concepts", "Cari konsep")}</button>
        {mode === "paste" && <button className="btn" disabled={!!busy} onClick={() => { setTitle(SAMPLE_TITLE); setText(SAMPLE_TEXT); }}>{t("Use the sample article", "Pakai artikel contoh")}</button>}
        {!graph?.demoOffline && <button className="btn" disabled={!!busy} onClick={offline}>{t("Add offline demo", "Tambah demo offline")}</button>}
        <button className="btn" onClick={() => { if (!busy) onClose(); }}>{t("Close", "Tutup")}</button>
      </div>
    </dialog>
  );
}
