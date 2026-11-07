// Prompts ported unchanged from the prototype (search for AI.json( there).
import { CONF, TYPES } from "../logic";
import type { Concept, Confidence, Graph, Lang } from "../types";

export const RULES =
  "You are a careful tutor inside a learner’s personal knowledge app. Ground everything in the concept information and glossary below. The learner’s own definitions and the verified glossary are authoritative: if your own knowledge conflicts with them, follow them and mention the difference. If a term isn’t covered and you aren’t confident about it, say so instead of guessing. Never invent sources.";

export const learnerLine = (g: Graph) => {
  const p = g.profile, bits = [p.name && `${p.name}.`, p.about, p.interests && `Interests: ${p.interests}.`].filter(Boolean);
  return bits.length ? `THE LEARNER: ${bits.join(" ")}` : "THE LEARNER: no profile yet; keep examples general and everyday.";
};
export const exampleSource = (g: Graph) => g.profile.examples || g.profile.interests || "everyday life and work";

export function glossaryText(g: Graph) {
  const lines = g.glossary.map((x) => `- ${x.term}: ${x.definition}`);
  g.concepts.filter((n) => n.userDef).forEach((n) => lines.push(`- ${n.label.en} (learner’s definition): ${n.userDef}`));
  return lines.length ? lines.join("\n") : "(none yet)";
}

export function conceptContext(g: Graph, n: Concept) {
  const byId = (id: string) => g.concepts.find((c) => c.id === id);
  const conns = g.links
    .filter((l) => l.status === "approved" && (l.from === n.id || l.to === n.id))
    .map((l) => `- ${byId(l.from)?.label.en} ${TYPES[l.type].say.en} ${byId(l.to)?.label.en}`);
  const dn = (k: string) => g.domains.find((d) => d.key === k)?.name.en;
  return `CONCEPT: ${n.label.en} (Indonesian: ${n.label.id || "none yet"})
DOMAINS: ${n.domains.map(dn).join(", ")}
SUMMARY: ${n.summary.en}
LEARNER’S OWN DEFINITION (authoritative): ${n.userDef || "none"}
SOURCES THE LEARNER READ:
${n.sources.map((s) => `- ${s.title}: ${s.note}`).join("\n") || "- none"}
CONNECTED CONCEPTS:
${conns.join("\n") || "- none"}
VERIFIED GLOSSARY (authoritative):
${glossaryText(g)}`;
}

export function langLine(lang: Lang) {
  return { en: "Write in English.", id: "Write in Indonesian (Bahasa Indonesia), natural and professional." }[lang];
}

export function vocabPrompt(g: Graph, n: Concept) {
  return `${RULES}\n\n${conceptContext(g, n)}\n\nEXISTING TERMS: ${n.vocab.map((v) => v.en).join(", ") || "none"}\n\nSuggest 3 more professional terms or phrases a learner should know for this concept, each with the natural Indonesian equivalent that Indonesian professionals actually use (keep the English loanword in brackets if that’s how it’s used), and one short example sentence in Indonesian. Don’t repeat existing terms.\nReply with only JSON: {"vocab":[{"en":"","id":"","ex":""}]}`;
}

export function mcqPrompt(g: Graph, n: Concept, b: Concept | null) {
  return `${RULES}\n\n${conceptContext(g, n)}\n${b ? `\nBRIDGE CONCEPT: ${b.label.en}: ${b.summary.en}${b.userDef ? ` (learner’s definition: ${b.userDef})` : ""}\n` : ""}\nAVOID REPEATING: ${n.quiz.map((x) => x.q.en).join(" | ")}\n\nWrite one multiple-choice question that tests understanding, not memorized wording${b ? `, and that requires connecting “${n.label.en}” with “${b.label.en}”` : ""}. Prefer a realistic scenario. Exactly 4 options, one correct, plausible distractors. Give English and natural Indonesian versions of everything.\nReply with only JSON: {"q_en":"","q_id":"","options":[{"en":"","id":""},{"en":"","id":""},{"en":"","id":""},{"en":"","id":""}],"answer":0,"why_en":"","why_id":""}`;
}

export function essayQuestionPrompt(g: Graph, n: Concept) {
  return `${RULES}\n\n${conceptContext(g, n)}\n\nWrite one open essay question that checks whether the learner truly understands this concept: ask them to explain why or how, or to apply it to a realistic situation, not just to define it. Also write a short grading rubric of 3 to 5 key points a good answer must contain, based only on the information above.\nReply with only JSON: {"q_en":"","q_id":"","rubric":[""]}`;
}

export function essayGradePrompt(g: Graph, n: Concept, q: { en: string }, rubric: string[], ans: string, conf: Confidence) {
  const listLang = g.prefs.lang === "id" ? "Indonesian" : "English";
  return `${RULES}\n\n${conceptContext(g, n)}\n\nESSAY QUESTION: ${q.en}\nRUBRIC:\n${rubric.map((x) => "- " + x).join("\n")}\nLEARNER’S ANSWER (may be in English or Indonesian):\n"""${ans}"""\nLEARNER’S SELF-RATED CONFIDENCE: ${CONF.find((c) => c.k === conf)!.en}\n\nGrade the answer fairly. Reward correct understanding in the learner’s own words; do not reward length or fancy wording. Check each rubric point. Name any misconceptions explicitly. If the answer relies on a term you don’t know and that isn’t in the glossary, list it in unknown_terms instead of marking it wrong. Write got, missing and misconceptions in ${listLang}.\nReply with only JSON: {"score":0,"verdict":"understood|partial|not_yet","got":[""],"missing":[""],"misconceptions":[""],"feedback_en":"","feedback_id":"","model_answer_en":"","model_answer_id":"","unknown_terms":[""]}`;
}

export function discussSystem(g: Graph, n: Concept) {
  return `${RULES}\n${learnerLine(g)}\n\n${conceptContext(g, n)}\n\nYou are discussing this concept with the learner. Keep answers under 160 words, use one concrete example from the learner’s interests (${exampleSource(g)}), and end with one short question that checks their understanding. When you introduce a key term, give it in English and Indonesian once, like “reach (jangkauan)”. ${langLine(g.prefs.lang)} If the learner uses a term you don’t know and it isn’t in the glossary, ask them to define it instead of guessing.`;
}
export const DISCUSS_ACK = "Understood. I’ll stay grounded in the concept information and the learner’s definitions.";

export function importPrompt(g: Graph, title: string, text: string) {
  return `You build a bilingual (English and Indonesian) concept map for a learner.
EXISTING DOMAINS (key: English / Indonesian):
${g.domains.map((t) => `- ${t.key}: ${t.name.en} / ${t.name.id}`).join("\n")}
EXISTING CONCEPTS (id: English label, domains):
${g.concepts.map((n) => `- ${n.id}: ${n.label.en} [${n.domains.join(",")}]`).join("\n")}
VERIFIED GLOSSARY (authoritative, follow over your own knowledge):
${glossaryText(g)}
SOURCE TITLE: ${title}
SOURCE TEXT:
"""${text.slice(0, 24000)}"""

Task:
1. Extract the 3 to 7 most important concepts in the source.
2. If a concept is the same idea as an existing concept, set existing_id to that id instead of creating a duplicate.
3. Give each concept 1 or 2 domains. Reuse existing domain keys when they fit; otherwise add a new domain (short lowercase key, English and Indonesian names).
4. Write summaries only from the source text and the glossary. Don’t add facts the source doesn’t support.
5. Add 2 vocabulary pairs per concept: the English term, the Indonesian equivalent professionals actually use, and a short Indonesian example sentence.
6. Propose links between concepts (new or existing) with type prerequisite, part_of, causes, contrasts, example_of or related, each with a one-sentence reason grounded in the source, in English and Indonesian. Prefer links that connect different domains when the source supports them.
7. List any terms in the source you aren’t confident you understand in unknown_terms.
8. For each concept, copy into quote one short sentence from the source text, word for word, that best supports it.
Reply with only JSON:
{"new_domains":[{"key":"","en":"","id":""}],"concepts":[{"key":"","existing_id":null,"label_en":"","label_id":"","summary_en":"","summary_id":"","domains":[""],"source_note":"","quote":"","vocab":[{"en":"","id":"","ex":""}]}],"links":[{"from":"","to":"","type":"","why_en":"","why_id":""}],"unknown_terms":[""]}`;
}

/** The map-wide assistant: knows every concept, can point at them and propose actions. */
export function assistantSystem(g: Graph, opts: { mentioned: Concept[]; selected: Concept | null; passages: { title: string; page: number | null; text: string }[]; due: Concept[] }) {
  const dn = (k: string) => g.domains.find((d) => d.key === k)?.name.en || k;
  const byId = (id: string) => g.concepts.find((c) => c.id === id);
  const list = g.concepts.map((c) => `- ${c.id} | ${c.label.en} / ${c.label.id} | ${c.domains.map(dn).join(", ")} | ${c.mastery}%${c.miscon ? " | misconception" : ""}`).join("\n");
  const links = g.links.filter((l) => l.status === "approved").map((l) => `- ${l.from} ${l.type} ${l.to}`).join("\n");
  const focus = [...(opts.selected ? [opts.selected] : []), ...opts.mentioned.filter((m) => m.id !== opts.selected?.id)];
  return `${learnerLine(g)}
You are the assistant inside Neuron, the learner’s personal knowledge map. You help them navigate the map, plan what to study, explain and connect concepts, and quiz them. The learner’s own definitions and the verified glossary are authoritative. If something isn’t in the map or the passages and you aren’t sure, say so. Never invent sources.

ALL CONCEPTS (id | English / Indonesian | domains | mastery):
${list || "(none)"}

APPROVED LINKS (from type to):
${links || "(none)"}

DUE FOR REVIEW: ${opts.due.slice(0, 8).map((c) => c.id).join(", ") || "nothing"}

VERIFIED GLOSSARY (authoritative):
${glossaryText(g)}
${focus.length ? `\nCONCEPTS THE LEARNER IS ASKING ABOUT:\n${focus.map((c) => conceptContext(g, c)).join("\n\n")}\n` : ""}${opts.passages.length ? `\nRELEVANT PASSAGES FROM THE LEARNER’S SOURCES:\n${opts.passages.map((p) => `[${p.title}${p.page ? `, p. ${p.page}` : ""}] ${p.text.slice(0, 900)}`).join("\n\n")}\n` : ""}
How to answer:
- ${langLine(g.prefs.lang)} Keep it under 180 words unless asked for more. Use one concrete example when explaining, from the learner’s interests (${exampleSource(g)}).
- When you mention a concept from the map, write its id in double brackets, like [[${g.concepts[0]?.id || "algorithm"}]]. Only use ids from the list above.
- When you cite a passage, name the source title (and page if given).
- If a useful next step exists, add up to 3 action lines at the very end, each on its own line, exactly in this form:
ACTION: {"type":"open","id":"<concept id>"}
Allowed types: open (show the concept), test (quiz on it), discuss (discuss it), path (its learning order), filter (show one domain: {"type":"filter","domain":"<domain key>"}), link (suggest a new link the learner can approve: {"type":"link","from":"<id>","to":"<id>","link":"prerequisite|part_of|causes|contrasts|example_of|related","why":"<one sentence>"}), glossary (only when the learner asks you to save a term: {"type":"glossary","term":"","definition":""}).
Domain keys: ${g.domains.map((d) => `${d.key} (${d.name.en})`).join(", ")}.
- Don’t describe the action lines in your text; the app turns them into buttons.`;
}

/* ---------- study a source ---------- */
const studyLang = (lang: "en" | "id") => (lang === "id" ? "Write everything in Indonesian (natural, not stiff; keep common English technical terms)." : "Write everything in English.");

/** One understanding question per passage, grounded only in that passage. */
export function studyQuestionsPrompt(g: Graph, lang: "en" | "id", passages: { chunkId: number; text: string; concepts: string[] }[]) {
  const label = (id: string) => g.concepts.find((c) => c.id === id)?.label.en || id;
  return `${RULES}
${learnerLine(g)}

VERIFIED GLOSSARY (authoritative):
${glossaryText(g)}

You are writing the questions that appear inside a reader, right after each passage, so the learner reads actively.
For EACH passage below write exactly one multiple-choice question that:
- can be answered from that passage alone (never from outside knowledge);
- tests understanding (why, what follows, which example fits, what would change), not memorised wording or trivia like numbers and names;
- has 4 options of similar length; the wrong options are plausible misreadings of the passage, not jokes;
- comes with a one or two sentence "why" that points back to what the passage says.
If a passage has no idea worth testing (a heading, a reference list, a table of contents), skip it.
${studyLang(lang)}

PASSAGES:
${passages.map((p) => `[chunk ${p.chunkId}]${p.concepts.length ? ` (concepts: ${p.concepts.map((c) => `${c} = ${label(c)}`).join(", ")})` : ""}\n"""${p.text.slice(0, 2400)}"""`).join("\n\n")}

Reply with JSON only:
{"items":[{"chunk_id":<number from the passage tag>,"concept_id":"<one of that passage's concept ids, or null>","question":"…","options":["…","…","…","…"],"answer":<0-3>,"why":"…"}]}`;
}

export const STUDY_MODES = {
  simple: "Rewrite the passage so a curious 15-year-old understands it on first read: short sentences, everyday words, one idea per sentence. Define any technical term in plain words the first time. Keep every fact, number and claim; add nothing that isn't in the passage.",
  interest: "Rewrite the passage around the learner's interests: replace or add the examples and analogies with ones from those interests, so the idea connects to something they already know. Keep every fact, number and claim from the passage exactly. Wrap each sentence you changed or added for the learner in ==double equals== so they can see what was personalised.",
  deeper: "Go one level deeper than the passage: explain the mechanism behind it (why it works), one consequence or edge case, and how it connects to related concepts on the learner's map if any are listed. Use an equation in $…$ or a small ```mermaid flowchart only if it really helps. Keep what the passage says as the base; mark anything beyond the passage with 'Beyond the text:' at the start of that paragraph.",
} as const;

export function studyAdaptPrompt(g: Graph, lang: "en" | "id", mode: keyof typeof STUDY_MODES, text: string, concepts: string[]) {
  const ctx = concepts.map((id) => g.concepts.find((c) => c.id === id)).filter(Boolean).map((c) => `- ${c!.label.en}: ${c!.userDef ? `learner's definition: ${c!.userDef}` : c!.summary.en}`).join("\n");
  return `${RULES}
${learnerLine(g)}
${mode === "interest" ? `LEARNER'S INTERESTS TO DRAW EXAMPLES FROM: ${exampleSource(g)}\n` : ""}${ctx ? `CONCEPTS THIS PASSAGE IS ABOUT:\n${ctx}\n` : ""}
TASK: ${STUDY_MODES[mode]}
${studyLang(lang)} Use Markdown (short paragraphs, **bold** for the key idea). No headings. About the same length as the passage${mode === "deeper" ? ", up to twice as long" : ""}.

PASSAGE:
"""${text.slice(0, 3000)}"""

Reply with the rewritten passage only.`;
}

/* ---------- claims and fact-checking ---------- */
type Passage = { chunkId: number; title: string; page: number | null; text: string };
const passageBlock = (ps: Passage[]) => ps.map((p) => `[chunk ${p.chunkId}] ${p.title}${p.page ? `, p. ${p.page}` : ""}\n"""${p.text.slice(0, 2400)}"""`).join("\n\n");

/** The key claims of a concept, each with the reasons behind it, taken only from its source passages. */
export function claimsPrompt(g: Graph, n: Concept, lang: "en" | "id", passages: Passage[], notes: string[]) {
  return `${RULES}

${conceptContext(g, n)}

SOURCE PASSAGES FOR THIS CONCEPT:
${passages.length ? passageBlock(passages) : "(none)"}
${notes.length ? `\nSOURCE NOTES (no full passage stored):\n${notes.map((x) => `- ${x}`).join("\n")}\n` : ""}
Write the 2 to 5 most important claims these sources make about "${n.label.en}". Each claim:
- is one standalone sentence someone could agree or disagree with (not a topic, not a question);
- comes only from the passages above, never from your own knowledge;
- has "because": the 1 to 3 reasons or evidence the passage gives for it, each a short sentence (empty if the passage just asserts it);
- has "quote": one sentence copied word for word from the passage that supports it, and the chunk number it came from.
Prefer claims that explain how or why over plain definitions. ${lang === "id" ? "Write the claims and reasons in Indonesian; keep the quote in the passage's original language." : "Write in English; keep the quote in the passage's original language."}

Reply with JSON only: {"claims":[{"text":"…","because":["…"],"quote":"…","chunk_id":<number or null>}]}`;
}

/** Check each claim against its passage, the learner's definition and the glossary. */
export function checkClaimsPrompt(g: Graph, n: Concept, claims: { id: number; text: string; because: string[]; quote: string | null; chunkId: number | null }[], passages: Passage[], lang: "en" | "id") {
  return `${RULES}

CONCEPT: ${n.label.en}
${n.userDef ? `LEARNER'S DEFINITION (authoritative): ${n.userDef}\n` : ""}VERIFIED GLOSSARY (authoritative):
${glossaryText(g)}

SOURCE PASSAGES:
${passages.length ? passageBlock(passages) : "(none)"}

CLAIMS TO CHECK:
${claims.map((c) => `#${c.id}: ${c.text}${c.because.length ? `\n   because: ${c.because.join(" / ")}` : ""}${c.quote ? `\n   quoted: "${c.quote}"${c.chunkId ? ` [chunk ${c.chunkId}]` : ""}` : ""}`).join("\n")}

For each claim decide, from the passages first:
- "supported": the passage clearly says this, and the reasons match what it says;
- "partly": part is supported, but it overstates, drops a condition, or a reason isn't in the passage;
- "unsupported": the passages don't say this (it may still be true, but it isn't grounded);
- "contradicted": the passages, the learner's definition or the glossary say otherwise.
Then, separately, if a claim is grounded but conflicts with well-established knowledge, set "doubt" to one short sentence saying why (otherwise null). Don't invent sources.
"note": one short sentence explaining the verdict (what's missing or wrong, or where it's supported). ${lang === "id" ? "Write notes in Indonesian." : "Write notes in English."}

Reply with JSON only: {"results":[{"id":<claim number>,"status":"supported|partly|unsupported|contradicted","note":"…","doubt":null}]}`;
}
