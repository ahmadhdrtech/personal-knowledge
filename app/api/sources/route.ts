import * as R from "@/lib/repo";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const chunk = sp.get("chunk");
  if (chunk) {
    const c = R.getChunk(Number(chunk));
    return c ? ok(c) : fail(new Error("Passage not found"), 404);
  }
  const id = sp.get("id");
  if (id) {
    const s = R.getSource(Number(id));
    return s ? ok(s) : fail(new Error("Source not found"), 404);
  }
  return ok(R.listSources());
}

export async function DELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  R.deleteSource(id);
  return ok(R.listSources());
}
