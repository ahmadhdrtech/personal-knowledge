// Neuron MCP server: lets Claude Desktop (on your Claude subscription) read and update your map.
// Speaks the Model Context Protocol over stdio (one JSON-RPC message per line). No extra packages.
// Build: bun run mcp:build  →  mcp/dist/neuron-mcp.mjs (that file is what Claude Desktop runs).
import * as R from "../lib/repo";
import { due, upcoming, TYPES, LINK_TYPES, chainBack, level } from "../lib/logic";
import { TEACH_STEPS, FORMAT_GUIDE } from "../lib/lesson-guide";
import { indexAfterImport, search } from "../lib/search";
import type { Concept, Confidence, Graph, LinkType, Writing, Lesson, LessonStep, ProbeItem } from "../lib/types";
import { BRIEF, GROUPS, TECHNIQUES, KINDS, WORKFLOW, BLOG_STEPS, blogPreset } from "../lib/writing-guide";
import { PLATFORMS, formatRules } from "../lib/blog";

const SERVER = { name: "neuron", version: "0.7.0" };
const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS = `Neuron is the user's personal knowledge map: concepts from what they read, linked across topics, with mastery scores, spaced review and a glossary. The user is Indonesian and learns in English and Indonesian; reply in the language they use. neuron_overview tells you who they are (name, background, interests): take your examples from their interests.
- The user's own definitions and glossary terms are the source of truth. Prefer them over your own knowledge and say when they differ.
- Start with neuron_overview to see domains and what's due. Use neuron_read_concept before explaining or quizzing a concept.
- To quiz: ask one question at a time, ask how sure they are (guess, fair, sure), then call neuron_record_result. Never record a result the user didn't give.
- To add something they read: read it, extract 3 to 7 concepts yourself (reuse existing ids and domain keys from neuron_list_concepts), then call neuron_add_source. Summaries must come only from the text.
- Links you create are suggestions; the user approves them in the app. Ask before changing definitions.
- To write anything for the user (essay, post, script, email, report...): call neuron_writing_guide first and ask its rhetorical-situation brief (who is speaking, audience, genre, purpose, stance, context, culture, then optional craft questions), each with how-to-answer guidance and examples. Don't write before the core answers are in unless the user says so. Then offer neuron_save_writing.
- When the user wants to learn or understand something ("teach me", "I want to understand…", "explain … so I really get it"): run a lesson. Call neuron_lesson_start and follow its steps: probe what they know, plan, then teach one step at a time with a prediction, a clear explanation (mermaid flowcharts, LaTeX equations, svg figures, tables where they help) and a check. Save every step with neuron_lesson_step so the lesson appears in the app.
- To turn their research into a blog post: follow the steps from neuron_writing_guide with preset 'blog' (start with neuron_research_pack). Their Settings prefill most of the brief; confirm it with them instead of asking everything again.
- When the user asks to save, input or keep the result of a discussion: draft a note (summary, key points, their conclusions, open questions, next steps, concepts), show it, and call neuron_save_discussion after they approve. Keep what the user said apart from what you suggested. Then offer to save their definitions, new terms or new concepts with the other tools.`;

/* ---------------- helpers ---------------- */
let cache: Graph | null = null;
const graph = () => (cache = R.getGraph());
function find(g: Graph, q: unknown): Concept {
  const s = String(q ?? "").trim().toLowerCase();
  const c = g.concepts.find((x) => x.id === s) || g.concepts.find((x) => x.label.en.toLowerCase() === s || x.label.id.toLowerCase() === s)
    || g.concepts.find((x) => x.label.en.toLowerCase().includes(s) || x.label.id.toLowerCase().includes(s));
  if (!c) throw new Error(`No concept matches "${q}". Use neuron_list_concepts to see ids.`);
  return c;
}
const dname = (g: Graph, k: string) => g.domains.find((d) => d.key === k)?.name.en || k;
const brief = (g: Graph, c: Concept) => ({ id: c.id, label_en: c.label.en, label_id: c.label.id, domains: c.domains.map((k) => dname(g, k)), mastery: c.mastery, misconception: c.miscon, due_for_review: c.miscon || (c.review ? c.review.due <= Date.now() : c.mastery < 60) });
const iso = (t: number | null | undefined) => (t ? new Date(t).toISOString() : null);
const CONF = ["guess", "fair", "sure"];
function conceptIds(list: unknown) {
  const g = graph(), ids: string[] = [], unknown: string[] = [];
  for (const x of Array.isArray(list) ? list : []) { try { ids.push(find(g, x).id); } catch { unknown.push(String(x)); } }
  return { ids, unknown };
}

/* ---------------- tools ---------------- */
type Tool = { name: string; description: string; inputSchema: Record<string, unknown>; annotations?: Record<string, unknown>; run: (a: any) => Promise<unknown> | unknown };
const str = { type: "string" };
const TOOLS: Tool[] = [
  {
    name: "neuron_overview", description: "Summary of the map: domains, counts, mastery, what's due for review, weakest concepts, confidence calibration and the glossary size.",
    inputSchema: { type: "object", properties: {} }, annotations: { readOnlyHint: true },
    run: () => {
      const g = graph(), d = due(g.concepts), k = g.calibration;
      return {
        concepts: g.concepts.length, domains: g.domains.map((x) => ({ key: x.key, en: x.name.en, id: x.name.id, concepts: g.concepts.filter((c) => c.domains.includes(x.key)).length })),
        average_mastery: g.concepts.length ? Math.round(g.concepts.reduce((s, c) => s + c.mastery, 0) / g.concepts.length) : 0,
        due_now: d.slice(0, 10).map((c) => brief(g, c)), due_count: d.length,
        coming_up: upcoming(g.concepts).slice(0, 5).map((c) => ({ id: c.id, label: c.label.en, due: iso(c.review?.due) })),
        misconceptions: g.concepts.filter((c) => c.miscon).map((c) => c.id),
        calibration: { certain_answers: k.sure.n, certain_right_pct: k.sure.n ? Math.round((k.sure.right / k.sure.n) * 100) : null },
        suggested_links_waiting: g.links.filter((l) => l.status === "suggested").length, glossary_terms: g.glossary.length, language: g.prefs.lang,
        learner: g.profile.name || g.profile.about ? g.profile : "No profile yet (Settings → About you)", blog: { platform: PLATFORMS[g.blog.platform].name.en, name: g.blog.name || null, url: g.blog.url || null, language: g.blog.lang }, saved_writing: R.listWritings().length,
      };
    },
  },
  {
    name: "neuron_list_concepts", description: "List concepts with id, labels, domains and mastery. Filter by domain key, text, or only those due for review.",
    inputSchema: { type: "object", properties: { domain: { ...str, description: "Domain key" }, query: { ...str, description: "Words to match in the labels" }, due_only: { type: "boolean" } } }, annotations: { readOnlyHint: true },
    run: (a) => {
      const g = graph(), q = String(a.query || "").toLowerCase();
      let list = g.concepts;
      if (a.domain) list = list.filter((c) => c.domains.includes(String(a.domain)));
      if (q) list = list.filter((c) => `${c.id} ${c.label.en} ${c.label.id}`.toLowerCase().includes(q));
      if (a.due_only) { const d = new Set(due(g.concepts).map((c) => c.id)); list = list.filter((c) => d.has(c.id)); }
      return { count: list.length, concepts: list.map((c) => brief(g, c)), domain_keys: g.domains.map((d) => d.key) };
    },
  },
  {
    name: "neuron_read_concept", description: "Everything about one concept: summaries in English and Indonesian, the user's definition (authoritative), sources with quotes, terms, links, mastery, review schedule and stored quiz questions.",
    inputSchema: { type: "object", properties: { concept: { ...str, description: "Concept id or label" } }, required: ["concept"] }, annotations: { readOnlyHint: true },
    run: (a) => {
      const g = graph(), c = find(g, a.concept), lab = (id: string) => g.concepts.find((x) => x.id === id)?.label.en || id;
      return {
        ...brief(g, c), summary_en: c.summary.en, summary_id: c.summary.id, user_definition: c.userDef,
        sources: c.sources.map((s) => ({ title: s.title, note: s.note, quote: s.quote, page: s.page })),
        terms: c.vocab.map((v) => ({ en: v.en, id: v.ind, example: v.ex })),
        links: g.links.filter((l) => l.from === c.id || l.to === c.id).map((l) => ({ text: `${lab(l.from)} ${TYPES[l.type].say.en} ${lab(l.to)}`, from: l.from, to: l.to, type: l.type, status: l.status })),
        review: c.review ? { next: iso(c.review.due), reviews: c.review.reps, forgotten: c.review.lapses, memory_strength_days: c.review.stability } : null,
        questions: c.quiz.map((q) => ({ question: q.q.en, question_id: q.q.id, options: q.o.map((o) => o.en), answer_index: q.a, why: q.why.en })),
        glossary: g.glossary,
      };
    },
  },
  {
    name: "neuron_search", description: "Search concepts and source passages. Uses meaning when the app has a search model set, otherwise word matching.",
    inputSchema: { type: "object", properties: { query: str }, required: ["query"] }, annotations: { readOnlyHint: true },
    run: async (a) => {
      const g = graph(), r = await search(String(a.query), 8);
      return { by_meaning: r.semantic, concepts: r.concepts.map((h) => ({ ...brief(g, find(g, h.id)), score: Math.round(h.score * 100) / 100 })), passages: r.passages.map((p) => ({ source: p.sourceTitle, page: p.page, text: (p.text || "").slice(0, 700) })) };
    },
  },
  {
    name: "neuron_record_result", description: "Record the user's answer to a question you asked, with how sure they were. Updates mastery, misconception flag and the spaced-review schedule exactly like the app. kind 'quiz' needs correct; kind 'essay' needs score 0-100.",
    inputSchema: { type: "object", properties: { concept: str, kind: { type: "string", enum: ["quiz", "essay"] }, correct: { type: "boolean" }, score: { type: "number" }, confidence: { type: "string", enum: CONF }, note: { ...str, description: "Short note: the question and their answer" } }, required: ["concept", "kind", "confidence"] },
    run: (a) => {
      const g = graph(), c = find(g, a.concept);
      if (!CONF.includes(a.confidence)) throw new Error("confidence must be guess, fair or sure");
      if (a.kind === "quiz" && typeof a.correct !== "boolean") throw new Error("quiz results need correct: true or false");
      if (a.kind === "essay" && typeof a.score !== "number") throw new Error("essay results need a score from 0 to 100");
      const r = R.recordExternal(c.id, { kind: a.kind, correct: a.correct, score: a.score, confidence: a.confidence as Confidence, note: a.note ? String(a.note).slice(0, 300) : undefined });
      return { concept: c.label.en, right: r.right, mastery_change: r.delta, mastery_now: r.mastery, next_review: iso(r.nextReview) };
    },
  },
  {
    name: "neuron_set_definition", description: "Save the user's own definition of a concept (it becomes the source of truth for all AI in the app). Only call when the user gave or approved the wording. Empty text removes it.",
    inputSchema: { type: "object", properties: { concept: str, definition: str }, required: ["concept", "definition"] },
    run: (a) => { const g = graph(), c = find(g, a.concept); R.setDefinition(c.id, String(a.definition)); return { saved: true, concept: c.label.en }; },
  },
  {
    name: "neuron_add_glossary", description: "Add or update a glossary term the user defined. Glossary terms are treated as authoritative everywhere in the app.",
    inputSchema: { type: "object", properties: { term: str, definition: str }, required: ["term", "definition"] },
    run: (a) => { R.upsertGlossary(String(a.term), String(a.definition)); return { saved: true }; },
  },
  {
    name: "neuron_suggest_link", description: "Suggest a link between two concepts. It appears as a blue dashed suggestion the user approves or rejects in the app.",
    inputSchema: { type: "object", properties: { from: str, to: str, type: { type: "string", enum: LINK_TYPES }, why_en: str, why_id: str }, required: ["from", "to", "type", "why_en"] },
    run: (a) => {
      const g = graph(), f = find(g, a.from), t = find(g, a.to);
      if (!LINK_TYPES.includes(a.type)) throw new Error(`type must be one of ${LINK_TYPES.join(", ")}`);
      const lid = R.addLink(f.id, t.id, a.type as LinkType, "suggested", { en: String(a.why_en), id: String(a.why_id || a.why_en) });
      return lid ? { suggested: `${f.label.en} ${TYPES[a.type as LinkType].say.en} ${t.label.en}` } : { suggested: false, reason: "These two are already linked." };
    },
  },
  {
    name: "neuron_add_question", description: "Store a multiple-choice question (exactly 4 options) on a concept so the user can practise it in the app. Give Indonesian versions when you can.",
    inputSchema: { type: "object", properties: { concept: str, question_en: str, question_id: str, options_en: { type: "array", items: str, minItems: 4, maxItems: 4 }, options_id: { type: "array", items: str }, answer_index: { type: "integer", minimum: 0, maximum: 3 }, why_en: str, why_id: str }, required: ["concept", "question_en", "options_en", "answer_index", "why_en"] },
    run: (a) => {
      const g = graph(), c = find(g, a.concept);
      if (!Array.isArray(a.options_en) || a.options_en.length !== 4) throw new Error("Give exactly 4 options");
      const oid = Array.isArray(a.options_id) && a.options_id.length === 4 ? a.options_id : a.options_en;
      const qid = R.addMcq(c.id, { q: { en: String(a.question_en), id: String(a.question_id || a.question_en) }, o: a.options_en.map((o: string, i: number) => ({ en: String(o), id: String(oid[i]) })), a: Number(a.answer_index), why: { en: String(a.why_en), id: String(a.why_id || a.why_en) } }, null);
      return { saved: true, question_id: qid };
    },
  },
  {
    name: "neuron_add_source", description: "Add something the user read, with the concepts YOU extracted from it (no API cost in the app). Reuse existing concept ids (existing_id) and domain keys; new concepts are merged automatically when the label matches. Links are added as suggestions.",
    inputSchema: {
      type: "object", required: ["title", "text", "concepts"],
      properties: {
        title: str, text: { ...str, description: "The source text (or the part the concepts come from)" },
        new_domains: { type: "array", items: { type: "object", properties: { key: str, en: str, id: str }, required: ["key", "en", "id"] } },
        concepts: { type: "array", items: { type: "object", required: ["label_en", "summary_en", "domains"], properties: {
          key: { ...str, description: "Short key you use in links" }, existing_id: { ...str, description: "Id of an existing concept that is the same idea" },
          label_en: str, label_id: str, summary_en: str, summary_id: str, domains: { type: "array", items: str, description: "Domain keys" },
          source_note: str, quote: { ...str, description: "One sentence copied word for word from the text" },
          vocab: { type: "array", items: { type: "object", properties: { en: str, id: str, ex: str } } },
        } } },
        links: { type: "array", items: { type: "object", required: ["from", "to", "type"], properties: { from: str, to: str, type: { type: "string", enum: LINK_TYPES }, why_en: str, why_id: str } } },
        unknown_terms: { type: "array", items: str },
      },
    },
    run: async (a) => {
      const text = String(a.text || "").trim();
      if (text.split(/\s+/).length < 10) throw new Error("Include the source text (at least a few sentences).");
      const report = R.applyImport(String(a.title || "Untitled source"), text, { new_domains: a.new_domains, concepts: a.concepts, links: a.links, unknown_terms: a.unknown_terms }, { kind: "text" });
      await indexAfterImport(report.sourceId);
      return { added: report.added, merged: report.merged, new_domains: report.domains, suggested_links: report.links.length, note: "Shown in the app as the latest import; the user approves the links there." };
    },
  },
  {
    name: "neuron_lesson_start", description: "Start a 'Teach me' lesson toward a learning goal. Returns the lesson id, what the learner's map already has on the goal (concepts with mastery and their prerequisites), the learner profile, the teaching method to follow and the format guide for diagrams and equations. Call it first whenever the user wants to learn or understand something.",
    inputSchema: { type: "object", properties: { goal: { ...str, description: "What the learner wants to understand or be able to do, in their words" }, lang: { type: "string", enum: ["en", "id"] } }, required: ["goal"] },
    run: async (a) => {
      const g = graph(), goal = String(a.goal).trim();
      if (!goal) throw new Error("Give the learning goal.");
      const id = R.createLesson(goal, a.lang || g.prefs.lang);
      const r = await search(goal, 6);
      const hits = r.concepts.map((h) => g.concepts.find((c) => c.id === h.id)).filter(Boolean) as Concept[];
      const lab = (cid: string) => g.concepts.find((x) => x.id === cid)?.label.en || cid;
      const lvl = (c: Concept) => level(c.mastery);
      return {
        lesson_id: id, goal, learner: g.profile,
        on_the_map: hits.map((c) => ({ id: c.id, label: c.label.en, mastery: c.mastery, level: lvl(c), misconception: c.miscon, user_definition: c.userDef || null, summary: c.summary.en,
          needs_first: chainBack(g.links, c.id).map((p) => ({ id: p.id, label: lab(p.id), mastery: g.concepts.find((x) => x.id === p.id)?.mastery ?? null })) })),
        passages: r.passages.slice(0, 4).map((p) => ({ source: p.sourceTitle, page: p.page, text: (p.text || "").slice(0, 600) })),
        glossary: g.glossary,
        steps: TEACH_STEPS, format: FORMAT_GUIDE,
        note: hits.length ? "Start with the probe. Their own definitions win over your knowledge." : "Nothing on the map matches yet: probe from scratch, and offer to add the new ideas to the map at the end.",
      };
    },
  },
  {
    name: "neuron_lesson_plan", description: "Save what the probe found and the lesson plan (ordered steps from the gaps to the goal). Call after probing, before teaching. Can be called again to change the plan.",
    inputSchema: {
      type: "object", required: ["lesson_id", "start_summary", "steps"],
      properties: {
        lesson_id: { type: "integer" }, start_summary: { ...str, description: "2-3 sentences: what they already understand, what's missing, any misconception" },
        probe: { type: "array", items: { type: "object", required: ["question", "answer", "verdict"], properties: { concept: str, question: str, answer: { ...str, description: "What the learner said, briefly" }, verdict: { type: "string", enum: ["knows", "partly", "gap", "misconception"] }, confidence: { type: "string", enum: CONF }, note: str } } },
        steps: { type: "array", minItems: 1, maxItems: 12, items: { type: "object", required: ["title"], properties: { title: str, concept: { ...str, description: "Existing concept id or label, if the step is about one" }, why: { ...str, description: "Why this step comes here" } } } },
      },
    },
    run: (a) => {
      const l: Lesson | null = R.getLesson(Number(a.lesson_id));
      if (!l) throw new Error(`No lesson ${a.lesson_id}. Start one with neuron_lesson_start.`);
      const g = graph();
      const cid = (x: unknown) => { if (!x) return null; try { return find(g, x).id; } catch { return null; } };
      const old = new Map(l.steps.map((s) => [s.title, s]));
      l.steps = (a.steps as any[]).map((s): LessonStep => old.get(String(s.title)) || { title: String(s.title).slice(0, 160), concept: cid(s.concept), why: s.why ? String(s.why) : undefined, status: "todo" });
      l.startSummary = String(a.start_summary);
      if (Array.isArray(a.probe)) l.probe = a.probe.map((p: any): ProbeItem => ({ concept: cid(p.concept), question: String(p.question), answer: String(p.answer), verdict: p.verdict, confidence: CONF.includes(p.confidence) ? p.confidence : null, note: p.note ? String(p.note) : undefined }));
      l.status = "active"; l.current = Math.min(l.current, l.steps.length - 1);
      R.saveLesson(l);
      return { saved: true, lesson_id: l.id, steps: l.steps.map((s, i) => ({ step: i + 1, title: s.title, concept: s.concept })), note: "Now teach step 1: predict, explain, check, then neuron_lesson_step." };
    },
  },
  {
    name: "neuron_lesson_step", description: "Save one taught step: the prediction question and the learner's guess, the explanation exactly as shown (Markdown with ```mermaid flowcharts, $LaTeX$ math, ```svg figures, tables), the check question, and the learner's result. Saving a result also updates mastery and spaced review for the step's concept. Call once per step, or again to add the result after they answer.",
    inputSchema: {
      type: "object", required: ["lesson_id", "step"],
      properties: {
        lesson_id: { type: "integer" }, step: { type: "integer", minimum: 1, description: "Step number, starting at 1" },
        predict: { ...str, description: "The question you asked before explaining" }, prediction: { ...str, description: "What the learner guessed" },
        explanation: { ...str, description: "The explanation in Markdown, including diagrams and math" },
        check: { type: "object", required: ["question"], properties: { question: str, options: { type: "array", items: str, maxItems: 6 }, answer_index: { type: "integer", minimum: 0 }, why: str } },
        result: { type: "object", required: ["correct", "confidence"], properties: { correct: { type: "boolean" }, confidence: { type: "string", enum: CONF }, answer: { ...str, description: "What the learner answered" }, misconception: { ...str, description: "The confusion behind a wrong answer, in one sentence" }, feedback: str } },
      },
    },
    run: (a) => {
      const l: Lesson | null = R.getLesson(Number(a.lesson_id));
      if (!l) throw new Error(`No lesson ${a.lesson_id}.`);
      const i = Number(a.step) - 1, s = l.steps[i];
      if (!s) throw new Error(`Lesson ${l.id} has ${l.steps.length} steps; there is no step ${a.step}. Use neuron_lesson_plan to change the plan.`);
      if (a.predict) s.predict = String(a.predict);
      if (a.prediction) s.prediction = String(a.prediction);
      if (a.explanation) s.explanation = String(a.explanation);
      if (a.check?.question) s.check = { question: String(a.check.question), ...(Array.isArray(a.check.options) ? { options: a.check.options.map(String) } : {}), ...(typeof a.check.answer_index === "number" ? { answer_index: a.check.answer_index } : {}), ...(a.check.why ? { why: String(a.check.why) } : {}) };
      if (s.status === "todo") s.status = "teaching";
      l.current = Math.max(l.current, i);
      R.saveLesson(l);
      let mastery = null;
      if (a.result && typeof a.result.correct === "boolean") {
        if (!CONF.includes(a.result.confidence)) throw new Error("result.confidence must be guess, fair or sure");
        const r = R.answerLessonCheck(l.id, i, { correct: a.result.correct, confidence: a.result.confidence, answer: a.result.answer ? String(a.result.answer) : undefined, misconception: a.result.misconception ? String(a.result.misconception) : undefined, feedback: a.result.feedback ? String(a.result.feedback) : undefined, by: "claude" });
        mastery = r.mastery ? { concept: s.concept, change: r.mastery.delta, now: r.mastery.mastery } : null;
      }
      const fresh = R.getLesson(l.id)!;
      return { saved: true, step: i + 1, of: fresh.steps.length, status: fresh.steps[i].status, mastery, next_step: fresh.current + 1, note: fresh.steps[i].status === "needs_review" ? "Wrong answer saved. Give the smallest hint, let them retry, then save the new result." : "Saved. It's visible in Neuron → Lessons." };
    },
  },
  {
    name: "neuron_lesson_finish", description: "Close a lesson with a summary of what the learner now understands, what's still shaky, and next steps.",
    inputSchema: { type: "object", required: ["lesson_id", "summary"], properties: { lesson_id: { type: "integer" }, summary: str, next: { type: "array", items: str, maxItems: 5 } } },
    run: (a) => {
      const l: Lesson | null = R.getLesson(Number(a.lesson_id));
      if (!l) throw new Error(`No lesson ${a.lesson_id}.`);
      l.summary = String(a.summary); l.next = Array.isArray(a.next) ? a.next.map(String) : []; l.status = "done";
      R.saveLesson(l);
      return { saved: true, passed: l.steps.filter((s) => s.status === "passed").length, steps: l.steps.length };
    },
  },
  {
    name: "neuron_lesson_get", description: "Read a lesson (or list lessons if no id) so you can continue where it stopped.",
    inputSchema: { type: "object", properties: { lesson_id: { type: "integer" } } }, annotations: { readOnlyHint: true },
    run: (a) => {
      if (!a.lesson_id) return { lessons: R.listLessons().slice(0, 20).map((l) => ({ id: l.id, goal: l.goal, status: l.status, progress: `${l.steps.filter((s) => s.status === "passed").length}/${l.steps.length}`, updated: iso(l.updatedAt) })) };
      const l = R.getLesson(Number(a.lesson_id));
      if (!l) throw new Error(`No lesson ${a.lesson_id}.`);
      return { ...l, steps: l.steps.map((s, i) => ({ step: i + 1, ...s, explanation: s.explanation ? s.explanation.slice(0, 1500) : undefined })), format: FORMAT_GUIDE, method: TEACH_STEPS };
    },
  },
  {
    name: "neuron_research_pack", description: "Gather everything the user's Neuron has on a topic, ready to write from: matching concepts with their definitions, summaries, sources and quotes, the links between them, relevant source passages, glossary terms and saved notes. Use it first when turning research into a blog post or essay.",
    inputSchema: { type: "object", properties: { topic: { ...str, description: "The topic or question" }, max_concepts: { type: "integer", minimum: 1, maximum: 15 } }, required: ["topic"] }, annotations: { readOnlyHint: true },
    run: async (a) => {
      const g = graph(), topic = String(a.topic), max = Math.min(15, Number(a.max_concepts) || 8);
      const r = await search(topic, max);
      const found = r.concepts.map((h) => g.concepts.find((c) => c.id === h.id)).filter(Boolean) as Concept[];
      const ids = new Set(found.map((c) => c.id));
      const lab = (id: string) => g.concepts.find((x) => x.id === id)?.label.en || id;
      const words = topic.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      const notes = R.listWritings().filter((w) => w.conceptIds.some((id) => ids.has(id)) || words.some((w2) => `${w.title} ${w.body}`.toLowerCase().includes(w2))).slice(0, 6);
      return {
        topic, search_by_meaning: r.semantic,
        concepts: found.map((c) => ({ id: c.id, label: c.label.en, label_id: c.label.id, domains: c.domains.map((k) => dname(g, k)), user_definition: c.userDef || null, summary: c.summary.en, summary_id: c.summary.id, mastery: c.mastery,
          sources: c.sources.map((s) => ({ title: s.title, note: s.note || null, quote: s.quote || null, page: s.page || null })), terms: c.vocab.map((v) => `${v.en} (${v.ind})`) })),
        links: g.links.filter((l) => l.status === "approved" && ids.has(l.from) && ids.has(l.to)).map((l) => `${lab(l.from)} ${TYPES[l.type].say.en} ${lab(l.to)}`),
        passages: r.passages.map((p) => ({ source: p.sourceTitle, page: p.page, text: (p.text || "").slice(0, 900) })),
        glossary: g.glossary.filter((x) => words.some((w) => `${x.term} ${x.definition}`.toLowerCase().includes(w))),
        saved_notes: notes.map((w) => ({ id: w.id, kind: w.kind, title: w.title, text: w.body.slice(0, 1200) })),
        coverage: found.length ? `${found.length} concepts and ${r.passages.length} passages found. Say what is covered and what is missing before writing.` : "Nothing on the map matches yet. Offer to research it, or to add sources first with neuron_add_source.",
        rule: "The user's definitions win. Cite source titles; for facts from outside their map, give a link and say it is new.",
      };
    },
  },
  {
    name: "neuron_writing_guide", description: "Get the rhetorical-situation brief to ask the user BEFORE writing anything for them, with guidance and examples for each question, the writing techniques to choose from, and the steps to follow. Call it first whenever the user asks you to write, draft or rewrite something.",
    inputSchema: { type: "object", properties: { lang: { type: "string", enum: ["en", "id"], description: "Language of the guidance; default is the app language" }, preset: { type: "string", enum: ["blog"], description: "'blog' to prefill the brief from the user's blog settings (research-to-post flow)" } } }, annotations: { readOnlyHint: true },
    run: (a) => {
      const g = graph();
      const L: "en" | "id" = a.lang === "id" || a.lang === "en" ? a.lang : g.prefs.lang === "id" ? "id" : "en";
      const blog = a.preset === "blog";
      return {
        ...(blog ? { blog_steps: BLOG_STEPS, prefilled: blogPreset(g.profile, g.blog), blog_format: formatRules(g.blog), blog: { ...g.blog, platform_name: PLATFORMS[g.blog.platform].name.en, has_slug: PLATFORMS[g.blog.platform].hasSlug, has_tags: PLATFORMS[g.blog.platform].hasTags, excerpt_label: PLATFORMS[g.blog.platform].excerpt.en }, still_ask: ["purpose", "stance", "context", "culture", ...(!g.profile.name && !g.profile.about ? ["originator"] : []), ...(!g.blog.audience ? ["audience"] : [])] } : {}),
        learner: g.profile,
        steps: WORKFLOW,
        brief: (["agents", "conditions", "craft"] as const).map((g) => ({
          group: GROUPS[g][L],
          questions: BRIEF.filter((q) => q.group === g).map((q) => ({ key: q.key, core: q.core, question: q.q[L], why: q.why[L], how_to_answer: q.how[L], examples: q.examples[L], if_user_says_you_choose: q.fallback[L] })),
        })),
        techniques: TECHNIQUES.map((t) => ({ key: t.key, type: KINDS[t.kind][L], name: t.name[L], what: t.what[L], best_for: t.best[L], structure: t.steps[L] })),
        save_with: "neuron_save_writing, passing the answers as brief (keys: " + BRIEF.map((q) => q.key).join(", ") + ")",
      };
    },
  },
  {
    name: "neuron_save_writing", description: "Save a finished piece of writing to the user's Neuron (Writing menu) together with its rhetorical brief. Only call after the user agrees. Pass id to save a revision of an earlier piece.",
    inputSchema: {
      type: "object", required: ["title", "body", "brief"],
      properties: {
        id: { type: "integer", description: "Id of an earlier piece to update" }, title: str, body: { ...str, description: "The full text, in Markdown" },
        brief: { type: "object", description: "The user's answers, one short line each", properties: Object.fromEntries(BRIEF.map((q) => [q.key, { ...str, description: q.q.en }])) },
        concepts: { type: "array", items: str, description: "Ids or labels of concepts it draws on" }, lang: { type: "string", enum: ["en", "id"] },
        post: { type: "object", description: "For a blog post: the extra fields of the blog's admin form", properties: {
          slug: { ...str, description: "lowercase-words-with-hyphens (limit in blog settings)" }, excerpt: { ...str, description: "Summary / subtitle / meta description (limit in blog settings)" },
          tags: { ...str, description: "Comma separated" }, cover_url: { ...str, description: "Optional image URL, ideally 1200x630" },
          sources: { type: "array", items: { type: "object", required: ["title"], properties: { title: str, url: str } } },
        } },
      },
    },
    run: (a) => {
      const { ids, unknown } = conceptIds(a.concepts);
      const title = String(a.title).trim();
      let post = null; const warnings: string[] = [];
      if (a.post && typeof a.post === "object") {
        const b = graph().blog, plat = PLATFORMS[b.platform];
        const slug = R.slugify(String(a.post.slug || title), b.slugMax);
        const excerpt = String(a.post.excerpt || "").trim(), tagList = String(a.post.tags || "").split(",").map((x: string) => x.trim()).filter(Boolean), tags = tagList.join(", ");
        if (title.length > b.titleMax) warnings.push(`Title is ${title.length} characters; this blog's limit is ${b.titleMax}.`);
        if (excerpt.length > b.excerptMax) warnings.push(`${plat.excerpt.en} is ${excerpt.length} characters; the limit is ${b.excerptMax}.`);
        if (plat.hasTags && b.tagsMax > 0 && tagList.length > b.tagsMax) warnings.push(`${tagList.length} tags; this blog takes up to ${b.tagsMax}.`);
        if (!b.allowHtml && /<\/?[a-z][^>]*>/i.test(String(a.body))) warnings.push("The body contains HTML tags; this blog doesn't accept HTML. Use Markdown instead.");
        if ((b.platform === "medium" || b.platform === "substack") && /^\s*\|.*\|\s*$/m.test(String(a.body))) warnings.push(`${plat.name.en} doesn't support tables; turn them into lists.`);
        if (/\]\((?!https?:|mailto:|\/|#)/i.test(String(a.body))) warnings.push("Some links don't start with https://; the blog drops them.");
        const sources = Array.isArray(a.post.sources) ? a.post.sources.map((x: any) => ({ title: String(x.title || ""), ...(x.url ? { url: String(x.url) } : {}) })).filter((x: any) => x.title) : [];
        post = { slug, excerpt, tags, coverUrl: String(a.post.cover_url || "").trim(), sources };
      }
      const id = R.saveWriting({ id: a.id ? Number(a.id) : null, kind: "writing", title: title.slice(0, 200), body: String(a.body), brief: a.brief || {}, conceptIds: ids, lang: a.lang || null, post });
      return { saved: true, id, linked_concepts: ids, ...(post ? { slug: post.slug } : {}), ...(warnings.length ? { fix_these: warnings } : {}), ...(unknown.length ? { not_found: unknown } : {}), note: post ? "It's in Neuron → Writing with a Blog post panel: the user copies each field into their blog editor or downloads a .md file. If fix_these is present, fix it and save again with the same id." : "It's in the Writing menu of the app." };
    },
  },
  {
    name: "neuron_save_discussion", description: "Save the result of a discussion with the user as a note in Neuron (Writing menu, Notes). Draft it first, show it to the user, and call this only after they approve. Only include what was actually discussed.",
    inputSchema: {
      type: "object", required: ["title", "summary", "key_points"],
      properties: {
        id: { type: "integer", description: "Id of an earlier note to update" }, title: str,
        summary: { ...str, description: "2-4 sentences: what was discussed and where it ended" },
        key_points: { type: "array", items: str, description: "The main takeaways" },
        user_conclusions: { type: "array", items: str, description: "What the user decided, believes or said in their own words" },
        open_questions: { type: "array", items: str }, next_steps: { type: "array", items: str },
        concepts: { type: "array", items: str, description: "Ids or labels of concepts the discussion was about" }, lang: { type: "string", enum: ["en", "id"] },
      },
    },
    run: (a) => {
      const id_ = a.lang === "id";
      const sec = (h: [string, string], items: unknown) => Array.isArray(items) && items.length ? `\n## ${id_ ? h[1] : h[0]}\n${items.map((x) => `- ${String(x)}`).join("\n")}\n` : "";
      const body = `${String(a.summary).trim()}\n${sec(["Key points", "Poin utama"], a.key_points)}${sec(["My conclusions", "Kesimpulanku"], a.user_conclusions)}${sec(["Open questions", "Pertanyaan terbuka"], a.open_questions)}${sec(["Next steps", "Langkah berikutnya"], a.next_steps)}`;
      const { ids, unknown } = conceptIds(a.concepts);
      const id = R.saveWriting({ id: a.id ? Number(a.id) : null, kind: "note", title: String(a.title).slice(0, 200), body, conceptIds: ids, lang: a.lang || null });
      return { saved: true, id, linked_concepts: ids, ...(unknown.length ? { not_found: unknown } : {}), note: "It's in the Writing menu, under Notes. Offer to save any definitions, terms or new concepts from the discussion too." };
    },
  },
  {
    name: "neuron_list_writing", description: "List saved writing and discussion notes (newest first). Filter by kind, words, or a concept.",
    inputSchema: { type: "object", properties: { kind: { type: "string", enum: ["writing", "note"] }, query: str, concept: str } }, annotations: { readOnlyHint: true },
    run: (a) => {
      const c = a.concept ? find(graph(), a.concept).id : undefined;
      const list = R.listWritings({ kind: a.kind, query: a.query ? String(a.query) : undefined, concept: c });
      return { count: list.length, items: list.slice(0, 50).map((w) => ({ id: w.id, kind: w.kind, title: w.title, genre: w.brief.genre || null, updated: iso(w.updatedAt), preview: w.body.slice(0, 160) })) };
    },
  },
  {
    name: "neuron_read_writing", description: "Read one saved piece or note in full, with its brief, so you can revise it or continue the discussion.",
    inputSchema: { type: "object", properties: { id: { type: "integer" } }, required: ["id"] }, annotations: { readOnlyHint: true },
    run: (a) => {
      const w: Writing | null = R.getWriting(Number(a.id));
      if (!w) throw new Error(`No saved writing with id ${a.id}. Use neuron_list_writing.`);
      return { ...w, created: iso(w.createdAt), updated: iso(w.updatedAt) };
    },
  },
];

/* ---------------- prompts (shown in Claude Desktop's + menu) ---------------- */
type Prompt = { name: string; title: string; description: string; arguments: { name: string; description: string; required?: boolean }[]; text: (a: Record<string, string>) => string };
const PROMPTS: Prompt[] = [
  {
    name: "write", title: "Write with Neuron", description: "Write something after going through the rhetorical-situation brief (audience, genre, purpose, stance, context, culture...).",
    arguments: [{ name: "topic", description: "What to write about", required: true }, { name: "genre", description: "Optional: essay, LinkedIn post, TikTok script, email..." }],
    text: (a) => `I want to write about: ${a.topic || "(ask me)"}${a.genre ? `\nGenre: ${a.genre}` : ""}\n\nUse Neuron: call neuron_writing_guide, look for related concepts on my map, then ask me the brief with guidance and examples for each question before you write anything. Fill in what I've already told you and ask me to confirm it.`,
  },
  {
    name: "teach", title: "Teach me", description: "A lesson toward a goal: Claude checks what you already know, plans the steps, then teaches one at a time with flowcharts, equations and figures, and saves your progress.",
    arguments: [{ name: "goal", description: "What you want to understand", required: true }],
    text: (a) => `Teach me: ${a.goal || "(ask me what I want to learn)"}\n\nRun a Neuron lesson: call neuron_lesson_start with this goal and follow its steps. Probe what I already know first (one question at a time), show me the plan, then teach one step at a time: let me predict, explain with flowcharts, equations, tables or figures where they help, check me, and save each step with neuron_lesson_step.`,
  },
  {
    name: "continue_lesson", title: "Continue a lesson", description: "Pick up the last unfinished lesson where it stopped.",
    arguments: [{ name: "lesson_id", description: "Optional: which lesson" }],
    text: (a) => `Continue my Neuron lesson${a.lesson_id ? ` #${a.lesson_id}` : ""}: call neuron_lesson_get${a.lesson_id ? "" : " (no id, to list them) and pick the most recent unfinished one"}, briefly recap where I am, then teach the next step the same way.`,
  },
  {
    name: "blog_post", title: "Blog post from my research", description: "Turn what your Neuron map has on a topic into a post for your blog, with title, slug, summary, tags and sources.",
    arguments: [{ name: "topic", description: "What the post is about", required: true }],
    text: (a) => `I want a blog post about: ${a.topic || "(ask me)"}\n\nUse my Neuron research: call neuron_research_pack for this topic, then neuron_writing_guide with preset "blog", and follow its blog_steps. Show me what my map covers and what's missing first, confirm the prefilled brief with me, and ask only the open questions, each with guidance and examples. Don't write before I approve the outline.`,
  },
  {
    name: "save_discussion", title: "Save this discussion", description: "Turn the discussion so far into a note in Neuron.",
    arguments: [],
    text: () => "Save the result of our discussion to Neuron. Draft the note first (title, summary, key points, my conclusions, open questions, next steps, related concepts on my map), show it to me, and save it with neuron_save_discussion once I approve. Then tell me which definitions, terms or new concepts could also go into my map.",
  },
  {
    name: "analyze_text", title: "Read a text critically", description: "Analyze a text's rhetorical situation: agents, conditions, organization and verbal/nonverbal elements.",
    arguments: [{ name: "text", description: "The text, or where it's from", required: true }],
    text: (a) => `Read this text critically and rhetorically:\n\n${a.text || "(I'll paste it)"}\n\nUsing the brief in neuron_writing_guide as a lens, identify: the originator and the audience (real or anticipated), genre and its conventions, purpose, stance, context, culture, the pattern of organization and how ideas relate, and how verbal and nonverbal elements work together. Then say why it works or fails for its purpose, and what is new, different or weak in it. End with 2 questions to test my understanding.`,
  },
];

/* ---------------- JSON-RPC over stdio ---------------- */
const send = (msg: unknown) => process.stdout.write(JSON.stringify(msg) + "\n");
const reply = (id: unknown, result: unknown) => send({ jsonrpc: "2.0", id, result });
const error = (id: unknown, code: number, message: string) => send({ jsonrpc: "2.0", id, error: { code, message } });

async function handle(msg: any) {
  const { id, method, params } = msg || {};
  if (id === undefined || id === null) return; // notification (e.g. notifications/initialized)
  try {
    switch (method) {
      case "initialize": {
        const v = SUPPORTED.includes(params?.protocolVersion) ? params.protocolVersion : SUPPORTED[0];
        return reply(id, { protocolVersion: v, capabilities: { tools: { listChanged: false }, prompts: { listChanged: false } }, serverInfo: SERVER, instructions: INSTRUCTIONS });
      }
      case "ping": return reply(id, {});
      case "tools/list": return reply(id, { tools: TOOLS.map(({ run, ...t }) => t) });
      case "tools/call": {
        const tool = TOOLS.find((t) => t.name === params?.name);
        if (!tool) return error(id, -32602, `Unknown tool: ${params?.name}`);
        try {
          const out = await tool.run(params?.arguments || {});
          return reply(id, { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] });
        } catch (e) {
          return reply(id, { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true });
        }
      }
      case "resources/list": return reply(id, { resources: [] });
      case "prompts/list": return reply(id, { prompts: PROMPTS.map(({ text, ...p }) => p) });
      case "prompts/get": {
        const p = PROMPTS.find((x) => x.name === params?.name);
        if (!p) return error(id, -32602, `Unknown prompt: ${params?.name}`);
        return reply(id, { description: p.description, messages: [{ role: "user", content: { type: "text", text: p.text(params?.arguments || {}) } }] });
      }
      default: return error(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    return error(id, -32603, (e as Error).message);
  }
}

let buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk: string) => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { error(null, -32700, "Parse error"); continue; }
    const p = handle(msg); pending.add(p); p.finally(() => pending.delete(p));
  }
});
const pending = new Set<Promise<unknown>>();
process.stdin.on("end", async () => { await Promise.allSettled([...pending]); process.exit(0); });
// logs must go to stderr; stdout is the protocol
console.error(`[neuron-mcp] ready, database: ${process.env.NEURON_DATA_DIR}`);
