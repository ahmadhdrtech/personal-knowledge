import { body, fail, ok } from "@/lib/http";
import { clearUsage, usageSummary } from "@/lib/ai/usage";
import { setBudget } from "@/lib/ai/config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const days = Number(new URL(req.url).searchParams.get("days") ?? 30);
  return ok(usageSummary(Number.isFinite(days) ? days : 30));
}

export async function POST(req: Request) {
  const b = await body(req);
  try {
    if (b.action === "setBudget") setBudget({ monthlyUsd: b.monthlyUsd, block: b.block });
    else if (b.action === "clear") clearUsage();
    else throw new Error("Unknown action");
    return ok(usageSummary(Number(b.days ?? 30)));
  } catch (e) {
    return fail(e);
  }
}
