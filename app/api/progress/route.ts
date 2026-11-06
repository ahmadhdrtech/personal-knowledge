import * as R from "@/lib/repo";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const days = Math.max(7, Math.min(365, Number(new URL(req.url).searchParams.get("days")) || 30));
  return ok(R.progress(days));
}
