// The rhetorical-situation brief that Claude (through MCP) asks before writing,
// and the writing techniques it can choose from. Shared by the MCP server and the Writing page.
// Based on "Rhetoric and the Rhetorical Situation": a rhetorical situation has AGENTS
// (originator and audience) and CONDITIONS (genre, purpose, stance, context, culture).
// The rest comes from the same section's learning outcomes (language, expectations,
// patterns of organization, verbal and nonverbal elements) and its "Social Media Savvy" part.
import type { Bi } from "./types";
import { PLATFORMS, formatRules, type BlogSettings } from "./blog";

export type BriefKey =
  | "originator" | "audience" | "genre" | "purpose" | "stance" | "context" | "culture"
  | "language" | "expectations" | "technique" | "style" | "visuals" | "material" | "footprint";

export type BriefQuestion = {
  key: BriefKey;
  group: "agents" | "conditions" | "craft";
  core: boolean;
  /** where the point comes from */
  from: "agents" | "conditions" | "outcomes" | "social" | "neuron";
  q: Bi; why: Bi; how: Bi; examples: { en: string[]; id: string[] }; fallback: Bi;
};

export const GROUPS: Record<BriefQuestion["group"], Bi> = {
  agents: { en: "Agents: who is talking to whom", id: "Pelaku: siapa berbicara kepada siapa" },
  conditions: { en: "Conditions: the five conditions of the situation", id: "Kondisi: lima kondisi situasinya" },
  craft: { en: "Craft: how it will be written (optional)", id: "Teknik: bagaimana tulisan dibuat (opsional)" },
};

export const FROM: Record<BriefQuestion["from"], Bi> = {
  agents: { en: "Rhetorical situation: agents", id: "Situasi retoris: pelaku" },
  conditions: { en: "Rhetorical situation: conditions", id: "Situasi retoris: kondisi" },
  outcomes: { en: "Learning outcomes of the section", id: "Capaian belajar bagian ini" },
  social: { en: "Social Media Savvy", id: "Cerdas bermedia sosial" },
  neuron: { en: "Added for Neuron", id: "Tambahan untuk Neuron" },
};

export const BRIEF: BriefQuestion[] = [
  {
    key: "originator", group: "agents", core: true, from: "agents",
    q: { en: "Who is speaking?", id: "Siapa yang berbicara?" },
    why: { en: "The originator starts the communication. Whose voice it is, and why they should be believed, changes how every sentence is read.", id: "Pembuat pesan adalah yang memulai komunikasi. Suara siapa yang dipakai, dan kenapa ia layak dipercaya, mengubah cara setiap kalimat dibaca." },
    how: { en: "Say whose name it goes out under and what gives that voice credibility (experience, role, results).", id: "Sebutkan atas nama siapa tulisan ini keluar dan apa yang membuat suara itu kredibel (pengalaman, peran, hasil)." },
    examples: { en: ["Me, as a student of the subject", "Me, as someone who works in this field", "A guest voice: explaining as a tutor would"], id: ["Saya, sebagai mahasiswa di bidang ini", "Saya, sebagai orang yang bekerja di bidang ini", "Suara tamu: menjelaskan seperti tutor"] },
    fallback: { en: "You, in your own voice.", id: "Kamu, dengan suaramu sendiri." },
  },
  {
    key: "audience", group: "agents", core: true, from: "agents",
    q: { en: "Who will read it, and do you know them?", id: "Siapa yang akan membaca, dan apakah kamu mengenal mereka?" },
    why: { en: "A real audience is people you know or know of (your class, a lecturer, one client). An anticipated audience is people you hope or expect to reach (followers, strangers who search). It decides what you explain, which words you use and how they may react.", id: "Audiens nyata adalah orang yang kamu kenal atau ketahui (kelasmu, dosen, satu klien). Audiens yang diantisipasi adalah orang yang kamu harap atau perkirakan terjangkau (pengikut, orang asing yang mencari). Ini menentukan apa yang perlu dijelaskan, kata yang dipakai, dan bagaimana reaksi mereka." },
    how: { en: "Name the group, say real or anticipated, what they already know, what they care about, and how they might react.", id: "Sebutkan kelompoknya, nyata atau diantisipasi, apa yang sudah mereka tahu, apa yang mereka pedulikan, dan kemungkinan reaksinya." },
    examples: { en: ["Real: my lecturer and 30 classmates", "Anticipated: Indonesian readers who find my blog through Google", "Anticipated: people in my field reading on LinkedIn"], id: ["Nyata: dosen dan 30 teman sekelas", "Diantisipasi: pembaca Indonesia yang menemukan blogku lewat Google", "Diantisipasi: orang di bidangku yang membaca di LinkedIn"] },
    fallback: { en: "No fallback: this one is needed.", id: "Tidak ada bawaan: yang ini wajib." },
  },
  {
    key: "genre", group: "conditions", core: true, from: "conditions",
    q: { en: "What genre or medium?", id: "Genre atau medianya apa?" },
    why: { en: "Genre is the mode you communicate in. Each one has conventions readers expect: length, structure, tone, layout. Breaking them should be a choice, not an accident.", id: "Genre adalah bentuk kamu berkomunikasi. Tiap genre punya konvensi yang diharapkan pembaca: panjang, struktur, nada, tata letak. Melanggarnya harus jadi pilihan, bukan kebetulan." },
    how: { en: "Name the form and where it will appear.", id: "Sebutkan bentuknya dan di mana akan tampil." },
    examples: { en: ["Blog post", "Academic essay for a course", "LinkedIn post", "Technical tutorial with code", "Thread on X", "Presentation script"], id: ["Tulisan blog", "Esai akademik untuk mata kuliah", "Postingan LinkedIn", "Tutorial teknis dengan kode", "Thread di X", "Naskah presentasi"] },
    fallback: { en: "No fallback: this one is needed.", id: "Tidak ada bawaan: yang ini wajib." },
  },
  {
    key: "purpose", group: "conditions", core: true, from: "conditions",
    q: { en: "Why are you writing it?", id: "Kenapa kamu menulisnya?" },
    why: { en: "Purpose is your reason, and there is often more than one: what the text does for the reader (inform, persuade, entertain, reflect, call to action) and what you want from it (a good grade, leads, attention, connection).", id: "Tujuan adalah alasanmu, dan sering lebih dari satu: apa yang dilakukan teks untuk pembaca (memberi info, membujuk, menghibur, merefleksikan, mengajak bertindak) dan apa yang kamu inginkan darinya (nilai bagus, prospek, perhatian, kedekatan)." },
    how: { en: "Pick the main purpose, add a second if there is one, and say what the reader should think, feel or do afterwards.", id: "Pilih tujuan utama, tambahkan tujuan kedua kalau ada, dan sebutkan apa yang harus dipikirkan, dirasakan, atau dilakukan pembaca setelahnya." },
    examples: { en: ["Inform: explain how compound interest works", "Persuade: start using version control early", "Reflect on a project I finished, and what I would change"], id: ["Memberi info: menjelaskan cara kerja bunga majemuk", "Membujuk: mulai pakai version control sejak awal", "Merefleksikan proyek yang kuselesaikan, dan apa yang akan kuubah"] },
    fallback: { en: "No fallback: this one is needed.", id: "Tidak ada bawaan: yang ini wajib." },
  },
  {
    key: "stance", group: "conditions", core: true, from: "conditions",
    q: { en: "What is your take?", id: "Apa sikap atau pandanganmu?" },
    why: { en: "Stance is your viewpoint as it shows in the text. A clear stance is what makes writing critical instead of ordinary: what are you saying that's new, different, insightful or edgy?", id: "Sikap adalah sudut pandangmu yang tampak di teks. Sikap yang jelas membuat tulisan kritis, bukan biasa: apa yang kamu katakan yang baru, berbeda, tajam, atau berani?" },
    how: { en: "Write it as one sentence. Say how strongly you hold it, and whether the piece should answer the other side.", id: "Tulis dalam satu kalimat. Sebutkan seberapa kuat kamu memegangnya, dan apakah tulisan perlu menjawab pihak yang berseberangan." },
    examples: { en: ["Strong: most “AI will replace programmers” takes ignore what programmers actually do", "Balanced: crypto has real uses, but most coins are speculation", "Neutral explainer, no position"], id: ["Kuat: kebanyakan opini “AI akan menggantikan programmer” mengabaikan apa yang sebenarnya dikerjakan programmer", "Seimbang: kripto punya kegunaan nyata, tapi kebanyakan koin hanya spekulasi", "Penjelasan netral, tanpa posisi"] },
    fallback: { en: "Claude proposes a stance from your discussion and asks you to confirm it.", id: "Claude mengusulkan sikap dari diskusimu lalu memintamu mengonfirmasi." },
  },
  {
    key: "context", group: "conditions", core: true, from: "conditions",
    q: { en: "What is the setting right now?", id: "Apa latar situasinya saat ini?" },
    why: { en: "Context is the setting: the social, political or economic situation and the moment it will be read in. The same post lands differently during a crisis, a holiday or a trending debate.", id: "Konteks adalah latarnya: situasi sosial, politik, atau ekonomi dan momen saat tulisan dibaca. Postingan yang sama terasa berbeda saat krisis, hari raya, atau debat yang sedang ramai." },
    how: { en: "Say when and where it will be read, and what is going on that your audience is already thinking about.", id: "Sebutkan kapan dan di mana dibaca, dan apa yang sedang terjadi yang sudah dipikirkan audiensmu." },
    examples: { en: ["A new AI model was just released", "Interest rates went up", "Right after a viral science myth", "Graduation and job-hunting season"], id: ["Model AI baru saja dirilis", "Suku bunga baru naik", "Tepat setelah mitos sains yang viral", "Musim wisuda dan cari kerja"] },
    fallback: { en: "Today, with nothing special going on.", id: "Hari ini, tanpa peristiwa khusus." },
  },
  {
    key: "culture", group: "conditions", core: true, from: "conditions",
    q: { en: "What does your audience share, and do you share it?", id: "Apa yang dimiliki bersama oleh audiensmu, dan apakah kamu bagian darinya?" },
    why: { en: "Culture is a group that shares values, beliefs or habits. You make assumptions about it when you write. You talk differently to people inside your culture than to people whose views differ from yours.", id: "Budaya adalah kelompok yang berbagi nilai, keyakinan, atau kebiasaan. Kamu membuat asumsi tentangnya saat menulis. Cara bicara ke orang yang sebudaya berbeda dengan ke orang yang pandangannya berbeda darimu." },
    how: { en: "List the values they hold, what would offend or lose them, and whether you are an insider or an outsider.", id: "Sebutkan nilai yang mereka pegang, apa yang bisa menyinggung atau membuat mereka pergi, dan apakah kamu orang dalam atau orang luar." },
    examples: { en: ["Indonesian students: casual, value practical takeaways, skeptical of hype; I’m an insider", "Developers: expect accuracy and code that runs, dislike fluff", "General readers: no jargon, respect for religion and family values"], id: ["Mahasiswa Indonesia: santai, suka manfaat praktis, skeptis pada hype; saya orang dalam", "Developer: mengharapkan akurasi dan kode yang jalan, tidak suka basa-basi", "Pembaca umum: tanpa jargon, menghormati nilai agama dan keluarga"] },
    fallback: { en: "Claude assumes what fits the audience you described and states the assumption.", id: "Claude memakai asumsi yang cocok dengan audiens yang kamu sebutkan dan menyebutkan asumsinya." },
  },
  {
    key: "language", group: "craft", core: false, from: "outcomes",
    q: { en: "Which language and register?", id: "Bahasa dan ragamnya apa?" },
    why: { en: "Conventions are shaped by language too. The same idea reads differently in formal Indonesian, casual Jakarta slang or academic English.", id: "Konvensi juga dibentuk oleh bahasa. Ide yang sama terasa berbeda dalam bahasa Indonesia baku, bahasa gaul Jakarta, atau bahasa Inggris akademik." },
    how: { en: "Pick the language, how formal, and any words to use or avoid.", id: "Pilih bahasanya, seberapa formal, dan kata yang harus dipakai atau dihindari." },
    examples: { en: ["Casual Indonesian (aku/kamu)", "Formal Indonesian (EYD)", "Academic English", "Indonesian with English tech terms"], id: ["Bahasa Indonesia santai (aku/kamu)", "Bahasa Indonesia baku (EYD)", "Bahasa Inggris akademik", "Bahasa Indonesia dengan istilah teknologi berbahasa Inggris"] },
    fallback: { en: "The language you're chatting in, at the register the genre expects.", id: "Bahasa yang kamu pakai saat chat, dengan ragam yang sesuai genre." },
  },
  {
    key: "expectations", group: "craft", core: false, from: "outcomes",
    q: { en: "What must it include to meet expectations?", id: "Apa yang wajib ada supaya sesuai harapan?" },
    why: { en: "Expectation shapes conventions: a rubric, a client brief, a platform limit or a citation style decides what counts as done.", id: "Harapan membentuk konvensi: rubrik, brief klien, batas platform, atau gaya sitasi menentukan kapan tulisan dianggap selesai." },
    how: { en: "Give the length, required parts, deadline format, citation style, or paste the rubric or brief.", id: "Sebutkan panjang, bagian wajib, format, gaya sitasi, atau tempel rubrik atau brief-nya." },
    examples: { en: ["800–1000 words, APA 7, 3 sources", "My blog: title ≤ 140 characters, summary ≤ 300, comma-separated tags", "Must include one code example"], id: ["800–1000 kata, APA 7, 3 sumber", "Blogku: judul ≤ 140 karakter, ringkasan ≤ 300, tag dipisah koma", "Harus ada satu contoh kode"] },
    fallback: { en: "The usual length and parts of the genre.", id: "Panjang dan bagian yang lazim untuk genre itu." },
  },
  {
    key: "technique", group: "craft", core: false, from: "outcomes",
    q: { en: "Which writing technique and pattern of organization?", id: "Teknik menulis dan pola penyusunannya apa?" },
    why: { en: "The pattern of organization sets up the relationships between ideas: cause and effect, problem and solution, a story arc, a claim with evidence.", id: "Pola penyusunan membangun hubungan antaride: sebab-akibat, masalah-solusi, alur cerita, klaim dengan bukti." },
    how: { en: "Pick one from the technique list, combine two, or let Claude choose and explain why.", id: "Pilih satu dari daftar teknik, gabungkan dua, atau biarkan Claude memilih dan menjelaskan alasannya." },
    examples: { en: ["Storytelling", "PAS (problem, agitate, solve)", "Toulmin argument", "Compare and contrast"], id: ["Storytelling", "PAS (masalah, pertajam, solusi)", "Argumen Toulmin", "Bandingkan dan bedakan"] },
    fallback: { en: "Claude picks the technique that fits the genre and purpose, and says why.", id: "Claude memilih teknik yang cocok dengan genre dan tujuan, lalu menjelaskan alasannya." },
  },
  {
    key: "style", group: "craft", core: false, from: "neuron",
    q: { en: "What style and tone?", id: "Gaya dan nadanya seperti apa?" },
    why: { en: "Two pieces with the same brief can still sound authoritative or friendly, punchy or calm. Tone is where the reader decides whether they like the voice.", id: "Dua tulisan dengan brief sama tetap bisa terdengar berwibawa atau ramah, tajam atau tenang. Dari nada, pembaca memutuskan apakah mereka suka suaranya." },
    how: { en: "Give 2–3 adjectives, or paste a sample of writing you want it to sound like.", id: "Berikan 2–3 kata sifat, atau tempel contoh tulisan yang ingin ditiru gayanya." },
    examples: { en: ["Direct, practical, a little funny", "Warm and calm", "Confident, short sentences, no jargon"], id: ["Lugas, praktis, sedikit lucu", "Hangat dan tenang", "Percaya diri, kalimat pendek, tanpa jargon"] },
    fallback: { en: "Clear and plain, matched to the audience.", id: "Jelas dan sederhana, disesuaikan dengan audiens." },
  },
  {
    key: "visuals", group: "craft", core: false, from: "outcomes",
    q: { en: "Words only, or with nonverbal elements?", id: "Hanya kata-kata, atau dengan unsur nonverbal?" },
    why: { en: "Verbal and nonverbal elements work together: headings, images, charts, emojis, hashtags, on-screen text, camera shots and layout carry meaning too.", id: "Unsur verbal dan nonverbal bekerja bersama: judul, gambar, grafik, emoji, tagar, teks di layar, shot kamera, dan tata letak juga membawa makna." },
    how: { en: "Say what will appear next to the words, or ask Claude to suggest it.", id: "Sebutkan apa yang akan tampil di samping kata-kata, atau minta Claude menyarankannya." },
    examples: { en: ["Subheadings, one table and a code block", "One diagram and a cover image", "Carousel: 7 slides with a caption", "No emojis"], id: ["Subjudul, satu tabel, dan satu blok kode", "Satu diagram dan gambar sampul", "Carousel: 7 slide dengan caption", "Tanpa emoji"] },
    fallback: { en: "What the genre normally uses.", id: "Yang lazim dipakai genre itu." },
  },
  {
    key: "material", group: "craft", core: false, from: "neuron",
    q: { en: "What should it draw on?", id: "Bahan apa yang dipakai?" },
    why: { en: "Critical writing makes distinctions and draws conclusions that stand up to scrutiny. That needs evidence: your Neuron concepts, your sources, your discussion, or facts that must be checked.", id: "Tulisan kritis membuat pembedaan dan kesimpulan yang tahan diuji. Itu butuh bukti: konsep di Neuron, sumbermu, diskusimu, atau fakta yang harus dicek." },
    how: { en: "Name the concepts or sources, say whether to cite them, and anything it must not claim.", id: "Sebutkan konsep atau sumbernya, apakah perlu dikutip, dan klaim apa yang tidak boleh dibuat." },
    examples: { en: ["Our discussion just now", "My Neuron concepts on this topic, with their sources cited", "Only facts I can link to"], id: ["Diskusi kita barusan", "Konsep Neuron-ku tentang topik ini, dengan sumbernya dikutip", "Hanya fakta yang bisa kutautkan"] },
    fallback: { en: "Your discussion and the matching concepts on your map; your own definitions win.", id: "Diskusimu dan konsep yang cocok di petamu; definisimu sendiri yang dipakai." },
  },
  {
    key: "footprint", group: "craft", core: false, from: "social",
    q: { en: "If it's public: how will it age?", id: "Kalau publik: bagaimana jejaknya nanti?" },
    why: { en: "Every post leaves a digital footprint that may never go away. Ask how it would read to a future employer, client or admissions office.", id: "Setiap postingan meninggalkan jejak digital yang mungkin tidak pernah hilang. Tanyakan bagaimana tulisan ini dibaca oleh calon atasan, klien, atau panitia penerimaan nanti." },
    how: { en: "Say yes, it's public, and anything you don't want tied to your name.", id: "Sebutkan ya, ini publik, dan hal apa yang tidak ingin dikaitkan dengan namamu." },
    examples: { en: ["Public on my blog: anyone can find it", "Private, only my lecturer sees it", "Public, but no opinions about my current workplace"], id: ["Publik di blogku: siapa saja bisa menemukannya", "Privat, hanya dosen yang melihat", "Publik, tapi tanpa opini tentang tempat kerjaku sekarang"] },
    fallback: { en: "Claude adds a short footprint check for anything public.", id: "Claude menambahkan cek jejak digital singkat untuk tulisan publik." },
  },
];

export type Technique = { key: string; name: Bi; kind: "story" | "persuade" | "argue" | "explain" | "reflect"; what: Bi; best: Bi; steps: Bi };

export const KINDS: Record<Technique["kind"], Bi> = {
  story: { en: "Story", id: "Cerita" }, persuade: { en: "Persuade", id: "Membujuk" },
  argue: { en: "Argue", id: "Berargumen" }, explain: { en: "Explain and organize", id: "Menjelaskan dan menyusun" }, reflect: { en: "Reflect", id: "Refleksi" },
};

export const TECHNIQUES: Technique[] = [
  { key: "story", kind: "story", name: { en: "Storytelling (three acts)", id: "Storytelling (tiga babak)" }, what: { en: "A character, a problem that grows, a turning point and a resolution.", id: "Tokoh, masalah yang membesar, titik balik, dan penyelesaian." }, best: { en: "Organic content, personal essays, brand stories, speeches", id: "Konten organik, esai pribadi, cerita brand, pidato" }, steps: { en: "Setup → conflict → turning point → resolution → meaning", id: "Pengenalan → konflik → titik balik → penyelesaian → makna" } },
  { key: "hso", kind: "story", name: { en: "Hook, story, offer", id: "Hook, cerita, penawaran" }, what: { en: "Stop the scroll, tell a short true story, then make one offer.", id: "Hentikan scroll, ceritakan kisah nyata singkat, lalu satu penawaran." }, best: { en: "Short videos, threads and blog intros", id: "Video pendek, thread, dan pembuka tulisan blog" }, steps: { en: "Hook (first 3 seconds) → story → offer and CTA", id: "Hook (3 detik pertama) → cerita → penawaran dan CTA" } },
  { key: "aida", kind: "persuade", name: { en: "AIDA", id: "AIDA" }, what: { en: "Attention, interest, desire, action.", id: "Perhatian, minat, keinginan, tindakan." }, best: { en: "Landing pages, project pitches, calls to action", id: "Landing page, pitch proyek, ajakan bertindak" }, steps: { en: "Attention → interest → desire → action", id: "Perhatian → minat → keinginan → tindakan" } },
  { key: "pas", kind: "persuade", name: { en: "PAS", id: "PAS" }, what: { en: "Name the problem, make the pain felt, then solve it.", id: "Sebut masalahnya, buat rasa sakitnya terasa, lalu beri solusi." }, best: { en: "Problem-aware audiences, short scripts", id: "Audiens yang sadar masalah, script pendek" }, steps: { en: "Problem → agitate → solve", id: "Masalah → pertajam → solusi" } },
  { key: "bab", kind: "persuade", name: { en: "Before, after, bridge", id: "Sebelum, sesudah, jembatan" }, what: { en: "Life now, life after, and how to get there.", id: "Kondisi sekarang, kondisi nanti, dan cara ke sana." }, best: { en: "Testimonials, case studies, transformations", id: "Testimoni, studi kasus, transformasi" }, steps: { en: "Before → after → bridge", id: "Sebelum → sesudah → jembatan" } },
  { key: "fab", kind: "persuade", name: { en: "Features, advantages, benefits", id: "Fitur, keunggulan, manfaat" }, what: { en: "Turn each spec into what it does and why the reader cares.", id: "Ubah tiap spesifikasi menjadi apa fungsinya dan kenapa pembaca peduli." }, best: { en: "Explaining a tool, library or product to someone choosing one", id: "Menjelaskan alat, library, atau produk ke orang yang sedang memilih" }, steps: { en: "Feature → advantage → benefit, for each point", id: "Fitur → keunggulan → manfaat, untuk tiap poin" } },
  { key: "appeals", kind: "persuade", name: { en: "Ethos, pathos, logos", id: "Ethos, pathos, logos" }, what: { en: "Balance credibility, emotion and reasoning on purpose.", id: "Seimbangkan kredibilitas, emosi, dan logika dengan sengaja." }, best: { en: "Any persuasive piece; checking a draft", id: "Semua tulisan persuasif; memeriksa draf" }, steps: { en: "Why trust me → why care → why it's true", id: "Kenapa percaya saya → kenapa peduli → kenapa benar" } },
  { key: "cer", kind: "argue", name: { en: "Claim, evidence, reasoning", id: "Klaim, bukti, penalaran" }, what: { en: "State the claim, show evidence, explain why the evidence proves it.", id: "Nyatakan klaim, tunjukkan bukti, jelaskan kenapa bukti itu membuktikannya." }, best: { en: "Short academic answers, opinion posts", id: "Jawaban akademik singkat, postingan opini" }, steps: { en: "Claim → evidence → reasoning", id: "Klaim → bukti → penalaran" } },
  { key: "toulmin", kind: "argue", name: { en: "Toulmin argument", id: "Argumen Toulmin" }, what: { en: "Adds the hidden assumption and answers the strongest objection.", id: "Menambahkan asumsi tersembunyi dan menjawab keberatan terkuat." }, best: { en: "Essays where readers will push back", id: "Esai yang akan dibantah pembaca" }, steps: { en: "Claim → grounds → warrant → backing → qualifier → rebuttal", id: "Klaim → dasar → jaminan → dukungan → batasan → sanggahan" } },
  { key: "rogerian", kind: "argue", name: { en: "Rogerian argument", id: "Argumen Rogerian" }, what: { en: "Start from common ground and the other side's view before your own.", id: "Mulai dari kesamaan dan pandangan pihak lain sebelum pandanganmu." }, best: { en: "Audiences outside your culture or who disagree", id: "Audiens di luar budayamu atau yang tidak setuju" }, steps: { en: "Their view, fairly → where it's right → your view → shared solution", id: "Pandangan mereka, secara adil → bagian yang benar → pandanganmu → solusi bersama" } },
  { key: "classical", kind: "argue", name: { en: "Classical argument", id: "Argumen klasik" }, what: { en: "The five-part structure from Greek and Roman rhetoric.", id: "Struktur lima bagian dari retorika Yunani dan Romawi." }, best: { en: "Formal essays, debates, speeches", id: "Esai formal, debat, pidato" }, steps: { en: "Introduction → background → your case → refutation → conclusion", id: "Pembuka → latar → argumenmu → sanggahan → kesimpulan" } },
  { key: "peel", kind: "explain", name: { en: "PEEL paragraphs", id: "Paragraf PEEL" }, what: { en: "Each paragraph: point, evidence, explanation, link back.", id: "Tiap paragraf: poin, bukti, penjelasan, kaitan balik." }, best: { en: "Academic essays and reports", id: "Esai akademik dan laporan" }, steps: { en: "Point → evidence → explain → link", id: "Poin → bukti → jelaskan → kaitkan" } },
  { key: "pyramid", kind: "explain", name: { en: "Inverted pyramid", id: "Piramida terbalik" }, what: { en: "Most important facts first, details after.", id: "Fakta terpenting dulu, rincian sesudahnya." }, best: { en: "News, announcements, busy readers", id: "Berita, pengumuman, pembaca sibuk" }, steps: { en: "Who, what, when, where, why → key details → background", id: "Siapa, apa, kapan, di mana, kenapa → rincian penting → latar" } },
  { key: "compare", kind: "explain", name: { en: "Compare and contrast", id: "Bandingkan dan bedakan" }, what: { en: "Line two things up on the same points.", id: "Sejajarkan dua hal pada poin yang sama." }, best: { en: "Reviews, buying guides, analysis", id: "Ulasan, panduan membeli, analisis" }, steps: { en: "Point by point, or one subject then the other → verdict", id: "Poin per poin, atau satu subjek lalu yang lain → kesimpulan" } },
  { key: "cause", kind: "explain", name: { en: "Cause and effect", id: "Sebab dan akibat" }, what: { en: "Trace why something happens and what follows.", id: "Telusuri kenapa sesuatu terjadi dan apa dampaknya." }, best: { en: "Explainers, analysis, problem awareness", id: "Penjelasan, analisis, menyadarkan masalah" }, steps: { en: "Cause → chain → effect → what to do", id: "Sebab → rantai → akibat → yang perlu dilakukan" } },
  { key: "problem", kind: "explain", name: { en: "Problem and solution", id: "Masalah dan solusi" }, what: { en: "Define a problem, weigh options, recommend one.", id: "Definisikan masalah, timbang pilihan, rekomendasikan satu." }, best: { en: "Proposals, reports, case studies of projects", id: "Proposal, laporan, studi kasus proyek" }, steps: { en: "Problem → options → best option → next step", id: "Masalah → pilihan → pilihan terbaik → langkah berikutnya" } },
  { key: "process", kind: "explain", name: { en: "Process (how-to)", id: "Proses (cara)" }, what: { en: "Numbered steps in the order they are done.", id: "Langkah bernomor sesuai urutan." }, best: { en: "Tutorials, SOPs, educational content", id: "Tutorial, SOP, konten edukasi" }, steps: { en: "Goal → what you need → steps → check", id: "Tujuan → yang dibutuhkan → langkah → cek" } },
  { key: "feynman", kind: "explain", name: { en: "Feynman explanation", id: "Penjelasan Feynman" }, what: { en: "Explain it simply with one example, then name the gap.", id: "Jelaskan dengan sederhana dan satu contoh, lalu sebut celahnya." }, best: { en: "Study notes, teaching, explainers", id: "Catatan belajar, mengajar, penjelasan" }, steps: { en: "Plain explanation → example → where it breaks → refine", id: "Penjelasan sederhana → contoh → di mana tidak berlaku → perbaiki" } },
  { key: "listicle", kind: "explain", name: { en: "Listicle", id: "Listicle" }, what: { en: "A numbered list of parallel points under one promise.", id: "Daftar bernomor berisi poin sejajar di bawah satu janji." }, best: { en: "Carousels, blogs, skimmable posts", id: "Carousel, blog, postingan yang mudah dipindai" }, steps: { en: "Promise → points → wrap-up", id: "Janji → poin-poin → penutup" } },
  { key: "whatsowhat", kind: "reflect", name: { en: "What, so what, now what", id: "Apa, lalu kenapa, lalu apa" }, what: { en: "What happened, why it matters, what you'll do next.", id: "Apa yang terjadi, kenapa penting, apa yang akan dilakukan." }, best: { en: "Reflections, learning journals, post-mortems", id: "Refleksi, jurnal belajar, evaluasi" }, steps: { en: "What → so what → now what", id: "Apa → lalu kenapa → lalu apa" } },
  { key: "gibbs", kind: "reflect", name: { en: "Gibbs reflective cycle", id: "Siklus reflektif Gibbs" }, what: { en: "A fuller six-step reflection.", id: "Refleksi enam langkah yang lebih lengkap." }, best: { en: "Academic reflective essays", id: "Esai reflektif akademik" }, steps: { en: "Description → feelings → evaluation → analysis → conclusion → action plan", id: "Deskripsi → perasaan → evaluasi → analisis → kesimpulan → rencana aksi" } },
];

/** How Claude should run the brief. Sent by the MCP server. */
export const WORKFLOW = [
  "1. Read the topic. If it touches the user's map, use neuron_search or neuron_read_concept first, so you can suggest material.",
  "2. Ask the brief in ONE message: the 7 core questions numbered (agents, then the five conditions), then the optional craft questions in a short list. For each question give: the question, one line on how to answer, and 2-3 short examples in the user's language. Say they can answer briefly, skip optional ones, or reply 'you choose' for any of them.",
  "3. If the request already answers some questions, fill them in and ask the user to confirm instead of asking again.",
  "4. Don't write until the core answers are in, unless the user says to just write. For 'you choose', use the fallback and say what you chose. If two answers clash (e.g. a formal genre with slang), ask one follow-up.",
  "5. Before writing, restate the brief in 3-5 lines and name the technique you'll use and why it fits.",
  "6. Write the piece. After it, add short 'Rhetorical notes': how it fits the audience, purpose, genre conventions and culture, and a digital footprint check if it's public.",
  "7. Offer to save it. Only after the user agrees, call neuron_save_writing with the brief. To save a revision, pass the same id.",
];

/** Starting answers for a blog post, built from Settings → About you and Your blog. The user confirms or changes them. */
export function blogPreset(p: { name: string; about: string; interests: string }, b: BlogSettings): Partial<Record<BriefKey, string>> {
  const plat = PLATFORMS[b.platform] || PLATFORMS.markdown;
  const where = b.name ? `${b.name}${b.url ? ` (${b.url})` : ""}` : plat.name.en;
  const out: Partial<Record<BriefKey, string>> = {
    genre: `Blog post on ${where}`,
    language: b.lang === "id" ? "Indonesian, natural and clear (not stiff), English terms kept where readers know them" : "English, plain and clear",
    expectations: formatRules(b),
    visuals: "Subheadings (##), short paragraphs; a table, list or code block where it helps; optional cover image",
    material: "My research in Neuron (concepts, sources, notes), cited with links; anything not from my sources must be checked and cited",
    footprint: "Public: anyone, including future employers or clients, may read it",
  };
  const who = [p.name, p.about].filter(Boolean).join(": ");
  if (who) out.originator = who;
  if (b.audience) out.audience = `Anticipated: ${b.audience}`;
  if (b.voice) out.style = b.voice;
  return out;
}

/** Extra steps for the research-to-post flow. */
export const BLOG_STEPS = [
  "1. Call neuron_research_pack with the topic. Tell the user in 3-6 bullets what their map already has (concepts, their definitions, sources, notes) and what is missing.",
  "2. If something important is missing, offer to research it (web search if you have it). Keep every fact with its source and link. Never present your own knowledge as the user's research.",
  "3. Run the brief from neuron_writing_guide. The 'prefilled' answers come from the user's Settings: show them as one short list to confirm or change, and ask only the open core questions (purpose, stance, context, culture) with guidance and examples.",
  "4. Propose an angle and an outline (title, 4-6 ## sections, the technique) and wait for an OK.",
  "5. Write the post in Markdown following blog_format exactly (it depends on the user's blog platform): start with ## subheadings (the title is a separate field), short paragraphs, links as [text](https://...). End with a '## Sumber' (Indonesian) or '## Sources' section listing every source with its link.",
  "6. Also write the fields the platform uses (see blog: has_slug, has_tags, excerpt_label and the limits in blog_format): a title, a slug, the summary/subtitle, tags, and an optional cover image idea.",
  "7. Add short Rhetorical notes and a digital footprint check. Offer to save; on OK call neuron_save_writing with brief, post (slug, excerpt, tags, cover_url, sources) and the concepts used. Tell the user it's in Neuron → Writing, ready to copy field by field into their blog editor or download as a .md file.",
];
