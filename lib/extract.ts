// Turns an uploaded file or a web page into plain text. Pages are separated by \f (form feed).
import { st } from "./i18n";

export interface Extracted { title: string; text: string; kind: "pdf" | "docx" | "text" | "url"; pages: number; urlOrPath: string | null }

const clean = (s: string) => s.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
const baseName = (n: string) => n.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();

export async function extractFile(name: string, buf: Buffer): Promise<Extracted> {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return extractPdf(buf, baseName(name), name);
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ buffer: buf });
    return { title: baseName(name), text: clean(r.value), kind: "docx", pages: 1, urlOrPath: name };
  }
  if (["txt", "md", "markdown", "csv", "srt", "vtt"].includes(ext)) {
    let t = buf.toString("utf8");
    if (ext === "srt" || ext === "vtt") t = t.replace(/^WEBVTT.*$/m, "").replace(/^\d+\s*$/gm, "").replace(/^[\d:.,\s->]+$/gm, "").replace(/<[^>]+>/g, "");
    return { title: baseName(name), text: clean(t), kind: "text", pages: 1, urlOrPath: name };
  }
  if (ext === "doc") throw new Error(st("Old .doc files aren't supported. Save it as .docx or PDF first.", "File .doc lama belum didukung. Simpan dulu sebagai .docx atau PDF."));
  throw new Error(st(`Can't read .${ext} files. Use PDF, Word (.docx), .txt, .md or subtitle files (.srt, .vtt).`, `File .${ext} belum bisa dibaca. Pakai PDF, Word (.docx), .txt, .md atau subtitle (.srt, .vtt).`));
}

async function extractPdf(buf: Buffer, title: string, path: string | null): Promise<Extracted> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  const pages = (text as string[]).map((p) => clean(p));
  const joined = pages.join("\f");
  if (joined.replace(/\f/g, "").trim().length < 40) throw new Error(st("This PDF has almost no text. It may be scanned images; run it through OCR first.", "PDF ini hampir tidak berisi teks. Mungkin isinya gambar hasil scan; jalankan OCR dulu."));
  let t = title;
  try { const meta = await pdf.getMetadata(); const mt = (meta?.info as any)?.Title; if (mt && String(mt).trim().length > 3) t = String(mt).trim(); } catch { /* no metadata */ }
  return { title: t, text: joined, kind: "pdf", pages: totalPages, urlOrPath: path };
}

const decode = (s: string) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

export async function extractUrl(url: string): Promise<Extracted> {
  let u: URL;
  try { u = new URL(url); } catch { throw new Error(st("That doesn't look like a web address.", "Itu sepertinya bukan alamat web.")); }
  if (!/^https?:$/.test(u.protocol)) throw new Error(st("Only http and https links work.", "Hanya tautan http dan https yang bisa."));
  let res: Response;
  try {
    res = await fetch(u, { headers: { "user-agent": "Mozilla/5.0 (Neuron personal knowledge app)", accept: "text/html,application/pdf;q=0.9,*/*;q=0.8" }, signal: AbortSignal.timeout(25_000), redirect: "follow" });
  } catch { throw new Error(st("Couldn't open that page. Check the link and your connection.", "Halaman itu tidak bisa dibuka. Periksa tautan dan koneksi.")); }
  if (!res.ok) throw new Error(st(`The site answered with an error (HTTP ${res.status}). Some sites block apps; copy the text and paste it instead.`, `Situsnya membalas error (HTTP ${res.status}). Beberapa situs memblokir aplikasi; salin teksnya lalu tempel.`));
  const type = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());
  if (type.includes("pdf") || u.pathname.toLowerCase().endsWith(".pdf")) {
    const r = await extractPdf(buf, decodeURIComponent(u.pathname.split("/").pop() || u.hostname).replace(/\.pdf$/i, ""), url);
    return { ...r, kind: "url" };
  }
  const html = buf.toString("utf8");
  const title = decode((html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || u.hostname).trim());
  let body = html.match(/<article[\s\S]*?<\/article>/i)?.[0] || html.match(/<main[\s\S]*?<\/main>/i)?.[0] || html.match(/<body[\s\S]*?<\/body>/i)?.[0] || html;
  body = body.replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|iframe|button)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/blockquote|\/section)[^>]*>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ");
  const text = clean(decode(body)).split("\n").map((l) => l.trim()).filter((l, i, a) => l || a[i - 1]).join("\n");
  if (text.split(/\s+/).length < 60) throw new Error(st("Couldn't find much text on that page. It may need JavaScript or a login; copy the text and paste it instead.", "Teks di halaman itu sedikit sekali. Mungkin butuh JavaScript atau login; salin teksnya lalu tempel."));
  return { title, text, kind: "url", pages: 1, urlOrPath: url };
}

/** Split into passages of roughly 400 to 1,200 characters, keeping page numbers. */
export function chunkText(text: string, pageStart = 1, paged = false): { page: number | null; text: string }[] {
  const pages = text.split("\f");
  const multi = paged || pages.length > 1 || pageStart > 1;
  const out: { page: number | null; text: string }[] = [];
  pages.forEach((p, pi) => {
    let cur = "";
    const flush = () => { if (cur.trim()) out.push({ page: multi ? pageStart + pi : null, text: cur.trim() }); cur = ""; };
    for (const para of p.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean)) {
      if (para.length > 1400) {
        flush();
        const sentences = para.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [para];
        for (const s of sentences) { if ((cur + s).length > 1100) flush(); cur += s; }
        flush();
      } else {
        if ((cur + "\n\n" + para).length > 1100) flush();
        cur = cur ? cur + "\n\n" + para : para;
      }
    }
    flush();
  });
  return out;
}

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

/** Find the passage that best contains a quote from the model. */
export function bestChunk(quote: string, chunks: { id: number; text: string }[]): number | null {
  const q = norm(quote);
  if (!q || !chunks.length) return null;
  const exact = chunks.find((c) => norm(c.text).includes(q));
  if (exact) return exact.id;
  const words = new Set(q.split(" ").filter((w) => w.length > 3));
  if (!words.size) return null;
  let best: { id: number; score: number } | null = null;
  for (const c of chunks) {
    const cw = new Set(norm(c.text).split(" "));
    let hit = 0; words.forEach((w) => { if (cw.has(w)) hit++; });
    const score = hit / words.size;
    if (!best || score > best.score) best = { id: c.id, score };
  }
  return best && best.score >= 0.5 ? best.id : null;
}
