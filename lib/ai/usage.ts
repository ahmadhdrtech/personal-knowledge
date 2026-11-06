import { getDb } from "../db";
import { getBudget } from "./config";
import { monthSpend } from "./generate";
import type { UsageRow } from "../types";

export interface UsageGroup { key: string; label: string; calls: number; errors: number; input: number; output: number; cost: number; avgLatency: number }
export interface UsageSummary {
  rangeDays: number;
  totals: { calls: number; errors: number; input: number; output: number; cost: number; estimatedShare: number; avgLatency: number };
  byDay: { day: string; calls: number; tokens: number; cost: number }[];
  byModel: UsageGroup[];
  byFeature: UsageGroup[];
  byProvider: UsageGroup[];
  recent: UsageRow[];
  month: { spend: number; budget: number; block: boolean };
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function usageSummary(rangeDays: number): UsageSummary {
  const s = getDb().$client;
  const since = rangeDays > 0 ? Date.now() - rangeDays * 86_400_000 : 0;
  const rows = (s.prepare("SELECT * FROM usage_log WHERE created_at >= ? ORDER BY created_at DESC").all(since) as any[]).map((r) => ({
    id: r.id, createdAt: r.created_at, providerName: r.provider_name, providerKind: r.provider_kind, modelId: r.model_id, feature: r.feature,
    depth: r.depth, conceptId: r.concept_id, inputTokens: r.input_tokens, outputTokens: r.output_tokens, estimated: !!r.estimated,
    costUsd: r.cost_usd, latencyMs: r.latency_ms, status: r.status, error: r.error,
  })) as UsageRow[];

  const group = (keyOf: (r: UsageRow) => string, labelOf: (r: UsageRow) => string): UsageGroup[] => {
    const m = new Map<string, UsageGroup & { lat: number }>();
    for (const r of rows) {
      const k = keyOf(r);
      const g = m.get(k) || { key: k, label: labelOf(r), calls: 0, errors: 0, input: 0, output: 0, cost: 0, avgLatency: 0, lat: 0 };
      g.calls++; if (r.status !== "ok") g.errors++;
      g.input += r.inputTokens; g.output += r.outputTokens; g.cost += r.costUsd; g.lat += r.latencyMs;
      m.set(k, g);
    }
    return [...m.values()].map(({ lat, ...g }) => ({ ...g, avgLatency: g.calls ? Math.round(lat / g.calls) : 0 })).sort((a, b) => b.cost - a.cost || b.calls - a.calls);
  };

  // daily series, filling empty days
  const days = rangeDays > 0 ? rangeDays : Math.min(90, Math.max(1, Math.ceil((Date.now() - (rows.at(-1)?.createdAt ?? Date.now())) / 86_400_000) + 1));
  const byDayMap = new Map<string, { day: string; calls: number; tokens: number; cost: number }>();
  for (let i = days - 1; i >= 0; i--) { const k = dayKey(Date.now() - i * 86_400_000); byDayMap.set(k, { day: k, calls: 0, tokens: 0, cost: 0 }); }
  for (const r of rows) { const b = byDayMap.get(dayKey(r.createdAt)); if (b) { b.calls++; b.tokens += r.inputTokens + r.outputTokens; b.cost += r.costUsd; } }

  const totals = rows.reduce((t, r) => ({ calls: t.calls + 1, errors: t.errors + (r.status === "ok" ? 0 : 1), input: t.input + r.inputTokens, output: t.output + r.outputTokens, cost: t.cost + r.costUsd, est: t.est + (r.estimated ? 1 : 0), lat: t.lat + r.latencyMs }), { calls: 0, errors: 0, input: 0, output: 0, cost: 0, est: 0, lat: 0 });
  const budget = getBudget();
  return {
    rangeDays,
    totals: { calls: totals.calls, errors: totals.errors, input: totals.input, output: totals.output, cost: totals.cost, estimatedShare: totals.calls ? totals.est / totals.calls : 0, avgLatency: totals.calls ? Math.round(totals.lat / totals.calls) : 0 },
    byDay: [...byDayMap.values()],
    byModel: group((r) => `${r.providerName}|${r.modelId}`, (r) => `${r.modelId} · ${r.providerName}`),
    byFeature: group((r) => r.feature, (r) => r.feature),
    byProvider: group((r) => r.providerName, (r) => r.providerName),
    recent: rows.slice(0, 100),
    month: { spend: monthSpend(), budget: budget.monthlyUsd, block: budget.block },
  };
}

export function clearUsage() { getDb().$client.prepare("DELETE FROM usage_log").run(); }
