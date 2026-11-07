"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Page from "@/components/Page";
import { api, errText, useGraph } from "@/components/store";

type Info = { built: boolean; file: string; node: string; config: string; configPath: string | null; platform: string };

export default function ConnectPage() {
  const { t, toast } = useGraph();
  const [info, setInfo] = useState<Info | null>(null);
  const [test, setTest] = useState<{ busy?: boolean; ok?: string; err?: string }>({});
  useEffect(() => { api<Info>("/api/mcp").then(setInfo).catch(() => {}); }, []);
  const c = (s: string) => <span className="code">{s}</span>;
  const copy = async (s: string) => { try { await navigator.clipboard.writeText(s); toast(t("Copied", "Disalin")); } catch { toast(t("Couldn't copy", "Gagal menyalin")); } };

  const tools: [string, string, string][] = [
    ["neuron_overview", "Domains, mastery, what’s due, misconceptions", "Domain, penguasaan, yang perlu direview, miskonsepsi"],
    ["neuron_list_concepts / neuron_read_concept", "Find and read any concept, with your definition, sources, quotes and questions", "Cari dan baca konsep apa pun, lengkap dengan definisimu, sumber, kutipan, dan soal"],
    ["neuron_search", "Search concepts and source passages (by meaning if you set a search model)", "Cari konsep dan bagian sumber (berdasarkan makna kalau model pencarian sudah diatur)"],
    ["neuron_record_result", "Save the result when Claude quizzes you; updates mastery and the review schedule", "Simpan hasil saat Claude menguji kamu; memperbarui penguasaan dan jadwal review"],
    ["neuron_add_source", "Claude reads an article or file you give it and adds the concepts it finds", "Claude membaca artikel atau file yang kamu berikan lalu menambahkan konsep yang ditemukannya"],
    ["neuron_suggest_link / neuron_add_question", "Suggest links (you approve them in the app) and store practice questions", "Menyarankan tautan (kamu setujui di aplikasi) dan menyimpan soal latihan"],
    ["neuron_set_definition / neuron_add_glossary", "Save definitions you agree on", "Menyimpan definisi yang kamu setujui"],
    ["neuron_lesson_start / _plan / _step / _finish / _get", "“Teach me” lessons: Claude checks what you know, plans steps to your goal, teaches each with flowcharts, equations and figures, checks you, and saves it all to Lessons", "Pelajaran “Ajari aku”: Claude mengecek yang kamu tahu, menyusun langkah ke tujuanmu, mengajarkan tiap langkah dengan diagram alur, persamaan, dan gambar, mengecekmu, lalu menyimpan semuanya ke Pelajaran"],
    ["neuron_study_get / neuron_study_save", "Prepares a source for the Study reader: a question after each passage, plus simpler, interest-based or deeper versions", "Menyiapkan sumber untuk pembaca Belajar: satu pertanyaan setelah tiap bagian, plus versi lebih sederhana, berbasis minat, atau lebih dalam"],
    ["neuron_claims_get / _save / _check", "Finds the key claims in a concept’s sources, with reasons and quotes, and fact-checks them against the source, your definitions and the wider evidence", "Mencari klaim utama di sumber sebuah konsep, lengkap dengan alasan dan kutipan, lalu mengecek faktanya terhadap sumber, definisimu, dan bukti yang lebih luas"],
    ["neuron_research_pack", "Gathers what your map has on a topic (concepts, your definitions, sources, quotes, notes) so Claude writes from your research", "Mengumpulkan isi petamu tentang satu topik (konsep, definisimu, sumber, kutipan, catatan) supaya Claude menulis dari risetmu"],
    ["neuron_writing_guide", "Before writing anything, Claude asks you the rhetorical brief (speaker, audience, genre, purpose, stance, context, culture and optional craft questions) with guidance and examples", "Sebelum menulis apa pun, Claude menanyakan brief retoris (pembicara, audiens, genre, tujuan, sikap, konteks, budaya, dan pertanyaan teknik opsional) dengan petunjuk dan contoh"],
    ["neuron_save_writing / neuron_save_discussion", "Save a finished piece with its brief, or a note on what you discussed, to the Writing menu", "Menyimpan tulisan jadi beserta brief-nya, atau catatan hasil diskusi, ke menu Tulisan"],
    ["neuron_list_writing / neuron_read_writing", "Find earlier pieces and notes so Claude can revise or continue them", "Mencari tulisan dan catatan sebelumnya supaya Claude bisa merevisi atau melanjutkannya"],
  ];
  const tries = [
    [t("What should I review today? Quiz me on the first one.", "Apa yang perlu kureview hari ini? Kuis aku tentang yang pertama.")],
    [t("Here’s an article I read: [paste]. Add it to Neuron.", "Ini artikel yang kubaca: [tempel]. Tambahkan ke Neuron.")],
    [t("How does Overfitting connect to Survivorship bias on my map?", "Apa hubungan Overfitting dengan Bias penyintas di petaku?")],
    [t("Find everything I have about exponential growth and explain it with a money example.", "Cari semua yang kupunya tentang pertumbuhan eksponensial lalu jelaskan dengan contoh keuangan.")],
    [t("Teach me why compound interest grows so fast.", "Ajari aku kenapa bunga majemuk tumbuh begitu cepat.")],
    [t("Turn my research on compound interest into a blog post.", "Ubah risetku tentang bunga majemuk menjadi tulisan blog.")],
    [t("Write a LinkedIn post from what we just discussed.", "Tulis postingan LinkedIn dari yang barusan kita diskusikan.")],
    [t("Save the result of this discussion to Neuron.", "Simpan hasil diskusi ini ke Neuron.")],
  ];

  return (
    <Page title={t("Claude Desktop", "Claude Desktop")} lede={t("Connect Neuron to the Claude desktop app. Claude can then read your map, quiz you, explain concepts with your own notes, and add what you read, using your Claude subscription instead of API credit.", "Hubungkan Neuron ke aplikasi Claude desktop. Claude lalu bisa membaca petamu, menguji kamu, menjelaskan konsep dengan catatanmu sendiri, dan menambahkan yang kamu baca, memakai langganan Claude-mu, bukan saldo API.")}>
      <div className="grid2">
        <div className="box">
          <h3 style={{ marginTop: 0 }}>{t("Set it up (about 2 minutes)", "Cara memasang (sekitar 2 menit)")}</h3>
          <ol className="steps-plain">
            <li>{t("Press Test the connection below. It should list 26 tools.", "Tekan Tes koneksi di bawah. Harus muncul 26 alat.")}</li>
            <li>{t("Open Claude Desktop → Settings → Developer → Edit Config. This opens", "Buka Claude Desktop → Settings → Developer → Edit Config. Ini membuka")} {c("claude_desktop_config.json")}{info?.configPath ? <> ({c(info.configPath)})</> : null}.</li>
            <li>{t("Copy the config below and paste it into that file. If the file already has an “mcpServers” section, add only the “neuron” part inside it.", "Salin konfigurasi di bawah lalu tempel ke file itu. Kalau file sudah punya bagian “mcpServers”, tambahkan bagian “neuron” saja di dalamnya.")}</li>
            <li>{t("Save, then quit Claude Desktop completely (also from the tray icon) and open it again.", "Simpan, lalu tutup Claude Desktop sepenuhnya (termasuk dari ikon tray) dan buka lagi.")}</li>
            <li>{t("In a new chat, click the tools (sliders) icon: “neuron” should be listed. Claude asks your permission the first time it uses a tool.", "Di obrolan baru, klik ikon alat (slider): “neuron” harus ada. Claude meminta izinmu saat pertama kali memakai alat.")}</li>
          </ol>
          <div className="btnrow">
            <button className="btn primary" disabled={test.busy} onClick={async () => {
              setTest({ busy: true });
              try { const r = await api<{ tools: string[]; ms: number }>("/api/mcp", { method: "POST" }); setTest({ ok: t(`Works: ${r.tools.length} tools, started in ${(r.ms / 1000).toFixed(1)}s.`, `Berhasil: ${r.tools.length} alat, mulai dalam ${(r.ms / 1000).toFixed(1)} dtk.`) }); }
              catch (e) { setTest({ err: errText(e) }); }
            }}>{test.busy ? t("Testing…", "Menguji…") : t("Test the connection", "Tes koneksi")}</button>
          </div>
          {test.ok && <p className="small" style={{ color: "var(--solid)" }}>{test.ok}</p>}
          {test.err && <p className="err">{test.err}</p>}
          {info && !info.built && <p className="err">{t("The server file isn’t built yet. Run", "File server belum dibuat. Jalankan")} {c("bun run mcp:build")} {t("in PowerShell in the project folder.", "di PowerShell di folder proyek.")}</p>}
        </div>
        <div className="box">
          <div className="split"><h3 style={{ marginTop: 0 }}>{t("Config to paste", "Konfigurasi untuk ditempel")}</h3>{info && <button className="btn small" onClick={() => copy(info.config)}>{t("Copy", "Salin")}</button>}</div>
          <pre className="codeblock">{info ? info.config : "…"}</pre>
          <p className="muted small">{t("The paths are filled in for this PC. If you move the project folder, copy the config again. The app doesn’t need to be running for Claude to use Neuron; both use the same data/neuron.db.", "Path-nya sudah diisi untuk PC ini. Kalau folder proyek dipindah, salin konfigurasinya lagi. Aplikasi tidak perlu berjalan agar Claude bisa memakai Neuron; keduanya memakai data/neuron.db yang sama.")}</p>
        </div>
      </div>

      <h3>{t("Try asking Claude", "Coba tanyakan ke Claude")}</h3>
      <div className="starter-row">{tries.map(([s]) => <button key={s} className="chip" onClick={() => copy(s)} title={t("Copy", "Salin")}>{s}</button>)}</div>

      <h3>{t("Ready-made prompts", "Prompt siap pakai")}</h3>
      <p className="small">{t("In Claude Desktop, click + in the message box, then neuron, to pick one:", "Di Claude Desktop, klik + di kotak pesan, lalu neuron, untuk memilih salah satu:")}</p>
      <ul className="small">
        <li><b>Write with Neuron</b>: {t("goes through the brief first, then writes.", "melewati brief dulu, lalu menulis.")} <Link className="link" href="/writing?tab=guide">{t("See the questions", "Lihat pertanyaannya")}</Link></li>
        <li><b>Teach me</b>: {t("a lesson toward a goal. Claude finds what you already understand, plans the steps, then teaches one at a time: you predict, it explains with flowcharts, equations, tables or figures, then checks you.", "pelajaran menuju satu tujuan. Claude mencari tahu apa yang sudah kamu pahami, menyusun langkah, lalu mengajar satu per satu: kamu menebak, Claude menjelaskan dengan diagram alur, persamaan, tabel, atau gambar, lalu mengecekmu.")} <Link className="link" href="/lessons">{t("Open Lessons", "Buka Pelajaran")}</Link></li>
        <li><b>Continue a lesson</b>: {t("picks up where the last lesson stopped.", "melanjutkan dari titik pelajaran terakhir berhenti.")}</li>
        <li><b>Prepare a source for study</b>: {t("writes a question after each passage of a source, and simpler or interest-based versions if you want, for the Study reader.", "menulis pertanyaan setelah tiap bagian sumber, dan versi lebih sederhana atau berbasis minat bila diminta, untuk pembaca Belajar.")} <Link className="link" href="/study">{t("Open Study", "Buka Belajar")}</Link></li>
        <li><b>Fact-check my map</b>: {t("finds the key claims in your sources and checks each one; anything contradicted, unsupported or disputed is flagged in Claims.", "mencari klaim utama di sumbermu dan mengecek masing-masing; yang bertentangan, tidak berdasar, atau diperdebatkan ditandai di Klaim.")} <Link className="link" href="/claims">{t("Open Claims", "Buka Klaim")}</Link></li>
        <li><b>Blog post from my research</b>: {t("collects your research on a topic, shows what’s covered and missing, confirms the brief prefilled from Settings → Your blog, then writes a post with title, slug, summary, tags and sources for your blog.", "mengumpulkan risetmu tentang satu topik, menunjukkan yang sudah ada dan yang kurang, mengonfirmasi brief yang terisi dari Pengaturan → Blogmu, lalu menulis tulisan lengkap dengan judul, slug, ringkasan, tag, dan sumber untuk blogmu.")}</li>
        <li><b>Save this discussion</b>: {t("drafts a note of the chat, shows it to you, and saves it after you approve.", "membuat draf catatan obrolan, menunjukkannya, lalu menyimpan setelah kamu setujui.")}</li>
        <li><b>Read a text critically</b>: {t("analyzes a text’s rhetorical situation, organization and verbal/nonverbal elements, then tests you.", "menganalisis situasi retoris, susunan, dan unsur verbal/nonverbal sebuah teks, lalu mengujimu.")}</li>
      </ul>

      <h3>{t("What Claude can do in Neuron", "Yang bisa dilakukan Claude di Neuron")}</h3>
      <div className="tablewrap"><table className="t">
        <thead><tr><th>{t("Tool", "Alat")}</th><th>{t("What it does", "Fungsinya")}</th></tr></thead>
        <tbody>{tools.map(([n, en, id]) => <tr key={n}><td className="mono">{n}</td><td>{t(en, id)}</td></tr>)}</tbody>
      </table></div>
      <p className="muted small" style={{ marginTop: 10 }}>{t("Claude can’t delete anything, and links it creates are suggestions you approve in the app. Your definitions and glossary stay the source of truth. Results Claude records show up in Dashboard and Review like any other answer.", "Claude tidak bisa menghapus apa pun, dan tautan yang dibuatnya hanya saran yang kamu setujui di aplikasi. Definisi dan glosariummu tetap jadi acuan utama. Hasil yang dicatat Claude muncul di Dasbor dan Review seperti jawaban lain.")}</p>

      <h3>{t("If it doesn’t show up", "Kalau tidak muncul")}</h3>
      <ul className="small">
        <li>{t("Check the JSON is valid (no missing comma or brace) and that you fully restarted Claude Desktop.", "Pastikan JSON-nya valid (tidak ada koma atau kurung yang hilang) dan Claude Desktop sudah benar-benar dimulai ulang.")}</li>
        <li>{t("In Claude Desktop → Settings → Developer, “neuron” shows its status and any error message.", "Di Claude Desktop → Settings → Developer, “neuron” menampilkan status dan pesan errornya.")}</li>
        <li>{t("“Cannot find module better-sqlite3”: run", "“Cannot find module better-sqlite3”: jalankan")} {c("bun install")} {t("in the project folder.", "di folder proyek.")}</li>
        <li>{t("After updating Neuron, run", "Setelah memperbarui Neuron, jalankan")} {c("bun run mcp:build")} {t("and restart Claude Desktop.", "lalu mulai ulang Claude Desktop.")}</li>
      </ul>
    </Page>
  );
}
