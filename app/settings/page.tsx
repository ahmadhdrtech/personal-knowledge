"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Page from "@/components/Page";
import { api, errText, useGraph } from "@/components/store";
import { fmtDate } from "@/components/ui";
import { AboutYou, BlogBox } from "@/components/ProfileForms";
import type { Depth, Lang, Theme, View } from "@/lib/types";

type Backups = { dir: string; backups: { name: string; size: number; at: number }[] };

export default function SettingsPage() {
  const { graph, act, toast, t, lang } = useGraph();
  const [armed, setArmed] = useState(false);
  const [armedClear, setArmedClear] = useState(false);
  const [bk, setBk] = useState<Backups | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<Backups>("/api/backup").then(setBk).catch(() => {}); }, []);
  const p = graph?.prefs;
  const seg = <T extends string>(label: string, val: T | undefined, opts: [T, string][], key: string, hint?: string) => (
    <div className="row-item">
      <div className="split"><div><b style={{ fontWeight: 500 }}>{label}</b>{hint && <div className="muted small">{hint}</div>}</div>
        <div className="seg" role="group" aria-label={label}>{opts.map(([v, l]) => <button key={v} aria-pressed={val === v} onClick={() => act("prefs", { prefs: { [key]: v } })}>{l}</button>)}</div></div>
    </div>
  );
  const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;
  return (
    <Page title={t("Settings", "Pengaturan")} lede={t("Language, look and your data. AI models and keys are under Models; costs are under Usage.", "Bahasa, tampilan, dan datamu. Model AI dan kunci ada di menu Model; biaya ada di Pemakaian.")}>
      {p && <div className="grid2" style={{ marginBottom: 16 }}><AboutYou /><BlogBox /></div>}
      {p && <div className="grid2">
        <div className="box">
          <h3>{t("Learning", "Belajar")}</h3>
          <ul className="plain">
            {seg<Lang>(t("Language", "Bahasa"), p.lang, [["en", "English"], ["id", "Indonesia"]], "lang", t("The whole app, plus summaries, questions and feedback", "Seluruh aplikasi, juga ringkasan, soal, dan umpan balik"))}
            {seg<View>(t("Map view", "Tampilan peta"), p.view, [["network", t("Network", "Jaringan")], ["domains", t("Domains", "Domain")]], "view", t("Typed links, or outlines around each domain", "Tautan berjenis, atau batas di sekitar tiap domain"))}
            {seg<Depth>(t("AI depth", "Tingkat AI"), p.depth, [["quick", t("Quick", "Cepat")], ["balanced", t("Balanced", "Seimbang")], ["deep", t("Deep", "Mendalam")]], "depth", t("Which model tier AI features use", "Tingkat model yang dipakai fitur AI"))}
            {seg<Theme>(t("Theme", "Tema"), p.theme, [["system", t("System", "Sistem")], ["light", t("Light", "Terang")], ["dark", t("Dark", "Gelap")]], "theme")}
          </ul>
          <p className="small"><Link className="link" href="/models">{t("Choose the model for each depth", "Pilih model untuk tiap tingkat")}</Link> · <Link className="link" href="/guide">{t("Open the guide", "Buka panduan")}</Link></p>
        </div>
        <div className="box">
          <h3>{t("Backups", "Cadangan")}</h3>
          <p className="muted small">{t("Everything lives in data/neuron.db inside the project folder. A backup is a full copy of that file, saved in data/backups.", "Semua data ada di data/neuron.db di folder proyek. Cadangan adalah salinan lengkap file itu, disimpan di data/backups.")}</p>
          <div className="btnrow">
            <button className="btn primary" disabled={busy} onClick={async () => { setBusy(true); try { setBk(await api<Backups>("/api/backup", { method: "POST" })); toast(t("Backup saved", "Cadangan disimpan")); } catch (e) { toast(errText(e)); } setBusy(false); }}>{busy ? t("Saving…", "Menyimpan…") : t("Back up now", "Cadangkan sekarang")}</button>
            <a className="btn" href="/api/export" download>{t("Export as JSON", "Ekspor sebagai JSON")}</a>
            <a className="btn" href={`/api/export/markdown?lang=${lang}`} download title={t("A zip of linked Markdown notes: one per concept, topic, source, lesson and piece of writing. Open the folder in Obsidian, or any Markdown editor.", "Zip berisi catatan Markdown yang saling tertaut: satu per konsep, topik, sumber, pelajaran, dan tulisan. Buka foldernya di Obsidian, atau editor Markdown apa pun.")}>{t("Export as Markdown notes", "Ekspor sebagai catatan Markdown")}</a>
          </div>
          {bk && bk.backups.length > 0 && <ul className="plain" style={{ marginTop: 10 }}>{bk.backups.slice(0, 6).map((b) => <li key={b.name} className="row-item split"><span className="mono">{b.name}</span><span className="muted small">{fmtDate(b.at, lang)} · {mb(b.size)}</span></li>)}</ul>}
          <p className="muted small">{t("To restore: close the app, copy a backup over data/neuron.db, then start it again. The JSON export is for reading or moving data; it leaves out API keys.", "Cara memulihkan: tutup aplikasi, salin file cadangan menimpa data/neuron.db, lalu jalankan lagi. Ekspor JSON untuk dibaca atau dipindahkan; API key tidak ikut.")}</p>
          <h3>{t("Start over", "Mulai dari awal")}</h3>
          <p className="muted small">{t("Empty map: deletes all concepts, domains, sources, links, scores, review schedule, chats and glossary so you can add your own topics from Sources. Reset to demo: replaces them with the 15-concept demo map. Both keep your models, keys and usage history. Back up first if you might want your map back.", "Peta kosong: menghapus semua konsep, domain, sumber, tautan, nilai, jadwal ulasan, obrolan, dan glosarium supaya kamu bisa menambahkan topikmu sendiri dari Sumber. Kembalikan ke demo: menggantinya dengan peta demo 15 konsep. Keduanya tetap menyimpan model, kunci, dan riwayat pemakaian. Cadangkan dulu kalau mungkin ingin petamu kembali.")}</p>
          <div className="btnrow">
          <button className="btn danger" onClick={async () => { if (!armedClear) { setArmedClear(true); setArmed(false); return; } await act("clearMap"); setArmedClear(false); toast(t("Map emptied. Add your first source in Sources.", "Peta dikosongkan. Tambahkan sumber pertamamu di Sumber.")); }} onBlur={() => setArmedClear(false)}>
            {armedClear ? t("Click again to delete everything on your map", "Klik lagi untuk menghapus semua isi petamu") : t("Start with an empty map", "Mulai dengan peta kosong")}
          </button>
          <button className="btn" onClick={async () => { if (!armed) { setArmed(true); return; } await act("resetDemo"); setArmed(false); toast(t("Demo map restored", "Peta demo dipulihkan")); }}>
            {armed ? t("Click again to replace your map with the demo", "Klik lagi untuk mengganti petamu dengan demo") : t("Reset to the demo map", "Kembalikan ke peta demo")}
          </button>
          </div>
        </div>
      </div>}
    </Page>
  );
}
