"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Page from "@/components/Page";
import { api, useGraph } from "@/components/store";
import AddSource from "@/components/AddSource";
import { fmtDate, NodeBtn } from "@/components/ui";
import type { SourceRow } from "@/lib/types";

export default function SourcesPage() {
  const { graph, refresh, toast, t, lang } = useGraph();
  const [rows, setRows] = useState<SourceRow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<{ id: number; title: string; text: string } | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  const load = () => api<SourceRow[]>("/api/sources").then(setRows);
  useEffect(() => { load(); }, [graph?.concepts.length, graph?.lastImport?.at]);

  const del = async (id: number) => {
    if (armed !== id) { setArmed(id); return; }
    setRows(await api<SourceRow[]>(`/api/sources?id=${id}`, { method: "DELETE" }));
    setArmed(null); await refresh(); toast(t("Source removed. Its concepts stay in your map.", "Sumber dihapus. Konsep-konsepnya tetap ada di petamu."));
  };
  const KIND: Record<string, string> = { text: t("Pasted text", "Teks tempelan"), note: t("Note", "Catatan"), pdf: "PDF", docx: "Word", url: t("Web page", "Halaman web") };

  return (
    <Page title={t("Sources", "Sumber")} lede={t("Everything you’ve read. Each source is broken into concepts; a concept seen in two sources is one node, and each one quotes the passage it came from.", "Semua yang sudah kamu baca. Setiap sumber dipecah menjadi konsep; konsep yang muncul di dua sumber tetap satu titik, dan masing-masing mengutip bagian sumbernya.")}
      actions={<button className="btn primary" onClick={() => setAdding(true)}>{t("Add source", "Tambah sumber")}</button>}>
      {rows === null ? <p className="muted">{t("Loading…", "Memuat…")}</p> : rows.length === 0 ? <div className="empty">{t("No sources yet. Add one to start your map.", "Belum ada sumber. Tambahkan satu untuk memulai petamu.")}</div> : (
        <div className="tablewrap"><table className="t">
          <thead><tr><th>{t("Title", "Judul")}</th><th>{t("Kind", "Jenis")}</th><th>{t("Concepts", "Konsep")}</th><th className="num">{t("Words", "Kata")}</th><th className="num">{t("Passages", "Bagian")}</th><th>{t("Added", "Ditambahkan")}</th><th></th></tr></thead>
          <tbody>{rows.map((s) => (
            <tr key={s.id}>
              <td style={{ fontWeight: 500 }}>{s.title}{s.urlOrPath && /^https?:/.test(s.urlOrPath) && <div><a className="link small" href={s.urlOrPath} target="_blank" rel="noreferrer">{new URL(s.urlOrPath).hostname}</a></div>}</td>
              <td><span className="badge">{KIND[s.kind] || s.kind}</span></td>
              <td>{s.concepts.length ? s.concepts.map((c, i) => <span key={c.id}>{i ? ", " : ""}<NodeBtn id={c.id} /></span>) : <span className="muted">–</span>}</td>
              <td className="num">{s.words ? s.words.toLocaleString() : "–"}</td>
              <td className="num">{s.chunks || "–"}</td>
              <td className="muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(s.createdAt, lang)}</td>
              <td><div className="inline">
                {s.chunks > 0 && <Link className="btn small primary" href={`/study?source=${s.id}`}>{t("Study", "Pelajari")}</Link>}
                {s.words > 0 && <button className="btn small" onClick={async () => setView(await api(`/api/sources?id=${s.id}`))}>{t("Read", "Baca")}</button>}
                <button className="btn small" onClick={() => del(s.id)}>{armed === s.id ? t("Click again to remove", "Klik lagi untuk menghapus") : t("Remove", "Hapus")}</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {view && (
        <div className="box" style={{ marginTop: 16 }}>
          <div className="split"><h3 style={{ margin: 0 }}>{view.title}</h3><button className="btn small" onClick={() => setView(null)}>{t("Close", "Tutup")}</button></div>
          <div className="summary" style={{ whiteSpace: "pre-wrap", marginTop: 12, fontSize: 17 }}>
            {view.text.split("\f").map((p, i, a) => <div key={i}>{a.length > 1 && <p className="muted small" style={{ fontFamily: "inherit" }}>— {t("Page", "Halaman")} {i + 1} —</p>}{p}</div>)}
          </div>
        </div>
      )}
      <AddSource open={adding} onClose={() => setAdding(false)} onDone={() => load()} />
    </Page>
  );
}
