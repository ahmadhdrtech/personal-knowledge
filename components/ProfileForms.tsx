"use client";
import { useEffect, useState } from "react";
import { useGraph } from "./store";
import Hint from "./Hint";
import type { BlogSettings, Profile } from "@/lib/types";

function Field({ label, hint, children }: { label: string; hint: React.ReactNode; children: React.ReactNode }) {
  return <label className="field-group" style={{ display: "block" }}><span className="lab">{label}<Hint>{hint}</Hint></span>{children}</label>;
}

/** Settings: who you are (used in every AI prompt and by Claude Desktop). */
export function AboutYou() {
  const { graph, act, toast, t } = useGraph();
  const [f, setF] = useState<Profile | null>(null);
  useEffect(() => { if (graph && !f) setF(graph.profile); }, [graph, f]);
  if (!f) return null;
  const on = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const dirty = JSON.stringify(f) !== JSON.stringify(graph?.profile);
  return (
    <div className="box">
      <h3 style={{ marginTop: 0 }}>{t("About you", "Tentang kamu")}</h3>
      <p className="muted small" style={{ marginTop: 0 }}>{t("The AI and Claude Desktop read this, so explanations, examples and quiz scenarios fit you.", "AI dan Claude Desktop membaca ini, supaya penjelasan, contoh, dan skenario kuis cocok untukmu.")}</p>
      <Field label={t("Name", "Nama")} hint={t("How the AI and Claude refer to you.", "Cara AI dan Claude menyebutmu.")}><input className="field" value={f.name} onChange={on("name")} /></Field>
      <Field label={t("Background", "Latar belakang")} hint={t("One or two sentences: what you study or do. It sets how technical explanations can be.", "Satu atau dua kalimat: apa yang kamu pelajari atau kerjakan. Ini menentukan seberapa teknis penjelasannya.")}><textarea className="field" rows={2} value={f.about} onChange={on("about")} /></Field>
      <Field label={t("Topics you like", "Topik yang kamu suka")} hint={t("Separate with semicolons. Used to suggest links between your topics.", "Pisahkan dengan titik koma. Dipakai untuk menyarankan hubungan antartopikmu.")}><textarea className="field" rows={2} value={f.interests} onChange={on("interests")} /></Field>
      <Field label={t("Examples to use", "Contoh yang dipakai")} hint={t("Where the AI should take its examples from, e.g. “software and AI, physics, personal finance”.", "Dari mana AI mengambil contoh, mis. “software dan AI, fisika, keuangan pribadi”.")}><input className="field" value={f.examples} onChange={on("examples")} /></Field>
      <div className="btnrow"><button className="btn primary small" disabled={!dirty} onClick={async () => { await act("profile", { profile: f }); toast(t("Saved", "Disimpan")); }}>{t("Save", "Simpan")}</button></div>
    </div>
  );
}

/** Settings: the blog that research turns into posts for. */
export function BlogBox() {
  const { graph, act, toast, t } = useGraph();
  const [f, setF] = useState<BlogSettings | null>(null);
  useEffect(() => { if (graph && !f) setF(graph.blog); }, [graph, f]);
  if (!f) return null;
  const on = (k: keyof BlogSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value } as BlogSettings);
  const dirty = JSON.stringify(f) !== JSON.stringify(graph?.blog);
  return (
    <div className="box">
      <h3 style={{ marginTop: 0 }}>{t("Your blog", "Blogmu")}</h3>
      <p className="muted small" style={{ marginTop: 0 }}>{t("Claude Desktop uses this when it turns your research into a post (the “Blog post from my research” prompt). Its answers become the starting brief, which you confirm.", "Claude Desktop memakai ini saat mengubah risetmu menjadi tulisan (prompt “Blog post from my research”). Isinya menjadi brief awal yang tinggal kamu konfirmasi.")}</p>
      <div className="grid2" style={{ gap: "0 16px" }}>
        <Field label={t("Blog name", "Nama blog")} hint={t("Shown in the brief as the genre and place.", "Tampil di brief sebagai genre dan tempatnya.")}><input className="field" value={f.name} onChange={on("name")} /></Field>
        <Field label={t("Site address", "Alamat situs")} hint={t("Optional, e.g. https://yourname.dev. With it, the Writing menu links straight to your admin page.", "Opsional, mis. https://namamu.dev. Kalau diisi, menu Tulisan langsung menautkan ke halaman admin.")}><input className="field mono" placeholder="https://…" value={f.url} onChange={on("url")} /></Field>
        <Field label={t("Admin page for a new post", "Halaman admin untuk tulisan baru")} hint={t("Path on your site where you paste a new post.", "Path di situsmu tempat menempel tulisan baru.")}><input className="field mono" value={f.adminPath} onChange={on("adminPath")} /></Field>
        <Field label={t("Post language", "Bahasa tulisan")} hint={t("Default language of posts. You can still change it per post.", "Bahasa bawaan tulisan. Tetap bisa diganti per tulisan.")}>
          <select className="field" value={f.lang} onChange={on("lang")}><option value="id">Bahasa Indonesia</option><option value="en">English</option></select></Field>
      </div>
      <Field label={t("Readers", "Pembaca")} hint={t("Your anticipated audience: who finds the blog and what they want from it.", "Audiens yang kamu antisipasi: siapa yang menemukan blog ini dan apa yang mereka cari.")}><textarea className="field" rows={2} value={f.audience} onChange={on("audience")} /></Field>
      <Field label={t("Voice", "Gaya suara")} hint={t("2–3 words or a sentence on how your posts should sound.", "2–3 kata atau satu kalimat tentang bagaimana tulisanmu terdengar.")}><input className="field" value={f.voice} onChange={on("voice")} /></Field>
      <Field label={t("Format rules", "Aturan format")} hint={t("What your blog accepts. Prefilled from your portfolio’s admin form: Markdown, no HTML, field limits.", "Apa yang diterima blogmu. Sudah diisi dari form admin portofoliomu: Markdown, tanpa HTML, batas tiap kolom.")}><textarea className="field" rows={4} value={f.format} onChange={on("format")} /></Field>
      <div className="btnrow"><button className="btn primary small" disabled={!dirty} onClick={async () => { await act("blog", { blog: f }); toast(t("Saved", "Disimpan")); }}>{t("Save", "Simpan")}</button></div>
    </div>
  );
}
