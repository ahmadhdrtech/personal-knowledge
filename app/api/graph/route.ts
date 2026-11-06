import * as R from "@/lib/repo";
import { body, fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(R.getGraph());
}

/** All map edits go through here and return the updated graph. */
export async function POST(req: Request) {
  const b = await body(req);
  try {
    let result: unknown = undefined;
    switch (b.action) {
      case "setDefinition": R.setDefinition(b.id, b.definition ?? null); break;
      case "addVocab": R.addVocab(b.id, b.items || []); break;
      case "deleteVocab": R.deleteVocab(Number(b.vid)); break;
      case "decideLink": R.decideLink(Number(b.lid), !!b.ok); break;
      case "approveLinks": R.approveLinks((b.lids || []).map(Number)); break;
      case "addLink": result = R.addLink(b.from, b.to, b.type, "approved", null); break;
      case "suggestLink": result = R.addLink(b.from, b.to, b.type, "suggested", b.why ? { en: String(b.why), id: String(b.why) } : null); break;
      case "glossaryUpsert": R.upsertGlossary(String(b.term || ""), String(b.definition || "")); break;
      case "glossaryDelete": R.deleteGlossary(String(b.term)); break;
      case "prefs": R.setPrefs(b.prefs || {}); break;
      case "profile": R.setProfile(b.profile || {}); break;
      case "blog": R.setBlog(b.blog || {}); break;
      case "dismissImport": R.dismissImport(); break;
      case "offlineDemo": result = R.applyOffline(); break;
      case "resetDemo": R.resetDemo(); break;
      case "clearMap": R.clearMap(); break;
      case "deleteQuestion": R.deleteQuestion(Number(b.qid)); break;
      case "answerMcq": result = R.answerMcq(b.id, Number(b.qid), Number(b.choice), b.confidence); break;
      default: return fail(new Error(`Unknown action: ${b.action}`));
    }
    return ok({ graph: R.getGraph(), result });
  } catch (e) {
    return fail(e);
  }
}
