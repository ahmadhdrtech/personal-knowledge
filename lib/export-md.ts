// Export the knowledge map as a folder of linked Markdown notes (works in Obsidian, Logseq, VS Code, GitHub).
import * as R from "./repo";
import { level, TYPES } from "./logic";
import type { Claim, ClaimStatus, Concept, Graph } from "./types";

type L = "en" | "id";
const tr = (lang: L, en: string, id: string) => (lang === "id" ? id : en);
const day = (ms: number | null | undefined) => (ms ? new Date(ms).toISOString().slice(0, 10) : null);
const yq = (s: string) => JSON.stringify(s); // YAML-safe double-quoted string
const tagOf = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const MARK: Record<ClaimStatus, string> = { supported: "✅", partly: "🟡", unsupported: "⚪", contradicted: "❌", disputed: "⚠️", unchecked: "·" };

/** File names that work on Windows, macOS and Linux, unique within a folder. */
function namer() {
  const used = new Set<string>();
  return (title: string) => {
    let base = title.replace(/[\\/:*?"<>|#^[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 90) || "Untitled";
    if (/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(base)) base += " note";
    let n = base, i = 2;
    while (used.has(n.toLowerCase())) n = `${base} (${i++})`;
    used.add(n.toLowerCase());
    return n;
  };
}

export function buildMarkdownVault(lang: L): Record<string, string> {
  const g: Graph = R.getGraph();
  const files: Record<string, string> = {};
  const name = { concept: namer(), source: namer(), topic: namer(), writing: namer(), lesson: namer() };
  const cName = new Map(g.concepts.map((c) => [c.id, name.concept(c.label.en)]));
  const dName = new Map(g.domains.map((d) => [d.key, name.topic(lang === "id" ? d.name.id || d.name.en : d.name.en)]));
  const sources = R.listSources();
  const sName = new Map(sources.map((s) => [s.id, name.source(s.title)]));
  const claims = R.listClaims();
  const link = (id: string) => `[[${cName.get(id) || id}]]`;
  const T = (b: { en: string; id: string } | null | undefined) => (b ? (lang === "id" ? b.id || b.en : b.en) : "");

  /* concepts */
  for (const c of g.concepts) {
    const mine = claims.filter((x) => x.conceptId === c.id);
    const out = g.links.filter((l) => l.status === "approved" && l.from === c.id), inn = g.links.filter((l) => l.status === "approved" && l.to === c.id);
    const fm = [
      "---", `id: ${yq(c.id)}`,
      c.label.id && c.label.id !== c.label.en ? `aliases: [${yq(c.label.id)}]` : null,
      `tags: [neuron/concept, ${c.domains.map((k) => `topic/${tagOf(g.domains.find((d) => d.key === k)?.name.en || k)}`).join(", ")}]`,
      `topics: [${c.domains.map((k) => yq(`[[${dName.get(k) || k}]]`)).join(", ")}]`,
      `mastery: ${c.mastery}`, `level: ${level(c.mastery)}`, c.miscon ? "misconception: true" : null,
      c.review ? `next_review: ${day(c.review.due)}` : null,
      mine.length ? `claims: ${mine.length}` : null, "---", "",
    ].filter((x) => x != null).join("\n");
    const body: string[] = [`# ${c.label.en}${c.label.id && c.label.id !== c.label.en ? ` · ${c.label.id}` : ""}`, ""];
    body.push(`> ${c.summary.en}`, ...(c.summary.id && c.summary.id !== c.summary.en ? [">", `> *${c.summary.id}*`] : []), "");
    if (c.userDef) body.push(`## ${tr(lang, "My definition", "Definisiku")}`, c.userDef, "");
    if (mine.length) body.push(`## ${tr(lang, "Claims", "Klaim")}`, ...mine.map((x) => claimMd(x, lang, sName)), "");
    if (out.length || inn.length) {
      body.push(`## ${tr(lang, "Connections", "Hubungan")}`);
      out.forEach((l) => body.push(`- ${T(TYPES[l.type].say)} ${link(l.to)}${l.why ? ` — ${T(l.why)}` : ""}`));
      inn.forEach((l) => body.push(`- ${link(l.from)} ${T(TYPES[l.type].say)} ${tr(lang, "this", "ini")}${l.why ? ` — ${T(l.why)}` : ""}`));
      body.push("");
    }
    if (c.vocab.length) body.push(`## ${tr(lang, "Terms", "Istilah")}`, "| English | Indonesia | " + tr(lang, "Example", "Contoh") + " |", "|---|---|---|", ...c.vocab.map((v) => `| ${v.en} | ${v.ind} | ${(v.ex || "").replace(/\|/g, "/")} |`), "");
    if (c.sources.length) {
      body.push(`## ${tr(lang, "Sources", "Sumber")}`);
      c.sources.forEach((s) => body.push(`- [[${sName.get(s.sourceId) || s.title}]]${s.page ? `, ${tr(lang, "p.", "hlm.")} ${s.page}` : ""}${s.note ? ` — ${s.note}` : ""}${s.quote ? `\n  > “${s.quote}”` : ""}`));
      body.push("");
    }
    if (c.quiz.length) {
      body.push(`## ${tr(lang, "Practice", "Latihan")}`);
      c.quiz.forEach((q) => body.push(`> [!question]- ${T(q.q)}`, ...q.o.map((o, i) => `> ${i === q.a ? "**" : ""}${String.fromCharCode(65 + i)}. ${T(o)}${i === q.a ? "**" : ""}`), `> `, `> ${T(q.why)}`, ""));
    }
    files[`Concepts/${cName.get(c.id)}.md`] = fm + body.join("\n");
  }

  /* topics (domains) */
  for (const d of g.domains) {
    const cs = g.concepts.filter((c) => c.domains.includes(d.key)).sort((a, b) => a.label.en.localeCompare(b.label.en));
    const avg = cs.length ? Math.round(cs.reduce((n, c) => n + c.mastery, 0) / cs.length) : 0;
    files[`Topics/${dName.get(d.key)}.md`] = ["---", "tags: [neuron/topic]", `concepts: ${cs.length}`, `average_mastery: ${avg}`, "---", "", `# ${T(d.name)}`, "",
      ...cs.map((c) => `- ${link(c.id)} · ${c.mastery}%${c.domains.length > 1 ? ` · ${tr(lang, "also in", "juga di")} ${c.domains.filter((k) => k !== d.key).map((k) => `[[${dName.get(k)}]]`).join(", ")}` : ""}`), ""].join("\n");
  }

  /* sources */
  for (const s of sources) {
    const full = R.getSource(s.id);
    files[`Sources/${sName.get(s.id)}.md`] = ["---", "tags: [neuron/source]", `kind: ${yq(s.kind)}`, s.urlOrPath && /^https?:/.test(s.urlOrPath) ? `url: ${yq(s.urlOrPath)}` : null, `added: ${day(s.createdAt)}`, "---", "",
      `# ${s.title}`, "", s.concepts.length ? `**${tr(lang, "Concepts", "Konsep")}:** ${s.concepts.map((c) => link(c.id)).join(", ")}` : null, "",
      full?.text ? `## ${tr(lang, "Text", "Teks")}\n\n${full.text.replace(/\f/g, "\n\n")}` : null, ""].filter((x) => x != null).join("\n");
  }

  /* glossary */
  if (g.glossary.length) files["Glossary.md"] = ["---", "tags: [neuron/glossary]", "---", "", `# ${tr(lang, "Glossary", "Glosarium")}`, "", ...g.glossary.map((x) => `**${x.term}** — ${x.definition}`).flatMap((l) => [l, ""])].join("\n");

  /* writing and notes */
  for (const w of R.listWritings()) {
    const brief = Object.entries(w.brief).map(([k, v]) => `${k}: ${yq(v)}`);
    files[`Writing/${name.writing(w.title)}.md`] = ["---", `tags: [neuron/${w.kind}]`, w.post?.slug ? `slug: ${yq(w.post.slug)}` : null, w.post?.excerpt ? `description: ${yq(w.post.excerpt)}` : null, w.post?.tags ? `post_tags: [${w.post.tags.split(",").map((x) => yq(x.trim())).filter((x) => x !== '""').join(", ")}]` : null, ...brief, `created: ${day(w.createdAt)}`, "---", "",
      `# ${w.title}`, "", w.body, "", w.conceptIds.length ? `**${tr(lang, "Concepts", "Konsep")}:** ${w.conceptIds.map(link).join(", ")}` : null, ""].filter((x) => x != null).join("\n");
  }

  /* lessons */
  for (const l of R.listLessons()) {
    const lines = ["---", "tags: [neuron/lesson]", `status: ${l.status}`, `started: ${day(l.createdAt)}`, "---", "", `# ${l.goal}`, ""];
    if (l.startSummary) lines.push(`## ${tr(lang, "Where I started", "Titik awalku")}`, l.startSummary, "");
    l.steps.forEach((s, i) => {
      lines.push(`## ${i + 1}. ${s.title}${s.status === "passed" ? " ✅" : ""}`, s.concept ? link(s.concept) : "", "");
      if (s.predict) lines.push(`> [!example] ${tr(lang, "Predict", "Tebak")}`, `> ${s.predict}`, ...(s.prediction ? [`> ${tr(lang, "My guess", "Tebakanku")}: ${s.prediction}`] : []), "");
      if (s.explanation) lines.push(s.explanation, "");
      if (s.check) lines.push(`> [!question]- ${s.check.question}`, ...(s.check.options || []).map((o, k) => `> ${k === s.check!.answer_index ? "**" : ""}${String.fromCharCode(65 + k)}. ${o}${k === s.check!.answer_index ? "**" : ""}`), ...(s.check.why ? ["> ", `> ${s.check.why}`] : []), "");
    });
    if (l.summary) lines.push(`## ${tr(lang, "Summary", "Ringkasan")}`, l.summary, "", ...l.next.map((n) => `- ${n}`), "");
    files[`Lessons/${name.lesson(l.goal)}.md`] = lines.join("\n");
  }

  /* index */
  const weak = [...g.concepts].filter((c) => c.mastery < 60 || c.miscon).sort((a, b) => a.mastery - b.mastery).slice(0, 10);
  const problems = claims.filter((x) => ["contradicted", "disputed", "unsupported"].includes(x.status));
  files["Neuron.md"] = ["---", "tags: [neuron/index]", `exported: ${day(Date.now())}`, "---", "", `# ${tr(lang, "My knowledge map", "Peta pengetahuanku")}`, "",
    tr(lang, `${g.concepts.length} concepts in ${g.domains.length} topics, ${sources.length} sources, ${claims.length} claims. Exported from Neuron.`, `${g.concepts.length} konsep dalam ${g.domains.length} topik, ${sources.length} sumber, ${claims.length} klaim. Diekspor dari Neuron.`), "",
    `## ${tr(lang, "Topics", "Topik")}`, ...g.domains.map((d) => `- [[${dName.get(d.key)}]] (${g.concepts.filter((c) => c.domains.includes(d.key)).length})`), "",
    weak.length ? `## ${tr(lang, "To study next", "Dipelajari berikutnya")}` : null, ...weak.map((c) => `- ${link(c.id)} · ${c.mastery}%${c.miscon ? ` · ${tr(lang, "misconception", "miskonsepsi")}` : ""}`), weak.length ? "" : null,
    problems.length ? `## ${tr(lang, "Claims to look at", "Klaim yang perlu dilihat")}` : null, ...problems.map((x) => `- ${MARK[x.status]} ${x.text} (${link(x.conceptId)})`), problems.length ? "" : null,
    `## ${tr(lang, "Legend", "Keterangan")}`, `${MARK.supported} ${tr(lang, "supported", "didukung")} · ${MARK.partly} ${tr(lang, "partly", "sebagian")} · ${MARK.unsupported} ${tr(lang, "not in source", "tidak di sumber")} · ${MARK.contradicted} ${tr(lang, "contradicted", "bertentangan")} · ${MARK.disputed} ${tr(lang, "disputed", "diperdebatkan")} · ${MARK.unchecked} ${tr(lang, "not checked", "belum dicek")}`, "",
  ].filter((x) => x != null).join("\n");
  return files;
}

function claimMd(x: Claim, lang: L, sName: Map<number, string>) {
  const lines = [`- ${MARK[x.status]} **${x.text}**`];
  x.because.forEach((b) => lines.push(`  - ${tr(lang, "because", "karena")} ${b}`));
  if (x.quote) lines.push(`  - > “${x.quote}”${x.sourceId ? ` — [[${sName.get(x.sourceId) || x.sourceTitle}]]${x.page ? `, ${tr(lang, "p.", "hlm.")} ${x.page}` : ""}` : ""}`);
  if (x.note) lines.push(`  - *${tr(lang, "Check", "Cek")}: ${x.note}*${x.evidence ? ` ([${tr(lang, "evidence", "bukti")}](${x.evidence}))` : ""}`);
  return lines.join("\n");
}

export type { Concept };
