import * as R from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = JSON.stringify(R.exportAll(), null, 2);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(data, {
    headers: { "content-type": "application/json", "content-disposition": `attachment; filename="neuron-backup-${stamp}.json"` },
  });
}
