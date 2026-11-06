import { getDb, schema as S } from "../db";
import { getPrefs, getTiers } from "../repo";
import { getBudget, getModel, getProvider, resolveBaseUrl, resolveKey } from "./config";
import type { Depth } from "../types";

export type Msg = { role: "user" | "assistant"; content: string };

export interface GenerateOpts {
  messages: Msg[];
  json?: boolean;
  depth: Depth;
  signal?: AbortSignal;
  onText?: (t: string) => void;
  /** What the call is for; shown in Usage. */
  feature: string;
  conceptId?: string | null;
  /** Use this model instead of the one mapped to the depth (used by "Test model"). */
  modelRowId?: number;
  maxTokens?: number;
}

export class AIError extends Error {
  constructor(public code: string, message?: string, public partial?: string) { super(message || code); }
}

const ERRORS: Record<string, [string, string]> = {
  no_model: ["No model is set for this AI depth. Open Models and pick one.", "Belum ada model untuk tingkat AI ini. Buka Model lalu pilih satu."],
  no_key: ["This provider has no API key. Add one in Models > Providers and keys, or in .env.local.", "Penyedia ini belum punya API key. Tambahkan di Model > Penyedia & kunci, atau di .env.local."],
  provider_off: ["This provider is turned off in Models.", "Penyedia ini sedang dimatikan di Model."],
  auth: ["The provider rejected the API key. Check it in Models > Providers and keys.", "Penyedia menolak API key-nya. Periksa di Model > Penyedia & kunci."],
  rate_limited: ["The provider says you've hit a rate or usage limit. Try again later, or switch AI depth.", "Penyedia bilang batas pemakaian sudah tercapai. Coba lagi nanti, atau ganti tingkat AI."],
  budget: ["You've reached the monthly budget set in Usage. Raise it or turn off blocking to continue.", "Anggaran bulanan di Pemakaian sudah habis. Naikkan atau matikan penghentian otomatis untuk lanjut."],
  prompt_too_large: ["That's too much text for this model. Paste a shorter part or pick a model with a bigger context.", "Teksnya terlalu panjang untuk model ini. Tempel bagian yang lebih pendek atau pilih model dengan konteks lebih besar."],
  invalid_json: ["The model's reply couldn't be read. Try again.", "Balasan model tidak bisa dibaca. Coba lagi."],
  cancelled: ["Stopped.", "Dihentikan."],
  timeout: ["The request took too long. Try again.", "Permintaannya terlalu lama. Coba lagi."],
  network: ["Couldn't reach the provider. Check your connection, or that Ollama is running.", "Tidak bisa menghubungi penyedia. Periksa koneksi, atau pastikan Ollama sedang berjalan."],
  model_not_found: ["The provider doesn't know this model name. Check the spelling in Models > All models.", "Penyedia tidak mengenal nama model ini. Periksa ejaannya di Model > Semua model."],
  ollama_missing: ["Ollama hasn't downloaded this model yet. Open Models > Providers and keys and use “Download a model” on the Ollama card, or run `ollama pull <model name>` in PowerShell (not `ollama create`).", "Ollama belum mengunduh model ini. Buka Model > Penyedia & kunci lalu pakai “Unduh model” di kartu Ollama, atau jalankan `ollama pull <nama model>` di PowerShell (bukan `ollama create`)."],
  provider_error: ["The provider returned an error.", "Penyedia mengembalikan error."],
  no_embed_model: ["No search model is set. Open Models > 3. Use for each depth > Search index and pick one.", "Belum ada model pencarian. Buka Model > 3. Pakai di tiap tingkat > Indeks pencarian lalu pilih satu."],
  embed_unsupported: ["Anthropic doesn't offer search (embedding) models. Use Ollama's nomic-embed-text or Gemini Embedding.", "Anthropic tidak menyediakan model pencarian (embedding). Pakai nomic-embed-text dari Ollama atau Gemini Embedding."],
};
/** Error text in the user's language. */
export function errorText(code: string): string | undefined {
  const e = ERRORS[code];
  if (!e) return undefined;
  return getPrefs().lang === "id" ? e[1] : e[0];
}

const TIMEOUT_MS = 240_000;

function monthStart() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); }
export function monthSpend() {
  const r = getDb().$client.prepare("SELECT COALESCE(SUM(cost_usd),0) AS c FROM usage_log WHERE created_at >= ?").get(monthStart()) as { c: number };
  return r.c;
}

/** Reasoning models (DeepSeek-R1, Qwen) may put their thinking in <think> tags. Hide it. */
const stripThink = (s: string) => {
  let t = s.replace(/<think>[\s\S]*?<\/think>\s*/g, "");
  const open = t.indexOf("<think>");
  if (open >= 0) t = t.slice(0, open);
  return t;
};

/** One interface for every provider. Logs each call to usage_log. */
export async function generate(opts: GenerateOpts): Promise<string> {
  const modelRowId = opts.modelRowId ?? getTiers()[opts.depth];
  if (!modelRowId) throw new AIError("no_model");
  const model = getModel(modelRowId);
  if (!model) throw new AIError("no_model");
  const provider = getProvider(model.providerId);
  if (!provider) throw new AIError("no_model");
  if (!provider.enabled) throw new AIError("provider_off");
  const { key } = resolveKey(provider);
  if (!key && provider.kind !== "ollama") throw new AIError("no_key");

  const budget = getBudget();
  if (opts.feature !== "test" && budget.block && budget.monthlyUsd > 0 && monthSpend() >= budget.monthlyUsd) throw new AIError("budget");

  const signals = [AbortSignal.timeout(TIMEOUT_MS)];
  if (opts.signal) signals.push(opts.signal);
  const signal = AbortSignal.any(signals);
  const started = Date.now();
  let text = "";
  let usage: { input?: number; output?: number; cost?: number } = {};
  const emit = (t: string) => { text += t; opts.onText?.(stripThink(text)); };
  const maxTokens = opts.maxTokens || model.maxOutput || 4096;

  const log = (status: string, error?: string) => {
    const estimated = usage.input == null || usage.output == null;
    const inTok = usage.input ?? Math.ceil(opts.messages.reduce((n, m) => n + m.content.length, 0) / 4);
    const outTok = usage.output ?? Math.ceil(text.length / 4);
    const cost = usage.cost ?? (inTok * model.inputPrice + outTok * model.outputPrice) / 1_000_000;
    try {
      getDb().insert(S.usageLog).values({
        createdAt: Date.now(), providerId: provider.id, providerKind: provider.kind, providerName: provider.name,
        modelRowId: model.id, modelId: model.modelId, feature: opts.feature, depth: opts.modelRowId ? "manual" : opts.depth,
        conceptId: opts.conceptId || null, inputTokens: inTok, outputTokens: outTok, estimated, costUsd: cost,
        latencyMs: Date.now() - started, status, error: error || null,
      }).run();
    } catch { /* logging must never break a request */ }
  };

  try {
    if (provider.kind === "anthropic") {
      usage = await callAnthropic(resolveBaseUrl(provider), key!, model.modelId, opts.messages, maxTokens, signal, emit);
    } else {
      usage = await callOpenAICompatible(provider.kind, resolveBaseUrl(provider), key, model.modelId, opts.messages, maxTokens, !!opts.json, signal, emit);
    }
    log("ok");
    return stripThink(text).trim();
  } catch (e) {
    const err = normalizeError(e, opts.signal);
    log(err.code === "cancelled" ? "aborted" : "error", `${err.code}: ${err.message}`.slice(0, 500));
    err.partial = stripThink(text);
    throw err;
  }
}

function normalizeError(e: unknown, userSignal?: AbortSignal): AIError {
  if (e instanceof AIError) return e;
  const name = (e as Error)?.name;
  if (name === "AbortError" || name === "TimeoutError") return new AIError(userSignal?.aborted ? "cancelled" : "timeout");
  const msg = String((e as Error)?.message || e);
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|network/i.test(msg)) return new AIError("network", msg);
  return new AIError("provider_error", msg);
}

async function httpError(res: Response): Promise<AIError> {
  let body = "";
  try { body = await res.text(); } catch { /* ignore */ }
  const short = body.slice(0, 400);
  if (res.status === 401 || res.status === 403) return new AIError("auth", short);
  if (res.status === 429 || res.status === 402) return new AIError("rate_limited", short);
  if (res.status === 404 || /model.*not.*found|not_found_error|does not exist/i.test(body)) return new AIError("model_not_found", short);
  if (res.status === 413 || /too long|context length|maximum context|prompt is too long/i.test(body)) return new AIError("prompt_too_large", short);
  return new AIError("provider_error", `HTTP ${res.status}: ${short}`);
}

async function* sseLines(res: Response) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line.startsWith("data:")) yield line.slice(5).trim();
    }
  }
  if (buf.trim().startsWith("data:")) yield buf.trim().slice(5).trim();
}

async function callAnthropic(base: string, key: string, model: string, messages: Msg[], maxTokens: number, signal: AbortSignal, emit: (t: string) => void) {
  const res = await fetch(`${base}/v1/messages`, {
    method: "POST", signal,
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: maxTokens, stream: true, messages }),
  });
  if (!res.ok) throw await httpError(res);
  const usage: { input?: number; output?: number } = {};
  for await (const data of sseLines(res)) {
    let ev: any;
    try { ev = JSON.parse(data); } catch { continue; }
    if (ev.type === "message_start") usage.input = (ev.message?.usage?.input_tokens || 0) + (ev.message?.usage?.cache_read_input_tokens || 0) + (ev.message?.usage?.cache_creation_input_tokens || 0);
    else if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") emit(ev.delta.text);
    else if (ev.type === "message_delta" && ev.usage) usage.output = ev.usage.output_tokens;
    else if (ev.type === "error") throw new AIError(ev.error?.type === "overloaded_error" ? "rate_limited" : "provider_error", ev.error?.message);
  }
  return usage;
}

async function callOpenAICompatible(kind: string, base: string, key: string | null, model: string, messages: Msg[], maxTokens: number, json: boolean, signal: AbortSignal, emit: (t: string) => void) {
  const url = kind === "ollama" ? `${base}/v1/chat/completions` : `${base}/chat/completions`;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (key) headers.authorization = `Bearer ${key}`;
  if (kind === "openrouter") { headers["HTTP-Referer"] = "http://localhost:3000"; headers["X-Title"] = "Neuron"; }
  const body: Record<string, unknown> = { model, messages, stream: true, stream_options: { include_usage: true }, max_tokens: maxTokens };
  if (kind === "openrouter") body.usage = { include: true };
  if (json && (kind === "ollama" || kind === "gemini")) body.response_format = { type: "json_object" };
  const res = await fetch(url, { method: "POST", signal, headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await httpError(res);
    if (kind === "ollama" && err.code === "model_not_found") throw new AIError("ollama_missing", `Ollama has no model called “${model}”. ${err.message}`);
    throw err;
  }
  const usage: { input?: number; output?: number; cost?: number } = {};
  for await (const data of sseLines(res)) {
    if (data === "[DONE]") break;
    let ev: any;
    try { ev = JSON.parse(data); } catch { continue; }
    if (ev.error) throw new AIError("provider_error", ev.error.message || JSON.stringify(ev.error));
    const delta = ev.choices?.[0]?.delta?.content;
    if (delta) emit(delta);
    if (ev.usage) {
      usage.input = ev.usage.prompt_tokens ?? usage.input;
      usage.output = ev.usage.completion_tokens ?? usage.output;
      if (typeof ev.usage.cost === "number") usage.cost = ev.usage.cost;
    }
  }
  return usage;
}

/* ---------------- JSON helpers ---------------- */
export function parseJsonLoose<T = any>(s: string): T {
  let t = stripThink(s).replace(/```(?:json)?/gi, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) throw new AIError("invalid_json", "No JSON object in reply");
  t = t.slice(a, b + 1);
  try { return JSON.parse(t) as T; } catch {
    // common fixes: trailing commas, smart quotes used as JSON quotes
    try { return JSON.parse(t.replace(/,\s*([}\]])/g, "$1")) as T; } catch { throw new AIError("invalid_json", "Reply was not valid JSON"); }
  }
}

/** JSON call: ask for JSON only, parse tolerantly. No retry loop: the UI shows "Try again". */
export async function generateJson<T = any>(opts: Omit<GenerateOpts, "json">): Promise<T> {
  const text = await generate({ ...opts, json: true });
  return parseJsonLoose<T>(text);
}

/** Cap depth for calls that don't need the heaviest model (as in the prototype). */
export const capDepth = (d: Depth, max: Depth): Depth => {
  const order: Depth[] = ["quick", "balanced", "deep"];
  return order.indexOf(d) > order.indexOf(max) ? max : d;
};
