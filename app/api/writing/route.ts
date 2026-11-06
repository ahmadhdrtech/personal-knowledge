import * as R from "@/lib/repo";
import { body, fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({ items: R.listWritings() });
}

export async function POST(req: Request) {
  const b = await body(req);
  try {
    const id = Number(b.id);
    if (!id) throw new Error("Missing id");
    if (b.action === "update") R.updateWritingText(id, String(b.title || "").trim() || "Untitled", String(b.body || ""), b.post || null);
    else if (b.action === "delete") R.deleteWriting(id);
    else throw new Error(`Unknown action: ${b.action}`);
    return ok({ items: R.listWritings() });
  } catch (e) { return fail(e); }
}
