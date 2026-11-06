// Semantic search over concepts and source passages. Vectors live in the embeddings table;
// search is a plain cosine scan, which is fast enough for a personal map of thousands of items.
import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb, schema as S } from "./db";
import { getModel } from "./ai/config";
import { cosine, embed, embedModelId, fromBlob, toBlob } from "./ai/embed";

const BATCH = 32;
const hash = (s: string) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);
const modelKey = () => { const id = embedModelId(); const m = id ? getModel(id) : null; return m ? `${m.id}:${m.modelId}` : null; };

function conceptTexts() {
  const d = getDb();
  return d.select().from(S.concepts).all().map((c) => ({
    id: c.id,
    text: `${c.labelEn}${c.labelId && c.labelId !== c.labelEn ? ` (${c.labelId})` : ""}. ${c.summaryEn}${c.userDefinition ? ` Learner's definition: ${c.userDefinition}` : ""}`.slice(0, 2000),
  }));
}
function chunkTexts(sourceId?: number) {
  const d = getDb();
  const rows = sourceId ? d.select().from(S.chunks).where(eq(S.chunks.sourceId, sourceId)).all() : d.select().from(S.chunks).all();
  return rows.map((c) => ({ id: String(c.id), text: c.text.slice(0, 2000) }));
}

function pending(kind: "concept" | "chunk", items: { id: string; text: string }[], mk: string) {
  const have = new Map(getDb().select({ refId: S.embeddings.refId, hash: S.embeddings.hash, model: S.embeddings.model }).from(S.embeddings).where(eq(S.embeddings.kind, kind)).all().map((r) => [r.refId, r]));
  return items.filter((it) => { const h = have.get(it.id); return !h || h.model !== mk || h.hash !== hash(mk + it.text); });
}

async function store(kind: "concept" | "chunk", items: { id: string; text: string }[], mk: string, signal?: AbortSignal) {
  for (let i = 0; i < items.length; i += BATCH) {
    const part = items.slice(i, i + BATCH);
    const { vectors } = await embed(part.map((p) => p.text), "index", signal);
    const d = getDb();
    d.$client.transaction(() => {
      part.forEach((p, k) => d.insert(S.embeddings).values({ kind, refId: p.id, model: mk, hash: hash(mk + p.text), vector: toBlob(vectors[k]), updatedAt: Date.now() })
        .onConflictDoUpdate({ target: [S.embeddings.kind, S.embeddings.refId], set: { model: mk, hash: hash(mk + p.text), vector: toBlob(vectors[k]), updatedAt: Date.now() } }).run());
    })();
  }
}

/** Drop vectors whose concept or passage no longer exists. */
function prune() {
  getDb().$client.exec(`DELETE FROM embeddings WHERE (kind = 'concept' AND ref_id NOT IN (SELECT id FROM concepts)) OR (kind = 'chunk' AND CAST(ref_id AS INTEGER) NOT IN (SELECT id FROM chunks))`);
}

export function indexStatus() {
  const id = embedModelId(), m = id ? getModel(id) : null, mk = modelKey();
  const concepts = conceptTexts(), chunks = chunkTexts();
  if (!mk) return { modelRowId: null, model: null, concepts: { done: 0, total: concepts.length }, chunks: { done: 0, total: chunks.length }, ready: false };
  const pc = pending("concept", concepts, mk).length, pk = pending("chunk", chunks, mk).length;
  return { modelRowId: id, model: m!.label, concepts: { done: concepts.length - pc, total: concepts.length }, chunks: { done: chunks.length - pk, total: chunks.length }, ready: pc + pk === 0 };
}

/** Index the next slice of missing or changed items. Call repeatedly until remaining is 0. */
export async function indexStep(limit = 96, signal?: AbortSignal) {
  const mk = modelKey();
  if (!mk) return { ...indexStatus(), remaining: 0 };
  prune();
  const pc = pending("concept", conceptTexts(), mk);
  const pk = pending("chunk", chunkTexts(), mk);
  const c = pc.slice(0, limit), k = pk.slice(0, Math.max(0, limit - c.length));
  if (c.length) await store("concept", c, mk, signal);
  if (k.length) await store("chunk", k, mk, signal);
  return { ...indexStatus(), remaining: pc.length + pk.length - c.length - k.length };
}

/** After an import: index that source's passages and any new or changed concepts. Never throws. */
export async function indexAfterImport(sourceId: number | null) {
  const mk = modelKey();
  if (!mk) return false;
  try {
    await store("concept", pending("concept", conceptTexts(), mk), mk);
    if (sourceId) await store("chunk", pending("chunk", chunkTexts(sourceId), mk), mk);
    return true;
  } catch { return false; }
}

function load(kind: "concept" | "chunk", mk: string) {
  return getDb().select({ refId: S.embeddings.refId, vector: S.embeddings.vector }).from(S.embeddings).where(and(eq(S.embeddings.kind, kind), eq(S.embeddings.model, mk))).all()
    .map((r) => ({ id: r.refId, v: fromBlob(r.vector as Buffer) }));
}

export interface SearchHit { kind: "concept" | "chunk"; id: string; score: number; text?: string; sourceId?: number; sourceTitle?: string; page?: number | null }

/** Semantic search when a search model is set; otherwise word matching. */
export async function search(query: string, k = 8, signal?: AbortSignal): Promise<{ semantic: boolean; concepts: SearchHit[]; passages: SearchHit[] }> {
  const q = query.trim();
  const d = getDb();
  const mk = modelKey();
  const srcTitle = new Map(d.select({ id: S.sources.id, title: S.sources.title }).from(S.sources).all().map((s) => [s.id, s.title]));
  const chunkMeta = (id: string) => d.select().from(S.chunks).where(eq(S.chunks.id, Number(id))).get();
  let vectors: number[][] | null = null;
  if (mk && q) { try { vectors = (await embed([q], "search", signal)).vectors; } catch (e) { if ((e as Error).name === "AbortError") throw e; /* search model offline: use words */ } }
  if (mk && q && vectors) {
    const qv = new Float32Array(vectors[0]);
    const rank = (rows: { id: string; v: Float32Array }[]) => rows.map((r) => ({ id: r.id, score: cosine(qv, r.v) })).sort((a, b) => b.score - a.score);
    const concepts = rank(load("concept", mk)).slice(0, k).filter((x) => x.score > 0.25).map((x) => ({ kind: "concept" as const, ...x }));
    const passages = rank(load("chunk", mk)).slice(0, k).filter((x) => x.score > 0.25).map((x) => {
      const c = chunkMeta(x.id);
      return { kind: "chunk" as const, ...x, text: c?.text || "", sourceId: c?.sourceId, sourceTitle: c ? srcTitle.get(c.sourceId) : "", page: c?.page ?? null };
    });
    return { semantic: true, concepts, passages };
  }
  // fallback: count matching words
  const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const score = (t: string) => { const s = t.toLowerCase(); return words.length ? words.filter((w) => s.includes(w)).length / words.length : 0; };
  const concepts = conceptTexts().map((c) => ({ kind: "concept" as const, id: c.id, score: score(c.text) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
  const passages = d.select().from(S.chunks).all().map((c) => ({ kind: "chunk" as const, id: String(c.id), score: score(c.text), text: c.text, sourceId: c.sourceId, sourceTitle: srcTitle.get(c.sourceId), page: c.page }))
    .filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
  return { semantic: false, concepts, passages };
}

/** For merging on import: the existing concept most similar to a new one. */
export async function nearestConcepts(texts: string[], signal?: AbortSignal): Promise<({ id: string; score: number } | null)[]> {
  const mk = modelKey();
  if (!mk || !texts.length) return texts.map(() => null);
  const rows = load("concept", mk);
  if (!rows.length) return texts.map(() => null);
  const { vectors } = await embed(texts, "index", signal);
  return vectors.map((v) => {
    const qv = new Float32Array(v);
    let best: { id: string; score: number } | null = null;
    for (const r of rows) { const s = cosine(qv, r.v); if (!best || s > best.score) best = { id: r.id, score: s }; }
    return best;
  });
}
