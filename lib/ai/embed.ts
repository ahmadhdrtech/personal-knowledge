// Embeddings: turn text into vectors so concepts and passages can be found by meaning.
import { getDb, schema as S } from "../db";
import { getSetting } from "../repo";
import { AIError } from "./generate";
import { getModel, getProvider, resolveBaseUrl, resolveKey } from "./config";

export function embedModelId(): number | null {
  const id = getSetting<number | null>("embed_model", null);
  if (!id) return null;
  const m = getModel(id);
  return m && m.enabled ? id : null;
}

/** Embed a batch of texts with the chosen search model. Logs one usage row per call. */
export async function embed(texts: string[], feature = "embed", signal?: AbortSignal): Promise<{ vectors: number[][]; model: string }> {
  const id = embedModelId();
  if (!id) throw new AIError("no_embed_model");
  const model = getModel(id)!;
  const provider = getProvider(model.providerId);
  if (!provider || !provider.enabled) throw new AIError("provider_off");
  if (provider.kind === "anthropic") throw new AIError("embed_unsupported");
  const { key } = resolveKey(provider);
  if (!key && provider.kind !== "ollama") throw new AIError("no_key");
  const base = resolveBaseUrl(provider);
  const started = Date.now();
  const sig = AbortSignal.any([AbortSignal.timeout(120_000), ...(signal ? [signal] : [])]);
  let vectors: number[][] = [], tokens: number | null = null, status = "ok", error: string | null = null;
  try {
    if (provider.kind === "ollama") {
      const r = await fetch(`${base}/api/embed`, { method: "POST", signal: sig, headers: { "content-type": "application/json" }, body: JSON.stringify({ model: model.modelId, input: texts }) });
      if (!r.ok) {
        const body = await r.text();
        if (r.status === 404 || /not found/i.test(body)) throw new AIError("ollama_missing", body.slice(0, 200));
        throw new AIError("provider_error", `HTTP ${r.status}: ${body.slice(0, 200)}`);
      }
      const j = await r.json();
      vectors = j.embeddings || [];
      tokens = j.prompt_eval_count ?? null;
    } else {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (key) headers.authorization = `Bearer ${key}`;
      const r = await fetch(`${base}/embeddings`, { method: "POST", signal: sig, headers, body: JSON.stringify({ model: model.modelId, input: texts }) });
      if (!r.ok) {
        const body = await r.text();
        if (r.status === 401 || r.status === 403) throw new AIError("auth", body.slice(0, 200));
        if (r.status === 429) throw new AIError("rate_limited", body.slice(0, 200));
        if (r.status === 404) throw new AIError("model_not_found", body.slice(0, 200));
        throw new AIError("provider_error", `HTTP ${r.status}: ${body.slice(0, 200)}`);
      }
      const j = await r.json();
      vectors = (j.data || []).sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0)).map((d: any) => d.embedding);
      tokens = j.usage?.prompt_tokens ?? j.usage?.total_tokens ?? null;
    }
    if (vectors.length !== texts.length || !vectors.every((v) => Array.isArray(v) && v.length)) throw new AIError("provider_error", "The search model returned no vectors");
    return { vectors, model: `${model.id}:${model.modelId}` };
  } catch (e) {
    const err = e instanceof AIError ? e : new AIError((e as Error).name === "AbortError" ? "cancelled" : /fetch failed|ECONNREFUSED/.test(String((e as Error).message)) ? "network" : "provider_error", String((e as Error).message));
    status = err.code === "cancelled" ? "aborted" : "error"; error = `${err.code}: ${err.message}`.slice(0, 500);
    throw err;
  } finally {
    const inTok = tokens ?? Math.ceil(texts.reduce((n, t) => n + t.length, 0) / 4);
    try {
      getDb().insert(S.usageLog).values({
        createdAt: Date.now(), providerId: provider.id, providerKind: provider.kind, providerName: provider.name, modelRowId: model.id, modelId: model.modelId,
        feature, depth: "search", inputTokens: inTok, outputTokens: 0, estimated: tokens == null, costUsd: (inTok * model.inputPrice) / 1_000_000,
        latencyMs: Date.now() - started, status, error,
      }).run();
    } catch { /* never break on logging */ }
  }
}

export const toBlob = (v: number[]) => Buffer.from(new Float32Array(v).buffer);
export const fromBlob = (b: Buffer) => new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);

export function cosine(a: Float32Array, b: Float32Array) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
