import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type Database from "better-sqlite3";
import * as schema from "./schema";
import { TOPICS0, NODES0, LINKS0 } from "../seed-data";

type AnyDB = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

const GRAPH_TABLES = [
  "domains", "concepts", "concept_domains", "sources", "chunks", "concept_sources",
  "links", "vocab", "questions", "attempts", "glossary", "chats", "review_cards", "embeddings", "study_items", "study_adapt", "claims",
];

/** Empty the knowledge map so you can start with your own topics. AI settings, keys and usage history are kept. */
export function clearMap(db: AnyDB) {
  const s = db.$client;
  s.transaction(() => {
    for (const t of GRAPH_TABLES) s.prepare(`DELETE FROM ${t}`).run();
    s.prepare("DELETE FROM settings WHERE key IN ('last_import','demo_offline')").run();
    s.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('seeded','1')").run();
  })();
}

/** Replace the knowledge map with the 15-concept demo map. AI settings and usage history are kept. */
export function seedDemo(db: AnyDB) {
  const s = db.$client;
  const tx = s.transaction(() => {
    for (const t of GRAPH_TABLES) s.prepare(`DELETE FROM ${t}`).run();
    s.prepare("DELETE FROM settings WHERE key IN ('last_import','demo_offline')").run();
    const now = Date.now();

    for (const t of TOPICS0) {
      db.insert(schema.domains).values({ key: t.key, nameEn: t.en, nameId: t.id, colorIndex: t.c }).run();
    }

    const sourceIds = new Map<string, number>();
    const sourceFor = (title: string) => {
      if (!sourceIds.has(title)) {
        const r = db.insert(schema.sources).values({ title, kind: "note", text: "", createdAt: now }).returning({ id: schema.sources.id }).get();
        sourceIds.set(title, r.id);
      }
      return sourceIds.get(title)!;
    };

    for (const n of NODES0) {
      db.insert(schema.concepts).values({
        id: n.id, labelEn: n.label.en, labelId: n.label.id, summaryEn: n.summary.en, summaryId: n.summary.id,
        mastery: n.mastery, misconception: false, auto: false, createdAt: now, updatedAt: now,
      }).run();
      n.topics.forEach((k: string, i: number) => db.insert(schema.conceptDomains).values({ conceptId: n.id, domainKey: k, position: i }).run());
      for (const src of n.sources) {
        db.insert(schema.conceptSources).values({ conceptId: n.id, sourceId: sourceFor(src.t), note: src.n }).run();
      }
      for (const v of n.vocab) {
        db.insert(schema.vocab).values({ conceptId: n.id, termEn: v.en, termId: v.id, example: v.ex || "" }).run();
      }
      for (const q of n.quiz) {
        db.insert(schema.questions).values({
          conceptId: n.id, kind: "mcq",
          payloadJson: JSON.stringify({ q: q.q, o: q.o, a: q.a, why: q.why }),
          bridgeConceptId: q.bridge || null, aiGenerated: false, createdAt: now,
        }).run();
      }
    }

    for (const l of LINKS0) {
      db.insert(schema.links).values({ fromId: l.source, toId: l.target, type: l.type, status: "approved", createdAt: now }).run();
    }
  });
  tx();
}

/** Default providers and models. Model names change often: use Models > Fetch models to see the current list. */
export function seedAiDefaults(db: AnyDB) {
  const s = db.$client;
  const tx = s.transaction(() => {
    const now = Date.now();
    const addProvider = (kind: string, name: string, baseUrl: string | null) =>
      db.insert(schema.providers).values({ kind, name, baseUrl, enabled: true, createdAt: now }).returning({ id: schema.providers.id }).get().id;
    const addModel = (providerId: number, modelId: string, label: string, inP: number, outP: number, ctx: number | null, notes: string) =>
      db.insert(schema.models).values({ providerId, modelId, label, inputPrice: inP, outputPrice: outP, contextWindow: ctx, maxOutput: 4096, notes, enabled: true, createdAt: now }).returning({ id: schema.models.id }).get().id;

    const anth = addProvider("anthropic", "Anthropic API", null);
    const haiku = addModel(anth, "claude-haiku-5-5", "Claude Haiku 5.5", 0.1, 0.5, 1_000_000, "Fast and cheap. Prices from the Claude pricing page, Nov 2026.");
    const sonnet = addModel(anth, "claude-sonnet-5-5", "Claude Sonnet 5.5", 2, 10, 1_000_000, "Balanced quality and cost.");
    const opus = addModel(anth, "claude-opus-5-5", "Claude Opus 5.5", 4, 20, 1_000_000, "Best for grading and deep reasoning.");

    addProvider("openrouter", "OpenRouter", "https://openrouter.ai/api/v1");

    const gem = addProvider("gemini", "Google Gemini", "https://generativelanguage.googleapis.com/v1beta/openai");
    addModel(gem, "gemini-3.8-flash", "Gemini 3.8 Flash", 0.75, 3.75, 1_048_576, "Has a free tier (free-tier data may be used by Google). Paid price shown.");
    addModel(gem, "gemini-3.5-flash-lite", "Gemini 3.5 Flash-Lite", 0.3, 2.5, 1_048_576, "Free tier available. Check the price on Google's pricing page.");

    const oll = addProvider("ollama", "Ollama (local)", "http://localhost:11434");
    addModel(oll, "qwen3:8b", "Qwen3 8B (local)", 0, 0, 32_768, "Free, runs on your PC. Download it on the Ollama card first.");
    const addEmbed = (providerId: number, modelId: string, label: string, inP: number, notes: string) =>
      db.insert(schema.models).values({ providerId, modelId, label, inputPrice: inP, outputPrice: 0, maxOutput: 4096, purpose: "embed", notes, enabled: true, createdAt: now }).run();
    addEmbed(oll, "nomic-embed-text", "Nomic Embed (local)", 0, "Free search model. Download it on the Ollama card first.");
    addEmbed(gem, "gemini-embedding-001", "Gemini Embedding", 0.15, "Search model. Check the price on Google's pricing page.");

    s.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('tiers',?)").run(JSON.stringify({ quick: haiku, balanced: sonnet, deep: opus }));
  });
  tx();
}
