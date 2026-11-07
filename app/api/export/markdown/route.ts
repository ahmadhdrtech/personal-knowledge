import * as R from "@/lib/repo";
import { buildMarkdownVault } from "@/lib/export-md";
import { makeZip } from "@/lib/zip";

export const dynamic = "force-dynamic";

/** The whole map as a zip of linked Markdown notes (an Obsidian-style vault). */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("lang");
  const lang = q === "id" || q === "en" ? q : R.getGraph().prefs.lang;
  const files = buildMarkdownVault(lang);
  const stamp = new Date().toISOString().slice(0, 10);
  const prefixed = Object.fromEntries(Object.entries(files).map(([p, c]) => [`neuron-${stamp}/${p}`, c]));
  const zip = makeZip(prefixed);
  return new Response(zip as unknown as BodyInit, {
    headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="neuron-notes-${stamp}.zip"`, "content-length": String(zip.length) },
  });
}
