// Lists the models a provider offers, so you can add them without typing names.
import { getProvider, resolveBaseUrl, resolveKey } from "./config";
import { st } from "../i18n";

export interface CatalogModel {
  modelId: string;
  label: string;
  inputPrice: number | null; // USD per 1M tokens, null = unknown
  outputPrice: number | null;
  contextWindow: number | null;
  free: boolean;
}

export async function fetchCatalog(providerId: number): Promise<CatalogModel[]> {
  const p = getProvider(providerId);
  if (!p) throw new Error("Provider not found");
  const base = resolveBaseUrl(p);
  const { key } = resolveKey(p);
  const signal = AbortSignal.timeout(20_000);
  const get = async (url: string, headers: Record<string, string> = {}) => {
    const r = await fetch(url, { headers, signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return r.json() as Promise<any>;
  };

  switch (p.kind) {
    case "anthropic": {
      if (!key) throw new Error(st("Add an API key first.", "Tambahkan API key dulu."));
      const j = await get(`${base}/v1/models?limit=100`, { "x-api-key": key, "anthropic-version": "2023-06-01" });
      return (j.data || []).map((m: any) => ({ modelId: m.id, label: m.display_name || m.id, inputPrice: null, outputPrice: null, contextWindow: null, free: false }));
    }
    case "openrouter": {
      const j = await get(`${base}/models`);
      return (j.data || []).map((m: any) => {
        const pin = Number(m.pricing?.prompt ?? NaN) * 1e6, pout = Number(m.pricing?.completion ?? NaN) * 1e6;
        const free = String(m.id).endsWith(":free") || (pin === 0 && pout === 0);
        return { modelId: m.id, label: m.name || m.id, inputPrice: isFinite(pin) ? round(pin) : null, outputPrice: isFinite(pout) ? round(pout) : null, contextWindow: m.context_length || null, free };
      });
    }
    case "gemini": {
      if (!key) throw new Error(st("Add an API key first.", "Tambahkan API key dulu."));
      const j = await get(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(key)}`);
      return (j.models || [])
        .filter((m: any) => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map((m: any) => ({ modelId: String(m.name).replace(/^models\//, ""), label: m.displayName || m.name, inputPrice: null, outputPrice: null, contextWindow: m.inputTokenLimit || null, free: false }));
    }
    case "ollama": {
      const j = await get(`${base}/api/tags`);
      return (j.models || []).map((m: any) => ({ modelId: m.name, label: `${m.name} (local)`, inputPrice: 0, outputPrice: 0, contextWindow: null, free: true }));
    }
    default: {
      const j = await get(`${base}/models`, key ? { authorization: `Bearer ${key}` } : {});
      return (j.data || []).map((m: any) => ({ modelId: m.id, label: m.id, inputPrice: null, outputPrice: null, contextWindow: null, free: false }));
    }
  }
}

const round = (n: number) => Math.round(n * 10000) / 10000;
