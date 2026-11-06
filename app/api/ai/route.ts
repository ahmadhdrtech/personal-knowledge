import * as R from "@/lib/repo";
import { st } from "@/lib/i18n";
import { indexAfterImport, nearestConcepts } from "@/lib/search";
import { body, fail, ok } from "@/lib/http";
import { AIError, capDepth, generateJson } from "@/lib/ai/generate";
import * as P from "@/lib/ai/prompts";
import type { Bi, Confidence, Depth } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const str = (v: unknown, f = "") => (v == null ? f : String(v));
const list = (v: unknown) => (Array.isArray(v) ? v : []).map(String).filter(Boolean);

export async function POST(req: Request) {
  const b = await body(req);
  const g = R.getGraph();
  const depth: Depth = g.prefs.depth;
  const signal = req.signal;
  try {
    switch (b.task) {
      /* ---------- add source ---------- */
      case "import": {
        const title = str(b.title).trim() || st("Untitled source", "Sumber tanpa judul");
        const text = str(b.text).trim();
        if (text.split(/\s+/).length < 25) throw new Error(st("Paste at least a paragraph so there’s something to learn from.", "Tempel minimal satu paragraf supaya ada yang bisa dipelajari."));
        const forModel = text.replace(/\f/g, "\n\n");
        const r = await generateJson({ messages: [{ role: "user", content: P.importPrompt(g, title, forModel) }], depth, signal, feature: "import", maxTokens: 8000 });
        if (!r || !Array.isArray(r.concepts)) throw new AIError("invalid_json");
        // smarter merging: a new concept that means the same as an existing one joins it
        const similar: { label: string; into: string; score: number }[] = [];
        const close: { label: string; near: string; score: number }[] = [];
        try {
          const fresh = r.concepts.filter((c: any) => c && c.label_en && !c.existing_id && !g.concepts.some((x) => x.label.en.toLowerCase() === String(c.label_en).toLowerCase()));
          const near = await nearestConcepts(fresh.map((c: any) => `${c.label_en}${c.label_id ? ` (${c.label_id})` : ""}. ${c.summary_en || ""}`), signal);
          fresh.forEach((c: any, i: number) => {
            const n = near[i];
            if (n && n.score >= 0.9) { c.existing_id = n.id; similar.push({ label: String(c.label_en), into: n.id, score: Math.round(n.score * 100) / 100 }); }
            else if (n && n.score >= 0.8) close.push({ label: String(c.label_en), near: n.id, score: n.score });
          });
        } catch { /* search model missing or offline: fall back to the AI's own matching */ }
        const report = R.applyImport(title, text, r, {
          kind: str(b.kind, "text"), urlOrPath: b.urlOrPath ? str(b.urlOrPath) : null,
          sourceId: b.sourceId ? Number(b.sourceId) : null, pageStart: Number(b.pageStart) || 1, paged: !!b.paged,
        }, similar);
        // close but not the same: suggest a link instead of merging
        const after = R.getGraph();
        for (const c of close) {
          const id = after.concepts.find((x) => x.label.en.toLowerCase() === c.label.toLowerCase())?.id;
          const other = after.concepts.find((x) => x.id === c.near);
          if (id && other) {
            const lid = R.addLink(id, other.id, "related", "suggested", { en: `Very close in meaning to “${other.label.en}” (similarity ${c.score.toFixed(2)}).`, id: `Maknanya sangat dekat dengan “${other.label.id || other.label.en}” (kemiripan ${c.score.toFixed(2)}).` }, report.sourceId);
            if (lid) R.addToLastImport(lid);
          }
        }
        await indexAfterImport(report.sourceId);
        return ok({ graph: R.getGraph(), report: R.getSetting("last_import", report) });
      }

      /* ---------- vocab ---------- */
      case "vocab": {
        const n = need(g, b.conceptId);
        const r = await generateJson({ messages: [{ role: "user", content: P.vocabPrompt(g, n) }], depth: capDepth(depth, "balanced"), signal, feature: "vocab", conceptId: n.id });
        const items = (Array.isArray(r?.vocab) ? r.vocab : []).filter((v: any) => v && v.en && v.id).slice(0, 3).map((v: any) => ({ en: str(v.en), ind: str(v.id), ex: str(v.ex) }));
        if (!items.length) throw new AIError("invalid_json");
        R.addVocab(n.id, items);
        return ok({ graph: R.getGraph() });
      }

      /* ---------- multiple choice / bridge ---------- */
      case "mcq": {
        const n = need(g, b.conceptId);
        let bridge = null;
        if (b.bridge) {
          const nb = g.links.filter((l) => l.from === n.id || l.to === n.id).map((l) => (l.from === n.id ? l.to : l.from));
          const pick = nb[Math.floor(Math.random() * nb.length)];
          bridge = g.concepts.find((c) => c.id === pick) || null;
        }
        const r = await generateJson({ messages: [{ role: "user", content: P.mcqPrompt(g, n, bridge) }], depth, signal, feature: bridge ? "bridge_question" : "mcq", conceptId: n.id });
        if (!r || !Array.isArray(r.options) || r.options.length !== 4 || !(r.answer >= 0 && r.answer < 4)) throw new AIError("invalid_json");
        const qid = R.addMcq(n.id, {
          q: { en: str(r.q_en), id: str(r.q_id, str(r.q_en)) },
          o: r.options.map((o: any) => ({ en: str(o.en), id: str(o.id, str(o.en)) })),
          a: Number(r.answer),
          why: { en: str(r.why_en), id: str(r.why_id, str(r.why_en)) },
        }, bridge ? bridge.id : null);
        return ok({ graph: R.getGraph(), qid });
      }

      /* ---------- essay ---------- */
      case "essayQuestion": {
        const n = need(g, b.conceptId);
        const r = await generateJson({ messages: [{ role: "user", content: P.essayQuestionPrompt(g, n) }], depth: depth === "quick" ? "quick" : "balanced", signal, feature: "essay_question", conceptId: n.id });
        if (!r || !r.q_en) throw new AIError("invalid_json");
        return ok({ question: { q: { en: str(r.q_en), id: str(r.q_id, str(r.q_en)) } as Bi, rubric: list(r.rubric) } });
      }
      case "essayGrade": {
        const n = need(g, b.conceptId);
        const ans = str(b.answer).trim();
        const conf = (["guess", "fair", "sure"].includes(b.confidence) ? b.confidence : "fair") as Confidence;
        if (ans.split(/\s+/).length < 8) throw new Error(st("Write at least a couple of sentences before submitting.", "Tulis minimal beberapa kalimat sebelum mengirim."));
        const q = b.question as { q: Bi; rubric: string[] };
        const r = await generateJson({ messages: [{ role: "user", content: P.essayGradePrompt(g, n, q.q, q.rubric || [], ans, conf) }], depth, signal, feature: "essay_grade", conceptId: n.id });
        if (!r || typeof r.score !== "number") throw new AIError("invalid_json");
        const res = {
          score: Math.max(0, Math.min(100, Math.round(r.score))),
          verdict: str(r.verdict, "partial"),
          got: list(r.got), missing: list(r.missing), misconceptions: list(r.misconceptions),
          feedback_en: str(r.feedback_en), feedback_id: str(r.feedback_id, str(r.feedback_en)),
          model_answer_en: str(r.model_answer_en), model_answer_id: str(r.model_answer_id, str(r.model_answer_en)),
          unknown_terms: list(r.unknown_terms),
        };
        const { delta, mastery, nextReview } = R.recordEssay(n.id, q, ans, conf, res);
        return ok({ graph: R.getGraph(), result: res, delta, mastery, nextReview });
      }
      default:
        throw new Error(`Unknown task: ${b.task}`);
    }
  } catch (e) {
    return fail(e);
  }
}

function need(g: ReturnType<typeof R.getGraph>, id: string) {
  const n = g.concepts.find((c) => c.id === id);
  if (!n) throw new Error(st("Concept not found", "Konsep tidak ditemukan"));
  return n;
}
