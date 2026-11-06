import { eq } from "drizzle-orm";
import { getDb, schema as S } from "../db";
import { getSetting, setSetting, getTiers } from "../repo";
import type { Depth, ModelRow, ProviderKind, ProviderRow } from "../types";

export const PROVIDER_KINDS: { kind: ProviderKind; name: string; env: string | null; defaultUrl: string | null; keyUrl: string | null; note: string }[] = [
  { kind: "anthropic", name: "Anthropic API", env: "ANTHROPIC_API_KEY", defaultUrl: "https://api.anthropic.com", keyUrl: "https://console.anthropic.com/settings/keys", note: "Billed separately from a Claude.ai subscription." },
  { kind: "openrouter", name: "OpenRouter", env: "OPENROUTER_API_KEY", defaultUrl: "https://openrouter.ai/api/v1", keyUrl: "https://openrouter.ai/settings/keys", note: "One key for many models, including free ones." },
  { kind: "gemini", name: "Google Gemini", env: "GEMINI_API_KEY", defaultUrl: "https://generativelanguage.googleapis.com/v1beta/openai", keyUrl: "https://aistudio.google.com/apikey", note: "Has a free tier." },
  { kind: "ollama", name: "Ollama (local)", env: "OLLAMA_URL", defaultUrl: "http://localhost:11434", keyUrl: "https://ollama.com/download", note: "Free and fully local. No key needed." },
  { kind: "openai_compatible", name: "OpenAI-compatible", env: null, defaultUrl: null, keyUrl: null, note: "Any API that speaks the OpenAI chat format: OpenAI, Groq, DeepSeek, LM Studio and others." },
];
export const kindInfo = (k: string) => PROVIDER_KINDS.find((p) => p.kind === k) || PROVIDER_KINDS[4];

type ProviderDb = typeof S.providers.$inferSelect;
type ModelDb = typeof S.models.$inferSelect;

export function resolveKey(p: ProviderDb): { key: string | null; source: "app" | "env" | "none" } {
  if (p.apiKey) return { key: p.apiKey, source: "app" };
  const env = kindInfo(p.kind).env;
  if (env && p.kind !== "ollama" && process.env[env]) return { key: process.env[env]!, source: "env" };
  return { key: null, source: "none" };
}
export function resolveBaseUrl(p: ProviderDb) {
  if (p.kind === "ollama") return (p.baseUrl || process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/, "");
  return (p.baseUrl || kindInfo(p.kind).defaultUrl || "").replace(/\/+$/, "");
}

const hint = (k: string | null) => (k ? (k.length > 10 ? `${k.slice(0, 5)}…${k.slice(-4)}` : "set") : null);

export function listProviders(): ProviderRow[] {
  return getDb().select().from(S.providers).all().map((p) => {
    const k = resolveKey(p);
    return { id: p.id, kind: p.kind as ProviderKind, name: p.name, baseUrl: p.baseUrl, hasKey: !!k.key || p.kind === "ollama", keySource: p.kind === "ollama" ? "none" : k.source, keyHint: hint(k.key), enabled: !!p.enabled };
  });
}
export function getProvider(id: number) { return getDb().select().from(S.providers).where(eq(S.providers.id, id)).get() || null; }

export function saveProvider(input: { id?: number; kind: ProviderKind; name: string; baseUrl?: string | null; apiKey?: string | null; clearKey?: boolean; enabled?: boolean }) {
  const db = getDb();
  const vals: Partial<ProviderDb> = { kind: input.kind, name: input.name.trim() || kindInfo(input.kind).name, baseUrl: input.baseUrl?.trim() || null };
  if (input.enabled !== undefined) vals.enabled = input.enabled;
  if (input.apiKey && input.apiKey.trim()) vals.apiKey = input.apiKey.trim();
  if (input.clearKey) vals.apiKey = null;
  if (input.id) { db.update(S.providers).set(vals).where(eq(S.providers.id, input.id)).run(); return input.id; }
  return db.insert(S.providers).values({ ...vals, kind: input.kind, name: vals.name!, enabled: input.enabled ?? true, createdAt: Date.now() } as typeof S.providers.$inferInsert).returning({ id: S.providers.id }).get().id;
}
export function deleteProvider(id: number) {
  const db = getDb();
  const ms = db.select().from(S.models).where(eq(S.models.providerId, id)).all();
  for (const m of ms) deleteModel(m.id);
  db.delete(S.providers).where(eq(S.providers.id, id)).run();
}

export function listModels(): ModelRow[] {
  return getDb().select().from(S.models).all().map((m) => ({ id: m.id, providerId: m.providerId, modelId: m.modelId, label: m.label, inputPrice: m.inputPrice, outputPrice: m.outputPrice, contextWindow: m.contextWindow, maxOutput: m.maxOutput, purpose: (m.purpose === "embed" ? "embed" : "chat") as "chat" | "embed", notes: m.notes, enabled: !!m.enabled }));
}
export function getModel(id: number) { return getDb().select().from(S.models).where(eq(S.models.id, id)).get() || null; }

export function saveModel(input: Partial<ModelDb> & { providerId: number; modelId: string }) {
  const db = getDb();
  const vals = {
    providerId: input.providerId, modelId: input.modelId.trim(), label: (input.label || input.modelId).trim(),
    inputPrice: Number(input.inputPrice) || 0, outputPrice: Number(input.outputPrice) || 0,
    contextWindow: input.contextWindow ? Number(input.contextWindow) : null,
    maxOutput: Math.max(256, Math.min(128000, Number(input.maxOutput) || 4096)),
    purpose: input.purpose === "embed" ? "embed" : "chat",
    notes: input.notes?.trim() || null, enabled: input.enabled ?? true,
  };
  if (input.id) { db.update(S.models).set(vals).where(eq(S.models.id, input.id)).run(); return input.id; }
  return db.insert(S.models).values({ ...vals, createdAt: Date.now() }).returning({ id: S.models.id }).get().id;
}
export function deleteModel(id: number) {
  getDb().delete(S.models).where(eq(S.models.id, id)).run();
  const t = getTiers();
  (Object.keys(t) as Depth[]).forEach((k) => { if (t[k] === id) t[k] = null; });
  setSetting("tiers", t);
  if (getSetting<number | null>("embed_model", null) === id) setSetting("embed_model", null);
}
export function setTiers(t: Partial<Record<Depth, number | null>>) {
  const cur = getTiers();
  for (const k of ["quick", "balanced", "deep"] as Depth[]) if (k in t) cur[k] = t[k] ? Number(t[k]) : null;
  setSetting("tiers", cur);
  return cur;
}

export interface Budget { monthlyUsd: number; block: boolean }
export const getBudget = () => getSetting<Budget>("budget", { monthlyUsd: 0, block: false });
export const setBudget = (b: Budget) => setSetting("budget", { monthlyUsd: Math.max(0, Number(b.monthlyUsd) || 0), block: !!b.block });
