import * as R from "@/lib/repo";
import { body, fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({ lessons: R.listLessons() });
}

export async function POST(req: Request) {
  const b = await body(req);
  try {
    const id = Number(b.id);
    if (!id) throw new Error("Missing lesson id");
    if (b.action === "answer") {
      const l = R.getLesson(id), i = Number(b.step);
      const s = l?.steps[i];
      if (!s?.check?.options || typeof s.check.answer_index !== "number") throw new Error("This step has no multiple-choice check");
      if (!["guess", "fair", "sure"].includes(b.confidence)) throw new Error("Pick how sure you are");
      const choice = Number(b.choice), correct = choice === s.check.answer_index;
      const r = R.answerLessonCheck(id, i, { correct, confidence: b.confidence, answer: s.check.options[choice], by: "app" });
      return ok({ lessons: R.listLessons(), correct, mastery: r.mastery ? { delta: r.mastery.delta, now: r.mastery.mastery } : null });
    }
    if (b.action === "delete") { R.deleteLesson(id); return ok({ lessons: R.listLessons() }); }
    if (b.action === "current") { const l = R.getLesson(id); if (l) { l.current = Math.max(0, Math.min(l.steps.length - 1, Number(b.step) || 0)); R.saveLesson(l); } return ok({ lessons: R.listLessons() }); }
    throw new Error(`Unknown action: ${b.action}`);
  } catch (e) { return fail(e); }
}
