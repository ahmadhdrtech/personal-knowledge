import { body, fail, ok } from "@/lib/http";
import { extractFile, extractUrl } from "@/lib/extract";
import { st } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_MB = 40;

/** Upload a file (multipart "file") or send { url } as JSON. Returns the plain text to import. */
export async function POST(req: Request) {
  try {
    const type = req.headers.get("content-type") || "";
    if (type.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) throw new Error(st("Choose a file first.", "Pilih file dulu."));
      if (file.size > MAX_MB * 1024 * 1024) throw new Error(st(`That file is over ${MAX_MB} MB.`, `File itu lebih dari ${MAX_MB} MB.`));
      return ok(await extractFile(file.name, Buffer.from(await file.arrayBuffer())));
    }
    const b = await body(req);
    return ok(await extractUrl(String(b.url || "").trim()));
  } catch (e) {
    return fail(e);
  }
}
