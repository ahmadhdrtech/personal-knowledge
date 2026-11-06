import * as R from "@/lib/repo";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(R.recentAttempts(40));
}
