import * as C from "@/lib/ai/config";
import { getTiers } from "@/lib/repo";
import { body, fail, ok } from "@/lib/http";
import { generate } from "@/lib/ai/generate";
import { fetchCatalog } from "@/lib/ai/catalog";

export const dynamic = "force-dynamic";

const state = () => ({ providers: C.listProviders(), models: C.listModels(), tiers: getTiers(), kinds: C.PROVIDER_KINDS });

export async function GET() {
  return ok(state());
}

export async function POST(req: Request) {
  const b = await body(req);
  try {
    switch (b.action) {
      case "saveProvider": C.saveProvider(b.provider); return ok(state());
      case "deleteProvider": C.deleteProvider(Number(b.id)); return ok(state());
      case "saveModel": C.saveModel(b.model); return ok(state());
      case "deleteModel": C.deleteModel(Number(b.id)); return ok(state());
      case "setTiers": C.setTiers(b.tiers || {}); return ok(state());
      case "catalog": return ok({ models: await fetchCatalog(Number(b.providerId)) });
      case "test": {
        const started = Date.now();
        const text = await generate({
          messages: [{ role: "user", content: "Reply with exactly: OK, siap. Then name the model you are in under 8 words." }],
          depth: "quick", modelRowId: Number(b.id), feature: "test", maxTokens: 60, signal: req.signal,
        });
        return ok({ text, ms: Date.now() - started });
      }
      default: throw new Error(`Unknown action: ${b.action}`);
    }
  } catch (e) {
    return fail(e);
  }
}
