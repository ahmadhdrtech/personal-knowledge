"use client";
import { useState } from "react";
import Link from "next/link";
import Page from "@/components/Page";
import { useGraph } from "@/components/store";
import Tour, { type TourStep } from "@/components/Tour";
import { HowItFits } from "@/components/ModelsHelp";

export default function GuidePage() {
  const { t } = useGraph();
  const [tour, setTour] = useState(false);
  const c = (s: string) => <span className="code">{s}</span>;

  const appTour: TourStep[] = [
    { title: t("A quick tour of Neuron", "Tur singkat Neuron"), body: <p>{t("Every part of the app has its own menu on the left. Here’s what each one is for.", "Setiap bagian aplikasi punya menu sendiri di kiri. Ini fungsi masing-masing.")}</p> },
    { target: "nav-map", title: t("Map", "Peta"), body: <p>{t("Your concepts as a graph, with the Assistant column on the right. Ask it anything about the whole map, type @ to bring in a concept, or / for commands. Click a concept to read it, test yourself, discuss it, and see its learning order.", "Konsep-konsepmu sebagai graf, dengan kolom Asisten di kanan. Tanya apa saja tentang seluruh peta, ketik @ untuk memanggil konsep, atau / untuk perintah. Klik satu konsep untuk membaca, menguji diri, berdiskusi, dan melihat urutan belajarnya.")}</p> },
    { target: "nav-views", title: t("Views", "Tampilan"), body: <p>{t("Five other pictures of the same map: what to study first, a step-by-step flow, how domains connect, a sunburst, and one concept’s neighborhood.", "Lima gambaran lain dari peta yang sama: apa yang dipelajari dulu, alur langkah demi langkah, hubungan antardomain, sunburst, dan sekitar satu konsep.")}</p> },
    { target: "nav-dashboard", title: t("Dashboard", "Dasbor"), body: <p>{t("Your progress at a glance: mastery, how often your confidence is right, and recent answers.", "Perkembanganmu sekilas: penguasaan, seberapa sering rasa yakinmu tepat, dan jawaban terakhir.")}</p> },
    { target: "nav-review", title: t("Review", "Review"), body: <p>{t("Spaced review. Each answer schedules when that concept comes back; this page lists what’s due today.", "Review berjarak. Setiap jawaban menjadwalkan kapan konsep itu muncul lagi; halaman ini berisi yang jatuh tempo hari ini.")}</p> },
    { target: "nav-sources", title: t("Sources", "Sumber"), body: <p>{t("Add articles, notes, PDFs, Word files, web pages or transcripts. The AI turns them into concepts and quotes where each came from.", "Tambahkan artikel, catatan, PDF, file Word, halaman web, atau transkrip. AI mengubahnya menjadi konsep dan mengutip asalnya.")}</p> },
    { target: "nav-glossary", title: t("Glossary", "Glosarium"), body: <p>{t("Definitions you give the AI. It treats them as the truth, which keeps it from making things up.", "Definisi yang kamu berikan ke AI. AI menganggapnya benar, jadi tidak mengarang.")}</p> },
    { target: "nav-models", title: t("Models", "Model"), body: <p>{t("Connect the AI. It has its own tour; open it and press “Take the tour”.", "Hubungkan AI. Ada tur khusus; buka lalu tekan “Ikuti tur”.")}</p> },
    { target: "nav-usage", title: t("Usage", "Pemakaian"), body: <p>{t("Every AI call with its cost, plus an optional monthly budget.", "Setiap panggilan AI beserta biayanya, ditambah anggaran bulanan opsional.")}</p> },
    { target: "nav-connect", title: "Claude Desktop", body: <p>{t("Connect the Claude desktop app so Claude can read your map, quiz you and add what you read, using your Claude subscription instead of API credit.", "Hubungkan aplikasi Claude desktop supaya Claude bisa membaca petamu, menguji kamu, dan menambahkan yang kamu baca, memakai langganan Claude, bukan saldo API.")}</p> },
    { target: "nav-settings", title: t("Settings", "Pengaturan"), body: <p>{t("Language, theme, backups and reset.", "Bahasa, tema, cadangan, dan reset.")}</p> },
    { target: "sidebar-lang", title: t("Language", "Bahasa"), body: <p>{t("Switch the whole app between English and Indonesian. Summaries, questions and feedback switch too.", "Ganti seluruh aplikasi antara bahasa Inggris dan Indonesia. Ringkasan, soal, dan umpan balik ikut berganti.")}</p> },
  ];

  const sections = [["start", t("Start here", "Mulai di sini")], ["assistant", t("The Assistant", "Asisten")], ["claude", "Claude Desktop"], ["models", t("Providers, keys, models", "Penyedia, kunci, model")], ["fields", t("Every box explained", "Penjelasan tiap kotak")], ["cost", t("Tokens and cost", "Token dan biaya")], ["trouble", t("When something goes wrong", "Kalau ada masalah")], ["privacy", t("Privacy", "Privasi")], ["app", t("The rest of the app", "Bagian lain aplikasi")]];

  return (
    <Page title={t("Guide", "Panduan")} lede={t("Everything you need to get the AI working and use Neuron well, in plain words. Prefer to be shown? Take a tour.", "Semua yang perlu kamu tahu agar AI berjalan dan Neuron terpakai dengan baik, dalam bahasa sederhana. Lebih suka ditunjukkan? Ikuti tur.")}
      actions={<div className="inline"><Link className="btn primary" href="/models?tour=1">{t("Tour of Models", "Tur menu Model")}</Link><button className="btn" onClick={() => setTour(true)}>{t("Tour of the app", "Tur aplikasi")}</button></div>}>
      <div className="guide">
        <div className="toc">{sections.map(([k, l]) => <a key={k} className="chip" href={`#${k}`} style={{ textDecoration: "none" }}>{l}</a>)}</div>

        <h2 id="start">{t("Start here: get the AI working", "Mulai di sini: aktifkan AI")}</h2>
        <p>{t("Neuron needs an AI to read sources, write questions, grade essays and discuss. Pick one path below. You can add the others later and mix them.", "Neuron butuh AI untuk membaca sumber, menulis soal, menilai esai, dan berdiskusi. Pilih salah satu jalur di bawah. Yang lain bisa ditambah nanti dan dicampur.")}</p>
        <div className="path-cards">
          <div className="box">
            <h3>{t("Free, on your PC", "Gratis, di PC-mu")}<span className="tag-free">{t("Free", "Gratis")}</span></h3>
            <p className="muted small">{t("Ollama. Private, no account, no key. Slower and less sharp than paid models; needs a decent PC.", "Ollama. Privat, tanpa akun, tanpa kunci. Lebih lambat dan kurang tajam dibanding model berbayar; butuh PC yang cukup kuat.")}</p>
            <ol className="steps">
              <li>{t("Install Ollama from", "Pasang Ollama dari")} <a className="link" href="https://ollama.com/download" target="_blank" rel="noreferrer">ollama.com</a> {t("and open it.", "lalu buka.")}</li>
              <li>{t("In Neuron: Models → 1. Providers and keys → Ollama card. It should say Running.", "Di Neuron: Model → 1. Penyedia & kunci → kartu Ollama. Harus tertulis Berjalan.")}</li>
              <li>{t("Type", "Ketik")} {c("qwen3:8b")} {t("(or", "(atau")} {c("qwen3:4b")} {t("on a smaller PC) and press Download. Wait for 100%.", "untuk PC kecil) lalu tekan Unduh. Tunggu sampai 100%.")}</li>
              <li>{t("Go to 3. Use for each depth, pick it for all three, press Test model.", "Buka 3. Pakai di tiap tingkat, pilih model itu untuk ketiganya, tekan Tes model.")}</li>
            </ol>
          </div>
          <div className="box">
            <h3>{t("Free, online", "Gratis, online")}<span className="tag-free">{t("Free tier", "Paket gratis")}</span></h3>
            <p className="muted small">{t("Google Gemini or OpenRouter’s free models. Fast, decent quality, daily limits.", "Google Gemini atau model gratis OpenRouter. Cepat, kualitas lumayan, ada batas harian.")}</p>
            <ol className="steps">
              <li>{t("Get a key:", "Dapatkan kunci:")} <a className="link" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a> {t("or", "atau")} <a className="link" href="https://openrouter.ai/settings/keys" target="_blank" rel="noreferrer">OpenRouter</a>.</li>
              <li>{t("Models → 1. Providers and keys → paste it into that provider’s card → Save key.", "Model → 1. Penyedia & kunci → tempel di kartu penyedia itu → Simpan kunci.")}</li>
              <li>{t("Gemini models are already added. For OpenRouter: 2. Models → click OpenRouter → tick “Free models only” → Add one.", "Model Gemini sudah ditambahkan. Untuk OpenRouter: 2. Model → klik OpenRouter → centang “Hanya model gratis” → Tambah satu.")}</li>
              <li>{t("3. Use for each depth → pick it → Test model.", "3. Pakai di tiap tingkat → pilih → Tes model.")}</li>
            </ol>
          </div>
          <div className="box">
            <h3>{t("Best quality", "Kualitas terbaik")}<span className="tag-paid">{t("Paid", "Berbayar")}</span></h3>
            <p className="muted small">{t("Anthropic’s Claude models. Most accurate grading and imports. Pay per use; a Claude.ai subscription doesn’t cover it.", "Model Claude dari Anthropic. Penilaian dan impor paling akurat. Bayar sesuai pemakaian; langganan Claude.ai tidak mencakupnya.")}</p>
            <ol className="steps">
              <li>{t("Create a key at", "Buat kunci di")} <a className="link" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com</a> {t("and add a little credit.", "dan isi sedikit saldo.")}</li>
              <li>{t("Models → 1. Providers and keys → Anthropic API → paste → Save key.", "Model → 1. Penyedia & kunci → Anthropic API → tempel → Simpan kunci.")}</li>
              <li>{t("Haiku, Sonnet and Opus are already added and already set for Quick, Balanced and Deep.", "Haiku, Sonnet, dan Opus sudah ditambahkan dan sudah dipasang untuk Cepat, Seimbang, dan Mendalam.")}</li>
              <li>{t("Press Test model. Set a monthly budget in Usage if you like.", "Tekan Tes model. Atur anggaran bulanan di Pemakaian kalau mau.")}</li>
            </ol>
          </div>
        </div>

        <h2 id="assistant">{t("The Assistant on the Map", "Asisten di Peta")}</h2>
        <p>{t("The column on the right of the Map is a chat that can see your whole map: every concept, link, score and glossary term, plus the most relevant passages from your sources. Use it to plan, compare, quiz yourself or find things. Clicking a concept opens it in a second tab of the same column; “Hide panel” gives the graph the full width.", "Kolom di kanan Peta adalah obrolan yang bisa melihat seluruh petamu: setiap konsep, tautan, nilai, dan istilah glosarium, ditambah bagian sumber yang paling relevan. Pakai untuk merencanakan, membandingkan, kuis, atau mencari. Klik konsep untuk membukanya di tab kedua kolom yang sama; “Sembunyikan panel” memberi graf lebar penuh.")}</p>
        <div className="tablewrap"><table className="t">
          <thead><tr><th>{t("Type", "Ketik")}</th><th>{t("What happens", "Yang terjadi")}</th></tr></thead>
          <tbody>
            <tr><td>{c("@")}</td><td>{t("Pick a concept from the list. The assistant gets that concept’s full notes, sources and your definition.", "Pilih konsep dari daftar. Asisten mendapat catatan lengkap, sumber, dan definisimu untuk konsep itu.")}</td></tr>
            <tr><td>{c("/open @Hook")}, {c("/test")}, {c("/discuss")}, {c("/path")}</td><td>{t("Open that concept on a tab. Without a concept, uses the one you’re looking at.", "Buka konsep itu di tab tertentu. Tanpa konsep, memakai yang sedang dilihat.")}</td></tr>
            <tr><td>{c("/find words")}</td><td>{t("Search concepts and source passages. By meaning when a search model is set, otherwise by words.", "Cari konsep dan bagian sumber. Berdasarkan makna kalau model pencarian sudah diatur, selain itu berdasarkan kata.")}</td></tr>
            <tr><td>{c("/filter domain")}, {c("/filter all")}</td><td>{t("Show one domain on the map, or all again.", "Tampilkan satu domain di peta, atau semuanya lagi.")}</td></tr>
            <tr><td>{c("/view network")}, {c("/review")}, {c("/add")}, {c("/clear")}, {c("/help")}</td><td>{t("Switch view, open the next due concept, add a source, clear the chat, list commands.", "Ganti tampilan, buka konsep berikutnya yang perlu direview, tambah sumber, bersihkan obrolan, daftar perintah.")}</td></tr>
            <tr><td>{t("Anything else", "Selain itu")}</td><td>{t("Goes to the AI. Concepts in its answer are clickable, and it can offer buttons: open, test, discuss, show a domain, or suggest a link. Suggested links stay blue until you approve them.", "Dikirim ke AI. Konsep di jawabannya bisa diklik, dan AI bisa menawarkan tombol: buka, tes, diskusi, tampilkan domain, atau sarankan tautan. Saran tautan tetap biru sampai kamu setujui.")}</td></tr>
          </tbody>
        </table></div>
        <h3>{t("Search by meaning (optional)", "Pencarian berdasarkan makna (opsional)")}</h3>
        <p>{t("Set a search model in Models → 3. Use for each depth → Search index, then press Build index. Free option: download", "Atur model pencarian di Model → 3. Pakai di tiap tingkat → Indeks pencarian, lalu tekan Bangun indeks. Pilihan gratis: unduh")} {c("nomic-embed-text")} {t("on the Ollama card. With it, /find understands meaning (“why do ads stop working” finds creative fatigue), the Assistant quotes the right passages, and new concepts that mean the same as an old one are merged automatically instead of duplicated.", "di kartu Ollama. Dengan itu, /find memahami makna (“kenapa iklan berhenti efektif” menemukan kejenuhan materi iklan), Asisten mengutip bagian sumber yang tepat, dan konsep baru yang maknanya sama dengan konsep lama otomatis digabung, tidak dobel.")}</p>

        <h2 id="claude">{t("Use Neuron from Claude Desktop", "Pakai Neuron dari Claude Desktop")}</h2>
        <p>{t("If you have a Claude subscription, you can skip API costs for a lot of work: connect Neuron to the Claude desktop app and ask Claude directly. Claude can read and search your map, quiz you and save the results, explain concepts using your definitions, suggest links, and add articles you give it as new concepts. Open the Claude Desktop menu for the config to paste and a test button.", "Kalau kamu punya langganan Claude, banyak pekerjaan bisa tanpa biaya API: hubungkan Neuron ke aplikasi Claude desktop lalu tanya Claude langsung. Claude bisa membaca dan mencari di petamu, menguji kamu dan menyimpan hasilnya, menjelaskan konsep dengan definisimu, menyarankan tautan, dan menambahkan artikel yang kamu berikan sebagai konsep baru. Buka menu Claude Desktop untuk konfigurasi yang perlu ditempel dan tombol tes.")} <Link className="link" href="/connect">{t("Open Claude Desktop setup", "Buka pengaturan Claude Desktop")}</Link></p>
        <p>{t("Claude can also write with you. Before it writes, it asks you a short brief based on the rhetorical situation: who is speaking, the audience, genre, purpose, stance, context and culture, plus optional questions on language, expectations, technique, style, visuals, material and digital footprint. Each question comes with a hint on how to answer. Finished pieces and notes from your discussions are saved in the Writing menu.", "Claude juga bisa menulis bersamamu. Sebelum menulis, Claude menanyakan brief singkat berdasarkan situasi retoris: siapa yang berbicara, audiens, genre, tujuan, sikap, konteks, dan budaya, ditambah pertanyaan opsional tentang bahasa, harapan, teknik, gaya, visual, bahan, dan jejak digital. Tiap pertanyaan disertai petunjuk cara menjawab. Tulisan jadi dan catatan diskusi disimpan di menu Tulisan.")} <Link className="link" href="/writing?tab=guide">{t("See the writing guide", "Lihat panduan menulis")}</Link></p>

        <h2 id="models">{t("Providers, keys, models and depth", "Penyedia, kunci, model, dan tingkat")}</h2>
        <p>{t("Four words, one chain. Each piece needs the one before it.", "Empat istilah, satu rantai. Setiap bagian butuh bagian sebelumnya.")}</p>
        <HowItFits />
        <h3>{t("Provider", "Penyedia")}</h3>
        <p>{t("The company or app that actually runs the AI on its computers (or, for Ollama, on yours). Neuron sends your request there and shows the answer. You only need one provider, but you can have several.", "Perusahaan atau aplikasi yang benar-benar menjalankan AI di komputernya (atau, untuk Ollama, di komputermu). Neuron mengirim permintaanmu ke sana lalu menampilkan jawabannya. Satu penyedia sudah cukup, tapi boleh lebih.")}</p>
        <h3>{t("API key", "API key (kunci)")}</h3>
        <p>{t("A long secret code from the provider’s website, like a password for apps. It tells the provider which account to charge. You paste it once per provider. Keep it private: anyone with your key can spend your credit. If it leaks, delete it on the provider’s site and make a new one.", "Kode rahasia panjang dari situs penyedia, seperti kata sandi untuk aplikasi. Kode ini memberi tahu penyedia akun mana yang ditagih. Ditempel sekali per penyedia. Jaga kerahasiaannya: siapa pun yang punya kuncimu bisa memakai saldomu. Kalau bocor, hapus di situs penyedia lalu buat yang baru.")}</p>
        <h3>{t("Model", "Model")}</h3>
        <p>{t("One specific AI. Each provider offers many, from small and cheap to large and smart. In Neuron you keep a list of the models you might use. Each has a code (what the provider calls it, e.g.", "Satu AI tertentu. Setiap penyedia punya banyak, dari yang kecil dan murah sampai yang besar dan pintar. Di Neuron kamu menyimpan daftar model yang mungkin dipakai. Setiap model punya kode (sebutan dari penyedia, mis.")} {c("gemini-3.8-flash")}{t(") and prices.", ") dan harga.")}</p>
        <h3>{t("AI depth", "Tingkat AI")}</h3>
        <p>{t("Neuron has three slots: Quick, Balanced and Deep reasoning. You put one model in each. The depth you choose in the sidebar decides which slot is used right now. A common setup is a cheap model in Quick and your best model in Deep; using one model everywhere is also fine.", "Neuron punya tiga slot: Cepat, Seimbang, dan Penalaran mendalam. Isi satu model di tiap slot. Tingkat yang kamu pilih di sidebar menentukan slot mana yang sedang dipakai. Pengaturan umum: model murah di Cepat dan model terbaik di Mendalam; satu model untuk semua juga boleh.")}</p>

        <h2 id="fields">{t("Every box explained", "Penjelasan tiap kotak")}</h2>
        <h3>{t("1. Providers and keys", "1. Penyedia & kunci")}</h3>
        <div className="tablewrap"><table className="t">
          <thead><tr><th>{t("Box", "Kotak")}</th><th>{t("What to put in it", "Isinya apa")}</th><th>{t("Required?", "Wajib?")}</th></tr></thead>
          <tbody>
            <tr><td>{t("API key", "API key")}</td><td>{t("The key you copied from the provider’s site. Starts with", "Kunci yang kamu salin dari situs penyedia. Diawali")} {c("sk-ant-")} (Anthropic), {c("sk-or-")} (OpenRouter), {c("AIza")} (Gemini). {t("Ollama has no key.", "Ollama tanpa kunci.")}</td><td>{t("Yes, except Ollama", "Ya, kecuali Ollama")}</td></tr>
            <tr><td>{t("Base URL (Advanced)", "Base URL (Lanjutan)")}</td><td>{t("The address Neuron sends requests to. Already filled for the built-in providers; leave it. Only change it for Ollama on another computer, or when adding an OpenAI-compatible service (copy it from their docs, usually ending in /v1).", "Alamat tujuan permintaan Neuron. Sudah terisi untuk penyedia bawaan; biarkan. Ubah hanya untuk Ollama di komputer lain, atau saat menambah layanan kompatibel OpenAI (salin dari dokumentasinya, biasanya diakhiri /v1).")}</td><td>{t("Only for OpenAI-compatible", "Hanya untuk kompatibel OpenAI")}</td></tr>
            <tr><td>{t("Name (new provider)", "Nama (penyedia baru)")}</td><td>{t("Any label, e.g. Groq.", "Label bebas, mis. Groq.")}</td><td>{t("No", "Tidak")}</td></tr>
            <tr><td>{t("Turn off / Delete", "Matikan / Hapus")}</td><td>{t("Turn off hides its models without losing anything. Delete removes the provider and its models.", "Matikan menyembunyikan modelnya tanpa menghapus apa pun. Hapus membuang penyedia beserta modelnya.")}</td><td>–</td></tr>
          </tbody>
        </table></div>
        <h3>{t("2. Models", "2. Model")}</h3>
        <div className="tablewrap"><table className="t">
          <thead><tr><th>{t("Box", "Kotak")}</th><th>{t("What to put in it", "Isinya apa")}</th><th>{t("Required?", "Wajib?")}</th></tr></thead>
          <tbody>
            <tr><td>{t("Provider", "Penyedia")}</td><td>{t("Who runs this model.", "Siapa yang menjalankan model ini.")}</td><td>{t("Yes", "Ya")}</td></tr>
            <tr><td>{t("Model code", "Kode model")}</td><td>{t("The exact code the provider uses, copied character by character. Not the marketing name: “Claude Haiku 5.5” is the name,", "Kode persis yang dipakai penyedia, disalin huruf demi huruf. Bukan nama pemasaran: “Claude Haiku 5.5” itu nama,")} {c("claude-haiku-5-5")} {t("is the code. The easiest way is Browse, which fills it for you. For Ollama it’s the name you downloaded, like", "itu kodenya. Cara termudah pakai fitur Lihat model, yang mengisinya otomatis. Untuk Ollama, isinya nama yang kamu unduh, seperti")} {c("qwen3:8b")}.</td><td>{t("Yes", "Ya")}</td></tr>
            <tr><td>{t("Display name", "Nama tampilan")}</td><td>{t("Anything you like; only shown in Neuron.", "Bebas; hanya tampil di Neuron.")}</td><td>{t("No", "Tidak")}</td></tr>
            <tr><td>{t("Input price", "Harga masuk")}</td><td>{t("US dollars per 1 million tokens sent to the model (from the provider’s pricing page). Used only to estimate cost in Usage. 0 for free or local models.", "Dolar AS per 1 juta token yang dikirim ke model (dari halaman harga penyedia). Hanya untuk memperkirakan biaya di Pemakaian. 0 untuk model gratis atau lokal.")}</td><td>{t("No, but recommended", "Tidak, tapi disarankan")}</td></tr>
            <tr><td>{t("Output price", "Harga keluar")}</td><td>{t("Same, for tokens the model writes. Usually higher.", "Sama, untuk token yang ditulis model. Biasanya lebih mahal.")}</td><td>{t("No, but recommended", "Tidak, tapi disarankan")}</td></tr>
            <tr><td>{t("Context window", "Jendela konteks")}</td><td>{t("How many tokens the model can read at once. Just a note for you.", "Berapa token yang bisa dibaca model sekaligus. Hanya catatan.")}</td><td>{t("No", "Tidak")}</td></tr>
            <tr><td>{t("Max reply length", "Panjang balasan maks.")}</td><td>{t("Upper limit on the reply. Keep 4096. Raise to 8000 if imports come back cut off; lower to 2048 for small local models.", "Batas atas balasan. Biarkan 4096. Naikkan ke 8000 kalau impor terpotong; turunkan ke 2048 untuk model lokal kecil.")}</td><td>{t("No", "Tidak")}</td></tr>
            <tr><td>{t("Notes", "Catatan")}</td><td>{t("Reminders for yourself.", "Pengingat untukmu.")}</td><td>{t("No", "Tidak")}</td></tr>
          </tbody>
        </table></div>
        <h3>{t("3. Use for each depth", "3. Pakai di tiap tingkat")}</h3>
        <div className="tablewrap"><table className="t">
          <thead><tr><th>{t("Depth", "Tingkat")}</th><th>{t("Used for", "Dipakai untuk")}</th><th>{t("Good choice", "Pilihan yang cocok")}</th></tr></thead>
          <tbody>
            <tr><td>{t("Quick", "Cepat")}</td><td>{t("Every AI feature, while the sidebar is set to Quick.", "Semua fitur AI, selama sidebar di Cepat.")}</td><td>{t("A small, cheap or free model", "Model kecil, murah, atau gratis")}</td></tr>
            <tr><td>{t("Balanced", "Seimbang")}</td><td>{t("Every AI feature while the sidebar is set to Balanced. Also used for discussion, vocab suggestions and essay questions when the sidebar is on Deep.", "Semua fitur AI selama sidebar di Seimbang. Juga dipakai untuk diskusi, saran istilah, dan soal esai saat sidebar di Mendalam.")}</td><td>{t("A mid-size model", "Model ukuran menengah")}</td></tr>
            <tr><td>{t("Deep reasoning", "Penalaran mendalam")}</td><td>{t("Imports, multiple-choice questions and essay grading while the sidebar is set to Deep.", "Impor, soal pilihan ganda, dan penilaian esai selama sidebar di Mendalam.")}</td><td>{t("Your strongest model", "Model terkuatmu")}</td></tr>
          </tbody>
        </table></div>

        <h2 id="cost">{t("Tokens and cost", "Token dan biaya")}</h2>
        <p>{t("Providers charge by the token. A token is a piece of a word: about 4 characters of English, a little less for Indonesian. 1,000 tokens is roughly 750 English words. You pay for tokens sent (your text plus Neuron’s instructions) and tokens written back.", "Penyedia menagih per token. Token adalah potongan kata: sekitar 4 karakter bahasa Inggris, sedikit lebih pendek untuk bahasa Indonesia. 1.000 token kira-kira 750 kata bahasa Inggris. Kamu membayar token yang dikirim (teksmu ditambah instruksi Neuron) dan token yang ditulis balik.")}</p>
        <div className="tablewrap"><table className="t">
          <thead><tr><th>{t("Example", "Contoh")}</th><th className="num">{t("Tokens in / out", "Token masuk / keluar")}</th><th className="num">{t("Claude Haiku 5.5", "Claude Haiku 5.5")}</th><th className="num">{t("Claude Sonnet 5.5", "Claude Sonnet 5.5")}</th><th className="num">Ollama</th></tr></thead>
          <tbody>
            <tr><td>{t("Import a 3,000-word article", "Impor artikel 3.000 kata")}</td><td className="num">~6,000 / 2,000</td><td className="num">~$0.002</td><td className="num">~$0.03</td><td className="num">$0</td></tr>
            <tr><td>{t("Grade one essay", "Menilai satu esai")}</td><td className="num">~2,500 / 700</td><td className="num">~$0.0006</td><td className="num">~$0.012</td><td className="num">$0</td></tr>
            <tr><td>{t("One discussion reply", "Satu balasan diskusi")}</td><td className="num">~1,800 / 250</td><td className="num">~$0.0003</td><td className="num">~$0.006</td><td className="num">$0</td></tr>
          </tbody>
        </table></div>
        <p className="muted small">{t("Estimates using list prices of $0.10/$0.50 and $2/$10 per million tokens, Nov 2026. Check each provider’s pricing page; Usage shows what you actually spent.", "Perkiraan memakai harga $0,10/$0,50 dan $2/$10 per juta token, Nov 2026. Cek halaman harga tiap penyedia; Pemakaian menunjukkan biaya sebenarnya.")}</p>

        <h2 id="trouble">{t("When something goes wrong", "Kalau ada masalah")}</h2>
        <div className="tablewrap"><table className="t">
          <thead><tr><th>{t("You see", "Yang muncul")}</th><th>{t("What it means and what to do", "Artinya dan yang harus dilakukan")}</th></tr></thead>
          <tbody>
            <tr><td>{t("No model is set for this AI depth", "Belum ada model untuk tingkat AI ini")}</td><td>{t("Models → 3. Use for each depth → pick a model for the depth shown in the sidebar.", "Model → 3. Pakai di tiap tingkat → pilih model untuk tingkat yang tampil di sidebar.")}</td></tr>
            <tr><td>{t("This provider has no API key", "Penyedia ini belum punya API key")}</td><td>{t("Paste the key in 1. Providers and keys. Or pick a model from a provider that has one.", "Tempel kunci di 1. Penyedia & kunci. Atau pilih model dari penyedia yang sudah punya kunci.")}</td></tr>
            <tr><td>{t("The provider rejected the API key", "Penyedia menolak API key")}</td><td>{t("The key was copied wrong, deleted, or belongs to another provider. Make a new one and paste it again.", "Kunci salah salin, sudah dihapus, atau milik penyedia lain. Buat yang baru lalu tempel lagi.")}</td></tr>
            <tr><td>{t("The provider doesn’t know this model name", "Penyedia tidak mengenal nama model ini")}</td><td>{t("The model code has a typo or the model was retired. Delete it and add it again through Browse.", "Kode model salah ketik atau modelnya sudah pensiun. Hapus lalu tambahkan lagi lewat Lihat model.")}</td></tr>
            <tr><td>{t("Ollama hasn’t downloaded this model yet", "Ollama belum mengunduh model ini")}</td><td>{t("Download it on the Ollama card, or run", "Unduh di kartu Ollama, atau jalankan")} {c("ollama pull qwen3:8b")} {t("in PowerShell. Not", "di PowerShell. Bukan")} {c("ollama create")}{t(": that builds a custom model from a Modelfile, which is why it asked for one.", ": itu untuk membuat model kustom dari Modelfile, makanya ia meminta file itu.")}</td></tr>
            <tr><td>{t("Couldn’t reach the provider", "Tidak bisa menghubungi penyedia")}</td><td>{t("No internet, or Ollama isn’t running. Open the Ollama app and try again.", "Tidak ada internet, atau Ollama tidak berjalan. Buka aplikasi Ollama lalu coba lagi.")}</td></tr>
            <tr><td>{t("Usage limit / rate limit", "Batas pemakaian / rate limit")}</td><td>{t("Free tiers have daily limits; paid accounts may be out of credit. Wait, add credit, or switch depth to another model.", "Paket gratis punya batas harian; akun berbayar mungkin saldonya habis. Tunggu, isi saldo, atau ganti tingkat ke model lain.")}</td></tr>
            <tr><td>{t("The model’s reply couldn’t be read", "Balasan model tidak bisa dibaca")}</td><td>{t("Small models sometimes answer in the wrong format. Press the button again, or use a bigger model for that depth.", "Model kecil kadang menjawab dengan format yang salah. Tekan tombolnya lagi, atau pakai model lebih besar untuk tingkat itu.")}</td></tr>
          </tbody>
        </table></div>

        <h2 id="privacy">{t("Privacy", "Privasi")}</h2>
        <p>{t("Your map, keys and history live in one file on this PC: data/neuron.db. When you use an online provider, the text needed for that task (a source, your answer, the concept’s notes) is sent to that provider. With Ollama, nothing leaves your computer. Exports never include your keys.", "Peta, kunci, dan riwayatmu tersimpan dalam satu file di PC ini: data/neuron.db. Saat memakai penyedia online, teks yang dibutuhkan untuk tugas itu (sumber, jawabanmu, catatan konsep) dikirim ke penyedia tersebut. Dengan Ollama, tidak ada yang keluar dari komputermu. Ekspor tidak pernah menyertakan kuncimu.")}</p>

        <h2 id="app">{t("The rest of the app", "Bagian lain aplikasi")}</h2>
        <ul>
          <li><b>{t("Map", "Peta")}</b>: {t("click a concept, then use its tabs: Overview, Words, Test, Discuss, Path.", "klik konsep, lalu pakai tab-nya: Ringkasan, Istilah, Tes, Diskusi, Urutan.")}</li>
          <li><b>{t("Test", "Tes")}</b>: {t("pick an answer, then say how sure you are. Being certain and wrong flags a misconception, which comes first in review.", "pilih jawaban, lalu sebutkan seberapa yakin. Yakin tapi salah akan ditandai miskonsepsi, yang didahulukan saat review.")}</li>
          <li><b>{t("Review", "Review")}</b>: {t("each answer schedules the next review (FSRS). Easy answers wait longer; mistakes come back soon.", "setiap jawaban menjadwalkan review berikutnya (FSRS). Jawaban mudah menunggu lebih lama; kesalahan cepat muncul lagi.")}</li>
          <li><b>{t("Sources", "Sumber")}</b>: {t("paste text, upload PDF / Word / text / subtitle files, or open a web page. Long documents are read in parts. Each concept quotes the passage it came from.", "tempel teks, unggah file PDF / Word / teks / subtitle, atau buka halaman web. Dokumen panjang dibaca per bagian. Setiap konsep mengutip bagian sumbernya.")}</li>
          <li><b>{t("Your definition and Glossary", "Definisimu dan Glosarium")}</b>: {t("what you write is treated as the truth by the AI.", "yang kamu tulis dianggap benar oleh AI.")}</li>
          <li><b>{t("Settings", "Pengaturan")}</b>: {t("back up the database with one click before big changes.", "cadangkan database dengan satu klik sebelum perubahan besar.")}</li>
        </ul>
      </div>
      <Tour steps={appTour} open={tour} onClose={() => setTour(false)} />
    </Page>
  );
}
