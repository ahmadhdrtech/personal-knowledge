"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Page from "@/components/Page";
import Markdown from "@/components/Markdown";
import Hint from "@/components/Hint";
import { api, errText, useGraph } from "@/components/store";
import { fmtDate, NodeBtn } from "@/components/ui";
import { BRIEF, FROM, GROUPS, KINDS, TECHNIQUES, type BriefKey } from "@/lib/writing-guide";
import type { PostFields, Writing } from "@/lib/types";

const LABEL: Record<BriefKey, { en: string; id: string }> = {
  originator: { en: "Speaker", id: "Pembicara" }, audience: { en: "Audience", id: "Audiens" }, genre: { en: "Genre", id: "Genre" },
  purpose: { en: "Purpose", id: "Tujuan" }, stance: { en: "Stance", id: "Sikap" }, context: { en: "Context", id: "Konteks" },
  culture: { en: "Culture", id: "Budaya" }, language: { en: "Language", id: "Bahasa" }, expectations: { en: "Expectations", id: "Harapan" },
  technique: { en: "Technique", id: "Teknik" }, style: { en: "Style and tone", id: "Gaya dan nada" }, visuals: { en: "Nonverbal", id: "Nonverbal" },
  material: { en: "Material", id: "Bahan" }, footprint: { en: "Footprint", id: "Jejak digital" },
};

export default function WritingPage() {
  return <Suspense><WritingInner /></Suspense>;
}

function WritingInner() {
  const { t } = useGraph();
  const params = useSearchParams(), router = useRouter();
  const tab = params.get("tab") === "guide" ? "guide" : "saved";
  return (
    <Page title={t("Writing", "Tulisan")} lede={t("Pieces Claude wrote with you and notes from your discussions, saved from Claude Desktop. The guide shows the questions Claude asks before it writes.", "Tulisan yang dibuat Claude bersamamu dan catatan dari diskusimu, disimpan dari Claude Desktop. Panduan menunjukkan pertanyaan yang diajukan Claude sebelum menulis.")}>
      <div className="tabs-row" role="tablist">
        <button className="tab" role="tab" aria-selected={tab === "saved"} onClick={() => router.replace("/writing", { scroll: false })}>{t("Saved", "Tersimpan")}</button>
        <button className="tab" role="tab" aria-selected={tab === "guide"} onClick={() => router.replace("/writing?tab=guide", { scroll: false })}>{t("Writing guide", "Panduan menulis")}</button>
      </div>
      {tab === "saved" ? <Saved /> : <Guide />}
    </Page>
  );
}

function Saved() {
  const { t, lang, toast } = useGraph();
  const [items, setItems] = useState<Writing[] | null>(null);
  const [kind, setKind] = useState<"all" | "writing" | "note">("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [edit, setEdit] = useState<{ title: string; body: string; post: PostFields | null } | null>(null);
  const [armed, setArmed] = useState(false);
  const load = () => api<{ items: Writing[] }>("/api/writing").then((r) => setItems(r.items)).catch((e) => toast(errText(e)));
  useEffect(() => { load(); const f = () => document.visibilityState === "visible" && load(); document.addEventListener("visibilitychange", f); return () => document.removeEventListener("visibilitychange", f); }, []);
  const shown = useMemo(() => (items || []).filter((w) => (kind === "all" || w.kind === kind) && (!q || `${w.title} ${w.body} ${Object.values(w.brief).join(" ")}`.toLowerCase().includes(q.toLowerCase()))), [items, kind, q]);
  const cur = shown.find((w) => w.id === sel) || shown[0] || null;
  useEffect(() => { setEdit(null); setArmed(false); }, [cur?.id]);
  const post = async (b: Record<string, unknown>) => { try { const r = await api<{ items: Writing[] }>("/api/writing", { method: "POST", body: JSON.stringify(b) }); setItems(r.items); return true; } catch (e) { toast(errText(e)); return false; } };

  if (!items) return <p className="muted">{t("Loading…", "Memuat…")}</p>;
  if (!items.length) return (
    <div className="box">
      <h3 style={{ marginTop: 0 }}>{t("Nothing saved yet", "Belum ada yang tersimpan")}</h3>
      <p className="muted small">{t("In Claude Desktop, with Neuron connected:", "Di Claude Desktop, dengan Neuron terhubung:")}</p>
      <ul className="small">
        <li>{t("Ask it to write something, e.g. “Write a LinkedIn post about the rhetorical situation”. Claude asks you the brief first, then offers to save the piece here.", "Minta Claude menulis, mis. “Tulis postingan LinkedIn tentang situasi retoris”. Claude menanyakan brief dulu, lalu menawarkan menyimpan tulisannya di sini.")}</li>
        <li>{t("After a discussion, say “save this discussion to Neuron”. Claude drafts a note, shows it to you and saves it after you approve.", "Setelah diskusi, bilang “simpan diskusi ini ke Neuron”. Claude membuat draf catatan, menunjukkannya, lalu menyimpan setelah kamu setujui.")}</li>
        <li>{t("Or use the ready-made prompts in Claude’s + menu: Write with Neuron, Save this discussion, Read a text critically.", "Atau pakai prompt siap pakai di menu + Claude: Write with Neuron, Save this discussion, Read a text critically.")}</li>
      </ul>
      <div className="btnrow"><Link className="btn" href="/connect">{t("Connect Claude Desktop", "Hubungkan Claude Desktop")}</Link><Link className="btn" href="/writing?tab=guide">{t("Read the writing guide", "Baca panduan menulis")}</Link></div>
    </div>
  );

  return (
    <div className="writing-grid">
      <div className="box">
        <div className="seg" role="group" aria-label={t("Show", "Tampilkan")} style={{ marginBottom: 8 }}>
          {(["all", "writing", "note"] as const).map((k) => <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{k === "all" ? t("All", "Semua") : k === "writing" ? t("Writing", "Tulisan") : t("Notes", "Catatan")}</button>)}
        </div>
        <input className="field" type="search" placeholder={t("Filter", "Saring")} aria-label={t("Filter", "Saring")} value={q} onChange={(e) => setQ(e.target.value)} />
        {shown.length ? <ul className="plain" style={{ marginTop: 8 }}>{shown.map((w) => (
          <li key={w.id}><button className={`wr-item${cur?.id === w.id ? " on" : ""}`} onClick={() => setSel(w.id)}>
            <span className="wr-title">{w.title}</span>
            <span className="muted small">{w.kind === "note" ? t("Note", "Catatan") : w.brief.genre || t("Writing", "Tulisan")} · {fmtDate(w.updatedAt, lang)}</span>
          </button></li>
        ))}</ul> : <p className="muted small">{t("Nothing matches.", "Tidak ada yang cocok.")}</p>}
      </div>
      {cur && <div className="box">
        <div className="split" style={{ alignItems: "flex-start" }}>
          <div>
            {edit ? <input className="field" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} aria-label={t("Title", "Judul")} />
              : <h2 style={{ margin: 0 }}>{cur.title}</h2>}
            <p className="muted small" style={{ margin: "4px 0 0" }}><span className={`badge${cur.kind === "note" ? "" : " acc"}`}>{cur.kind === "note" ? t("Discussion note", "Catatan diskusi") : t("Writing", "Tulisan")}</span> {t("Saved", "Disimpan")} {fmtDate(cur.createdAt, lang)}{cur.updatedAt - cur.createdAt > 60000 ? ` · ${t("edited", "diubah")} ${fmtDate(cur.updatedAt, lang)}` : ""}</p>
          </div>
          {!edit && <div className="wr-actions">
            <button className="btn small" onClick={async () => { try { await navigator.clipboard.writeText(cur.body); toast(t("Copied", "Disalin")); } catch { toast(t("Couldn’t copy", "Tidak bisa menyalin")); } }}>{t("Copy text", "Salin teks")}</button>
            <button className="btn small" onClick={() => setEdit({ title: cur.title, body: cur.body, post: cur.post })}>{t("Edit", "Ubah")}</button>
            <button className="btn small danger" onBlur={() => setArmed(false)} onClick={async () => { if (!armed) { setArmed(true); return; } if (await post({ action: "delete", id: cur.id })) { setSel(null); toast(t("Deleted", "Dihapus")); } }}>{armed ? t("Click again to delete", "Klik lagi untuk menghapus") : t("Delete", "Hapus")}</button>
          </div>}
        </div>
        {cur.post && !edit && <BlogPanel w={cur} />}
        {edit?.post && <PostEditor p={edit.post} set={(post) => setEdit({ ...edit, post })} />}
        {Object.keys(cur.brief).length > 0 && <dl className="brief">
          {BRIEF.filter((b) => cur.brief[b.key]).map((b) => <div key={b.key}><dt>{t(LABEL[b.key].en, LABEL[b.key].id)}</dt><dd>{cur.brief[b.key]}</dd></div>)}
          {Object.keys(cur.brief).filter((k) => !(k in LABEL)).map((k) => <div key={k}><dt>{k}</dt><dd>{cur.brief[k]}</dd></div>)}
        </dl>}
        {edit ? <>
          <textarea className="field mono" rows={18} value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} aria-label={t("Text", "Teks")} style={{ marginTop: 12 }} />
          <p className="muted small">{t("Markdown works: # heading, - list, **bold**, *italic*.", "Markdown bisa dipakai: # judul, - daftar, **tebal**, *miring*.")}</p>
          <div className="btnrow"><button className="btn primary small" onClick={async () => { if (await post({ action: "update", id: cur.id, title: edit.title, body: edit.body, post: edit.post })) { setEdit(null); toast(t("Saved", "Disimpan")); } }}>{t("Save", "Simpan")}</button><button className="btn small" onClick={() => setEdit(null)}>{t("Cancel", "Batal")}</button></div>
        </> : <div className="wr-body"><Markdown text={cur.body} /></div>}
        {cur.conceptIds.length > 0 && <div className="inline" style={{ flexWrap: "wrap", marginTop: 12 }}><span className="muted small">{t("Concepts:", "Konsep:")}</span>{cur.conceptIds.map((id) => <NodeBtn key={id} id={id} />)}</div>}
      </div>}
    </div>
  );
}

function Guide() {
  const { t, lang } = useGraph();
  const L = lang === "id" ? "id" : "en";
  return (
    <>
      <div className="box" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>{t("The rhetorical situation", "Situasi retoris")}</h3>
        <p className="small">{t("Every piece of communication has agents and conditions. The agents are the originator (who speaks) and the audience, real or anticipated. The conditions are genre, purpose, stance, context and culture. Writing rhetorically means deciding these on purpose before you write, so you can predict how your audience will react.", "Setiap komunikasi punya pelaku dan kondisi. Pelakunya adalah pembuat pesan (yang berbicara) dan audiens, nyata atau diantisipasi. Kondisinya adalah genre, tujuan, sikap, konteks, dan budaya. Menulis secara retoris berarti menentukan semua ini dengan sengaja sebelum menulis, supaya kamu bisa memperkirakan reaksi audiens.")}</p>
        <p className="muted small" style={{ marginBottom: 0 }}>{t("Your list had the five conditions. Two points from the same text were missing: the agents (who is speaking, and the audience, real or anticipated). They are added below as the first two questions, together with points from the section’s learning outcomes (language, expectations, patterns of organization, verbal and nonverbal elements) and from Social Media Savvy (digital footprint).", "Daftarmu berisi lima kondisi. Dua poin dari teks yang sama belum ada: pelaku (siapa yang berbicara, dan audiens, nyata atau diantisipasi). Keduanya ditambahkan di bawah sebagai dua pertanyaan pertama, bersama poin dari capaian belajar bagian itu (bahasa, harapan, pola penyusunan, unsur verbal dan nonverbal) dan dari Cerdas bermedia sosial (jejak digital).")}</p>
      </div>
      <div className="box" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>{t("How Claude uses it", "Cara Claude memakainya")}</h3>
        <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>
          <li>{t("You ask Claude Desktop to write something.", "Kamu minta Claude Desktop menulis sesuatu.")}</li>
          <li>{t("Claude asks the core questions below in one message, each with a hint on how to answer and examples. Answer briefly, skip the optional ones, or say “you choose”.", "Claude menanyakan pertanyaan inti di bawah dalam satu pesan, masing-masing dengan petunjuk cara menjawab dan contoh. Jawab singkat, lewati yang opsional, atau bilang “terserah kamu”.")}</li>
          <li>{t("It repeats the brief back in a few lines and names the technique it will use.", "Claude mengulang brief dalam beberapa baris dan menyebut teknik yang akan dipakai.")}</li>
          <li>{t("It writes, then adds short rhetorical notes on why the piece fits.", "Claude menulis, lalu menambahkan catatan retoris singkat tentang kenapa tulisannya cocok.")}</li>
          <li>{t("If you agree, it saves the piece and its brief here.", "Kalau kamu setuju, tulisan dan brief-nya disimpan di sini.")}</li>
        </ol>
      </div>
      {(["agents", "conditions", "craft"] as const).map((g) => (
        <section key={g} style={{ marginBottom: 18 }}>
          <h3>{GROUPS[g][L]}</h3>
          <div className="grid2">
            {BRIEF.filter((q) => q.group === g).map((q, i) => (
              <div key={q.key} className="box brief-q">
                <div className="split" style={{ alignItems: "flex-start" }}>
                  <h4 style={{ margin: 0 }}>{BRIEF.indexOf(q) + 1}. {q.q[L]}</h4>
                  <span className={`badge${q.core ? " acc" : ""}`}>{q.core ? t("Core", "Inti") : t("Optional", "Opsional")}</span>
                </div>
                <p className="small">{q.why[L]}</p>
                <p className="small"><b>{t("How to answer:", "Cara menjawab:")}</b> {q.how[L]}</p>
                <div className="ex-row">{q.examples[L].map((e) => <span key={e} className="chip">{e}</span>)}</div>
                <p className="muted small" style={{ margin: "8px 0 0" }}>{t("If you say “you choose”:", "Kalau kamu bilang “terserah kamu”:")} {q.fallback[L]} · <span title={t("Where this point comes from", "Asal poin ini")}>{FROM[q.from][L]}</span></p>
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="box">
        <h3 style={{ marginTop: 0 }}>{t("Writing techniques", "Teknik menulis")}</h3>
        <p className="muted small">{t("Claude picks one that fits your genre and purpose, or you can name one when it asks question 10.", "Claude memilih yang cocok dengan genre dan tujuanmu, atau kamu bisa menyebutnya saat ditanya pertanyaan nomor 10.")}</p>
        <div className="tablewrap">
          <table className="t">
            <thead><tr><th>{t("Technique", "Teknik")}</th><th>{t("What it does", "Fungsinya")}</th><th>{t("Structure", "Struktur")}</th><th>{t("Best for", "Cocok untuk")}</th></tr></thead>
            <tbody>{(Object.keys(KINDS) as (keyof typeof KINDS)[]).map((k) => [
              <tr key={`group-${k}`} className="tbl-group"><td colSpan={4}>{KINDS[k][L]}</td></tr>,
              ...TECHNIQUES.filter((x) => x.kind === k).map((x) => <tr key={`tech-${x.key}`}><td><b style={{ fontWeight: 500 }}>{x.name[L]}</b></td><td>{x.what[L]}</td><td className="small">{x.steps[L]}</td><td className="small muted">{x.best[L]}</td></tr>),
            ])}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/** The fields of the blog's admin form, each with a copy button, in the order the form asks for them. */
function BlogPanel({ w }: { w: Writing }) {
  const { t, toast, graph } = useGraph();
  const p = w.post!, blog = graph?.blog;
  const copy = async (v: string, what: string) => { try { await navigator.clipboard.writeText(v); toast(t(`${what} copied`, `${what} disalin`)); } catch { toast(t("Couldn’t copy", "Tidak bisa menyalin")); } };
  const rows: { k: string; label: string; v: string; max?: number; mono?: boolean }[] = [
    { k: "title", label: t("Title (Judul)", "Judul"), v: w.title, max: 140 },
    { k: "slug", label: "Slug", v: p.slug, max: 80, mono: true },
    { k: "excerpt", label: t("Summary (Ringkasan)", "Ringkasan"), v: p.excerpt, max: 300 },
    { k: "body", label: t("Body (Isi), Markdown", "Isi (Markdown)"), v: w.body, max: 100000 },
    { k: "tags", label: t("Tags (Tag)", "Tag"), v: p.tags, max: 200 },
    { k: "cover", label: t("Cover image (Gambar sampul)", "Gambar sampul"), v: p.coverUrl, max: 500, mono: true },
  ];
  const admin = blog?.url ? `${blog.url}${blog.adminPath}` : null;
  return (
    <div className="blog-panel">
      <div className="split" style={{ marginBottom: 6 }}>
        <h4 style={{ margin: 0 }}>{t("Blog post", "Tulisan blog")}<Hint>{t("Open your blog admin (New post), then copy each field into the box with the same name. Keep the status as Draft, preview it, then publish.", "Buka admin blogmu (Tulisan baru), lalu salin tiap kolom ke kotak dengan nama yang sama. Biarkan status Draf, cek pratinjau, lalu terbitkan.")}</Hint></h4>
        {admin ? <a className="btn small" href={admin} target="_blank" rel="noreferrer">{t("Open blog admin", "Buka admin blog")}</a>
          : <span className="muted small">{t("Admin page:", "Halaman admin:")} <span className="mono">{blog?.adminPath}</span> <Link className="link" href="/settings">{t("add your site address", "isi alamat situsmu")}</Link></span>}
      </div>
      <table className="t post-fields"><tbody>{rows.map((r) => {
        const over = r.max != null && r.v.length > r.max;
        return (
          <tr key={r.k}>
            <th>{r.label}</th>
            <td className={r.mono ? "mono" : undefined}>{r.k === "body" ? <span className="muted">{t(`${r.v.split(/\s+/).filter(Boolean).length} words`, `${r.v.split(/\s+/).filter(Boolean).length} kata`)}</span> : r.v || <span className="muted">–</span>}
              {r.max && r.k !== "body" && r.v && <span className={`small ${over ? "err-text" : "muted"}`}> · {r.v.length}/{r.max}</span>}</td>
            <td style={{ width: 1 }}>{r.v && <button className="btn small" onClick={() => copy(r.v, r.label)}>{t("Copy", "Salin")}</button>}</td>
          </tr>
        );
      })}</tbody></table>
      {p.sources.length > 0 && <div className="small" style={{ marginTop: 8 }}><b style={{ fontWeight: 500 }}>{t("Sources", "Sumber")}:</b> {p.sources.map((x, i) => <span key={i}>{i > 0 && " · "}{x.url ? <a className="link" href={x.url} target="_blank" rel="noreferrer">{x.title}</a> : x.title}</span>)}</div>}
    </div>
  );
}

function PostEditor({ p, set }: { p: PostFields; set: (p: PostFields) => void }) {
  const { t } = useGraph();
  const on = (k: keyof PostFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set({ ...p, [k]: e.target.value });
  return (
    <div className="blog-panel">
      <h4 style={{ margin: "0 0 6px" }}>{t("Blog post fields", "Kolom tulisan blog")}</h4>
      <div className="grid2" style={{ gap: "0 16px" }}>
        <label className="field-group" style={{ display: "block" }}><span className="lab">Slug</span><input className="field mono" value={p.slug} maxLength={80} onChange={(e) => set({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} /></label>
        <label className="field-group" style={{ display: "block" }}><span className="lab">{t("Tags", "Tag")}</span><input className="field" value={p.tags} maxLength={200} onChange={on("tags")} /></label>
      </div>
      <label className="field-group" style={{ display: "block" }}><span className="lab">{t("Summary", "Ringkasan")} <span className="muted small">{p.excerpt.length}/300</span></span><textarea className="field" rows={2} maxLength={300} value={p.excerpt} onChange={on("excerpt")} /></label>
      <label className="field-group" style={{ display: "block" }}><span className="lab">{t("Cover image URL", "URL gambar sampul")}</span><input className="field mono" value={p.coverUrl} maxLength={500} onChange={on("coverUrl")} /></label>
    </div>
  );
}
