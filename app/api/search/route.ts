import { body, fail, ok } from "@/lib/http";
import { indexStatus, indexStep, search } from "@/lib/search";
import { setSetting } from "@/lib/repo";
import { embed } from "@/lib/ai/embed";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** GET ?q=… searches concepts and passages (by meaning when a search model is set). */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  try {
    if (indexStatus().modelRowId) { try { await indexStep(32, req.signal); } catch { /* search what is indexed */ } }
    return ok(await search(q, 8, req.signal));
  } catch (e) {
    return fail(e);
  }
}

/** POST { action: "status" | "step" | "setModel" | "test" } manages the search index. */
export async function POST(req: Request) {
  const b = await body(req);
  try {
    switch (b.action) {
      case "status": return ok(indexStatus());
      case "setModel": setSetting("embed_model", b.modelRowId ? Number(b.modelRowId) : null); return ok(indexStatus());
      case "step": return ok(await indexStep(96, req.signal));
      case "test": { const started = Date.now(); const r = await embed(["Neuron search test"], "test", req.signal); return ok({ dims: r.vectors[0].length, ms: Date.now() - started }); }
      default: throw new Error("Unknown action");
    }
  } catch (e) {
    return fail(e);
  }
}
