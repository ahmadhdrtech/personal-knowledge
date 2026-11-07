import * as R from "@/lib/repo";
import * as P from "@/lib/ai/prompts";
import { generate, generateJson, capDepth, AIError } from "@/lib/ai/generate";
import { body, fail, ok } from "@/lib/http";
import type { StudyMode } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const langOf = (v: unknown, fallback: "en" | "id") => (v === "id" || v === "en" ? v : fallback);

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams, g = R.getGraph();
  const id = Number(sp.get("source"));
  if (!id) return ok({ sources: R.listSources().filter((s) => s.chunks > 0), progress: R.studySummaries() });
  const s = R.getStudy(id, langOf(sp.get("lang"), g.prefs.lang));
  return s ? ok(s) : fail(new Error("Source not found"), 404);
}

export async function POST(req: Request) {
  const b = await body(req), g = R.getGraph();
  const lang = langOf(b.lang, g.prefs.lang), sourceId = Number(b.sourceId);
  try {
    switch (b.action) {
      case "generate": {
        // questions for the next passages that don't have one yet (or the ones asked for), a few per call to keep each call small
        const st = R.getStudy(sourceId, lang); if (!st) throw new Error("Source not found");
        const want = Array.isArray(b.chunkIds) && b.chunkIds.length ? new Set(b.chunkIds.map(Number)) : null;
        const todo = st.passages.filter((p) => (want ? want.has(p.chunkId) : !p.items.length) && p.text.trim().split(/\s+/).length >= 25).slice(0, Math.max(1, Math.min(6, Number(b.max) || 4)));
        if (!todo.length) return ok({ study: st, added: 0 });
        if (want) todo.forEach((p) => R.deleteStudyItems(sourceId, p.chunkId));
        const r = await generateJson<{ items: any[] }>({ messages: [{ role: "user", content: P.studyQuestionsPrompt(g, lang, todo.map((p) => ({ chunkId: p.chunkId, text: p.text, concepts: p.concepts }))) }], depth: capDepth(g.prefs.depth, "balanced"), signal: req.signal, feature: "study_questions", maxTokens: 3000 });
        if (!r || !Array.isArray(r.items)) throw new AIError("invalid_json");
        const added = R.addStudyItems(sourceId, lang, r.items.map((x) => ({ chunkId: Number(x.chunk_id), conceptId: x.concept_id ? String(x.concept_id) : null, question: String(x.question || ""), options: Array.isArray(x.options) ? x.options.map(String) : [], answer: Number(x.answer), why: x.why ? String(x.why) : null })), "app");
        return ok({ study: R.getStudy(sourceId, lang), added, left: st.passages.filter((p) => !p.items.length).length - todo.length });
      }
      case "adapt": {
        const mode = String(b.mode) as Exclude<StudyMode, "original">;
        if (!(mode in P.STUDY_MODES)) throw new Error("Unknown mode");
        const st = R.getStudy(sourceId, lang); if (!st) throw new Error("Source not found");
        const p = st.passages.find((x) => x.chunkId === Number(b.chunkId)); if (!p) throw new Error("Passage not found");
        const text = (await generate({ messages: [{ role: "user", content: P.studyAdaptPrompt(g, lang, mode as keyof typeof P.STUDY_MODES, p.text, p.concepts) }], depth: capDepth(g.prefs.depth, "balanced"), signal: req.signal, feature: `study_${mode}`, maxTokens: 2000 })).trim();
        if (!text) throw new AIError("invalid_json");
        R.saveStudyAdapt(sourceId, p.chunkId, mode, lang, text, "app");
        return ok({ study: R.getStudy(sourceId, lang) });
      }
      case "answer": {
        if (!["guess", "fair", "sure"].includes(b.confidence)) throw new Error("Pick how sure you are");
        const r = R.answerStudyItem(Number(b.itemId), Number(b.choice), b.confidence);
        return ok({ study: R.getStudy(sourceId, lang), correct: r.correct, mastery: r.mastery ? { delta: r.mastery.delta, now: r.mastery.mastery } : null });
      }
      case "pos": R.setStudyPos(sourceId, Number(b.pos) || 0); return ok({});
      case "reset": R.resetStudy(sourceId); return ok({ study: R.getStudy(sourceId, lang) });
      default: throw new Error(`Unknown action: ${b.action}`);
    }
  } catch (e) { return fail(e); }
}
