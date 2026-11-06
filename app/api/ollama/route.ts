import { body, fail, ok } from "@/lib/http";
import { st } from "@/lib/i18n";
import { getProvider, listModels, resolveBaseUrl, saveModel } from "@/lib/ai/config";

export const dynamic = "force-dynamic";
export const maxDuration = 3600;

function ollamaBase(providerId: number) {
  const p = getProvider(providerId);
  if (!p || p.kind !== "ollama") throw new Error("Not an Ollama provider");
  return { p, base: resolveBaseUrl(p) };
}

/** Is Ollama running, and which models has it downloaded? */
export async function GET(req: Request) {
  try {
    const { base } = ollamaBase(Number(new URL(req.url).searchParams.get("providerId")));
    try {
      const signal = AbortSignal.timeout(4000);
      const [v, t] = await Promise.all([
        fetch(`${base}/api/version`, { signal }).then((r) => r.json()).catch(() => ({})),
        fetch(`${base}/api/tags`, { signal }).then((r) => r.json()),
      ]);
      const models = (t.models || []).map((m: any) => ({ name: m.name, size: m.size, modified: m.modified_at, params: m.details?.parameter_size || null }));
      return ok({ running: true, version: v.version || null, base, models });
    } catch {
      return ok({ running: false, version: null, base, models: [] });
    }
  } catch (e) {
    return fail(e);
  }
}

/** Download (pull) a model into Ollama. Streams progress as one JSON object per line. */
export async function POST(req: Request) {
  const b = await body(req);
  let base: string, providerId: number;
  try { ({ base } = ollamaBase(Number(b.providerId))); providerId = Number(b.providerId); } catch (e) { return fail(e); }
  const model = String(b.model || "").trim();
  if (!/^[\w.\-/:]+$/.test(model)) return fail(new Error(st("Type a model name like qwen3:8b", "Ketik nama model, misalnya qwen3:8b")));

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/api/pull`, { method: "POST", signal: req.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ model, stream: true }) });
  } catch {
    return fail(new Error(st("Couldn't reach Ollama. Make sure the Ollama app is running.", "Tidak bisa menghubungi Ollama. Pastikan aplikasi Ollama sedang berjalan.")));
  }
  if (!upstream.ok || !upstream.body) return fail(new Error(st(`Ollama refused the download (HTTP ${upstream.status}).`, `Ollama menolak unduhan (HTTP ${upstream.status}).`)));

  const enc = new TextEncoder(), dec = new TextDecoder();
  const stream = new ReadableStream({
    async start(ctl) {
      const reader = upstream.body!.getReader();
      let buf = "", success = false, error = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
            if (!line) continue;
            try {
              const ev = JSON.parse(line);
              if (ev.error) error = ev.error;
              if (ev.status === "success") success = true;
              ctl.enqueue(enc.encode(JSON.stringify({ status: ev.status || "", total: ev.total || 0, completed: ev.completed || 0, error: ev.error || null }) + "\n"));
            } catch { /* skip partial line */ }
          }
        }
      } catch (e) {
        error = (e as Error).name === "AbortError" ? st("Stopped.", "Dihentikan.") : String((e as Error).message);
      }
      let added = false;
      if (success && !listModels().some((m) => m.providerId === providerId && m.modelId === model)) {
        saveModel({ providerId, modelId: model, label: `${model} (local)`, inputPrice: 0, outputPrice: 0, purpose: /embed/i.test(model) ? "embed" : "chat", notes: st("Downloaded through Neuron. Free, runs on your PC.", "Diunduh lewat Neuron. Gratis, berjalan di PC-mu.") });
        added = true;
      }
      try { ctl.enqueue(enc.encode(JSON.stringify({ done: true, success, error: error || null, added }) + "\n")); ctl.close(); } catch { /* client left */ }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" } });
}
