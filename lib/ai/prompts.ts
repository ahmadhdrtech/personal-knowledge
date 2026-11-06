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
