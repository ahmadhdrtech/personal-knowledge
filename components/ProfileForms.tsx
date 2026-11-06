"use client";
import { useEffect, useState } from "react";
import { useGraph } from "./store";
import Hint from "./Hint";
import type { BlogSettings, Profile } from "@/lib/types";
import { PLATFORMS, withPlatform, type BlogPlatform } from "@/lib/blog";

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
      <Field label={t("Name", "Nama")} hint={t("How the AI and Claude refer to you.", "Cara AI dan Claude menyebutmu.")}><input className="field" placeholder={t("Your name", "Namamu")} value={f.name} onChange={on("name")} /></Field>
      <Field label={t("Background", "Latar belakang")} hint={t("One or two sentences: what you study or do. It sets how technical explanations can be.", "Satu atau dua kalimat: apa yang kamu pelajari atau kerjakan. Ini menentukan seberapa teknis penjelasannya.")}><textarea className="field" rows={2} placeholder={t("e.g. Second-year biology student; I work part-time in a café", "mis. Mahasiswa biologi tahun kedua; kerja paruh waktu di kafe")} value={f.about} onChange={on("about")} /></Field>
      <Field label={t("Topics you like", "Topik yang kamu suka")} hint={t("Separate with semicolons. Used to suggest links between your topics.", "Pisahkan dengan titik koma. Dipakai untuk menyarankan hubungan antartopikmu.")}><textarea className="field" rows={2} placeholder={t("e.g. space; personal finance; history of science", "mis. luar angkasa; keuangan pribadi; sejarah sains")} value={f.interests} onChange={on("interests")} /></Field>
      <Field label={t("Examples to use", "Contoh yang dipakai")} hint={t("Where the AI should take its examples from, e.g. “software and AI, physics, personal finance”.", "Dari mana AI mengambil contoh, mis. “software dan AI, fisika, keuangan pribadi”.")}><input className="field" placeholder={t("e.g. cooking, football, everyday money", "mis. memasak, sepak bola, uang sehari-hari")} value={f.examples} onChange={on("examples")} /></Field>
      <div className="btnrow"><button className="btn primary small" disabled={!dirty} onClick={async () => { await act("profile", { profile: f }); toast(t("Saved", "Disimpan")); }}>{t("Save", "Simpan")}</button></div>
    </div>
  );
}

/** Settings: the blog that research turns into posts for. */
export function BlogBox() {
  const { graph, act, toast, t, lang } = useGraph();
  const [f, setF] = useState<BlogSettings | null>(null);
  useEffect(() => { if (graph && !f) setF(graph.blog); }, [graph, f]);
  if (!f) return null;
  const L = lang === "id" ? "id" : "en";
  const P = PLATFORMS[f.platform];
  const on = (k: keyof BlogSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value } as BlogSettings);
  const num = (k: "titleMax" | "slugMax" | "excerptMax" | "tagsMax") => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Math.max(0, Number(e.target.value) || 0) });
  const dirty = JSON.stringify(f) !== JSON.stringify(graph?.blog);
  return (
    <div className="box">
      <h3 style={{ marginTop: 0 }}>{t("Your blog", "Blogmu")}</h3>
      <p className="muted small" style={{ marginTop: 0 }}>{t("Claude Desktop uses this when it turns your research into a post (the “Blog post from my research” prompt). It becomes the starting brief, which you confirm. Optional: skip it if you don’t blog.", "Claude Desktop memakai ini saat mengubah risetmu menjadi tulisan (prompt “Blog post from my research”). Isinya menjadi brief awal yang tinggal kamu konfirmasi. Opsional: lewati kalau kamu tidak ngeblog.")}</p>
      <Field label={t("Platform", "Platform")} hint={t("Where you publish. It sets the field limits and format rules; you can still change them below.", "Tempat kamu menerbitkan. Ini mengatur batas kolom dan aturan format; tetap bisa kamu ubah di bawah.")}>
        <select className="field" value={f.platform} onChange={(e) => setF(withPlatform(f, e.target.value as BlogPlatform))}>
          {(Object.keys(PLATFORMS) as BlogPlatform[]).map((k) => <option key={k} value={k}>{PLATFORMS[k].name[L]}</option>)}
        </select>
      </Field>
      <p className="muted small" style={{ margin: "4px 0 0" }}>{P.about[L]}</p>
      <div className="grid2" style={{ gap: "0 16px" }}>
        <Field label={t("Blog name", "Nama blog")} hint={t("Optional. Shown in the brief as where the post appears.", "Opsional. Tampil di brief sebagai tempat tulisan terbit.")}><input className="field" value={f.name} onChange={on("name")} /></Field>
        <Field label={t("Site address", "Alamat situs")} hint={t("Optional, e.g. https://yourname.dev. With it, the Writing menu can link to your editor.", "Opsional, mis. https://namamu.dev. Kalau diisi, menu Tulisan bisa menautkan ke editormu.")}><input className="field mono" placeholder="https://…" value={f.url} onChange={on("url")} /></Field>
        <Field label={t("Editor page for a new post", "Halaman editor untuk tulisan baru")} hint={t("Path on your site where you write a new post. Filled in for known platforms.", "Path di situsmu untuk menulis tulisan baru. Sudah terisi untuk platform yang dikenal.")}><input className="field mono" placeholder="/admin/new" value={f.adminPath} onChange={on("adminPath")} /></Field>
        <Field label={t("Post language", "Bahasa tulisan")} hint={t("Default language of posts. You can still change it per post.", "Bahasa bawaan tulisan. Tetap bisa diganti per tulisan.")}>
          <select className="field" value={f.lang} onChange={on("lang")}><option value="en">English</option><option value="id">Bahasa Indonesia</option></select></Field>
      </div>
      <Field label={t("Readers", "Pembaca")} hint={t("Your anticipated audience: who finds the blog and what they want from it.", "Audiens yang kamu antisipasi: siapa yang menemukan blog ini dan apa yang mereka cari.")}><textarea className="field" rows={2} placeholder={t("e.g. students and developers curious about how things work", "mis. mahasiswa dan developer yang penasaran cara kerja sesuatu")} value={f.audience} onChange={on("audience")} /></Field>
      <Field label={t("Voice", "Gaya suara")} hint={t("2–3 words or a sentence on how your posts should sound.", "2–3 kata atau satu kalimat tentang bagaimana tulisanmu terdengar.")}><input className="field" value={f.voice} onChange={on("voice")} /></Field>
      <div className="limits">
        <Field label={t("Title max", "Judul maks.")} hint={t("Characters.", "Karakter.")}><input className="field" type="number" min={10} value={f.titleMax} onChange={num("titleMax")} /></Field>
        {P.hasSlug && <Field label={t("Slug max", "Slug maks.")} hint={t("Characters in the URL part of the post.", "Karakter di bagian URL tulisan.")}><input className="field" type="number" min={10} value={f.slugMax} onChange={num("slugMax")} /></Field>}
        <Field label={`${P.excerpt[L]} ${t("max", "maks.")}`} hint={t("Characters. Search results show about 155.", "Karakter. Hasil pencarian menampilkan sekitar 155.")}><input className="field" type="number" min={0} value={f.excerptMax} onChange={num("excerptMax")} /></Field>
        {P.hasTags && <Field label={t("Tags max", "Tag maks.")} hint={t("How many tags.", "Berapa banyak tag.")}><input className="field" type="number" min={0} value={f.tagsMax} onChange={num("tagsMax")} /></Field>}
      </div>
      <label className="inline small" style={{ marginTop: 8 }}><input type="checkbox" checked={f.allowHtml} onChange={(e) => setF({ ...f, allowHtml: e.target.checked })} /> {t("My blog accepts HTML", "Blogku menerima HTML")}</label>
      <Field label={t("Extra rules (optional)", "Aturan tambahan (opsional)")} hint={t("Anything else your blog needs, e.g. “start with a one-line summary”, “images go in /images/posts/”.", "Apa saja yang dibutuhkan blogmu, mis. “mulai dengan ringkasan satu baris”, “gambar disimpan di /images/posts/”.")}><textarea className="field" rows={3} value={f.notes} onChange={on("notes")} /></Field>
      <div className="btnrow"><button className="btn primary small" disabled={!dirty} onClick={async () => { await act("blog", { blog: f }); toast(t("Saved", "Disimpan")); }}>{t("Save", "Simpan")}</button></div>
    </div>
  );
}
