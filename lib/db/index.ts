import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { seedDemo, seedAiDefaults } from "./seed";

// NEURON_DATA_DIR lets the MCP server (started by Claude Desktop from another folder) find the same database.
export const DATA_DIR = process.env.NEURON_DATA_DIR || path.join(process.cwd(), "data");
export const DB_PATH = path.join(DATA_DIR, "neuron.db");

// Tables are created with plain SQL so the app works right after `bun install`,
// with no migration step. Keep this in sync with schema.ts.
const INIT_SQL = `
CREATE TABLE IF NOT EXISTS domains (key TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_id TEXT NOT NULL, color_index INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS concepts (id TEXT PRIMARY KEY, label_en TEXT NOT NULL, label_id TEXT NOT NULL DEFAULT '', summary_en TEXT NOT NULL DEFAULT '', summary_id TEXT NOT NULL DEFAULT '', user_definition TEXT, mastery INTEGER NOT NULL DEFAULT 0, misconception INTEGER NOT NULL DEFAULT 0, auto INTEGER NOT NULL DEFAULT 0, origin_source_id INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS concept_domains (concept_id TEXT NOT NULL, domain_key TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (concept_id, domain_key));
CREATE TABLE IF NOT EXISTS sources (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'text', url_or_path TEXT, text TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, source_id INTEGER NOT NULL, idx INTEGER NOT NULL, text TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS concept_sources (id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id TEXT NOT NULL, source_id INTEGER NOT NULL, chunk_id INTEGER, note TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, from_id TEXT NOT NULL, to_id TEXT NOT NULL, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'suggested', why_en TEXT, why_id TEXT, source_id INTEGER, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS vocab (id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id TEXT NOT NULL, term_en TEXT NOT NULL, term_id TEXT NOT NULL, example TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id TEXT NOT NULL, kind TEXT NOT NULL, payload_json TEXT NOT NULL, bridge_concept_id TEXT, ai_generated INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id TEXT NOT NULL, question_id INTEGER, kind TEXT NOT NULL, correct INTEGER NOT NULL, score INTEGER, confidence TEXT NOT NULL, mastery_delta INTEGER NOT NULL, answer_text TEXT, feedback_json TEXT, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS glossary (term TEXT PRIMARY KEY, definition TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS chats (id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS review_cards (concept_id TEXT PRIMARY KEY, fsrs_state_json TEXT NOT NULL, due_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS providers (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, name TEXT NOT NULL, base_url TEXT, api_key TEXT, enabled INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS models (id INTEGER PRIMARY KEY AUTOINCREMENT, provider_id INTEGER NOT NULL, model_id TEXT NOT NULL, label TEXT NOT NULL, input_price REAL NOT NULL DEFAULT 0, output_price REAL NOT NULL DEFAULT 0, context_window INTEGER, max_output INTEGER NOT NULL DEFAULT 4096, notes TEXT, enabled INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS usage_log (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL, provider_id INTEGER, provider_kind TEXT NOT NULL, provider_name TEXT NOT NULL, model_row_id INTEGER, model_id TEXT NOT NULL, feature TEXT NOT NULL, depth TEXT NOT NULL, concept_id TEXT, input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0, estimated INTEGER NOT NULL DEFAULT 0, cost_usd REAL NOT NULL DEFAULT 0, latency_ms INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL, error TEXT);
CREATE INDEX IF NOT EXISTS idx_links_from ON links(from_id);
CREATE INDEX IF NOT EXISTS idx_links_to ON links(to_id);
CREATE INDEX IF NOT EXISTS idx_attempts_concept ON attempts(concept_id);
CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_chats_concept ON chats(concept_id);
`;

/** Add columns introduced after the first release, without touching existing data. */
function migrate(sqlite: Database.Database) {
  const has = (table: string, col: string) => (sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).some((c) => c.name === col);
  if (!has("chunks", "page")) sqlite.exec("ALTER TABLE chunks ADD COLUMN page INTEGER");
  if (!has("concept_sources", "quote")) sqlite.exec("ALTER TABLE concept_sources ADD COLUMN quote TEXT");
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source_id)");
  // writing and discussion notes saved from Claude Desktop (kept when the map is emptied)
  sqlite.exec("CREATE TABLE IF NOT EXISTS writings (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL DEFAULT 'writing', title TEXT NOT NULL, body TEXT NOT NULL, brief_json TEXT NOT NULL DEFAULT '{}', concept_ids TEXT NOT NULL DEFAULT '[]', lang TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)");
  // "Teach me" lessons: goal, what the learner already knew, the plan and each taught step (kept when the map is emptied)
  sqlite.exec("CREATE TABLE IF NOT EXISTS lessons (id INTEGER PRIMARY KEY AUTOINCREMENT, goal TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'probing', start_summary TEXT, probe_json TEXT NOT NULL DEFAULT '[]', steps_json TEXT NOT NULL DEFAULT '[]', current INTEGER NOT NULL DEFAULT 0, summary TEXT, next_json TEXT NOT NULL DEFAULT '[]', lang TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)");
  // "Study a source": questions placed after passages, and passages rewritten simpler / with the learner's interests / deeper (kept when the map is emptied only if the source survives)
  sqlite.exec("CREATE TABLE IF NOT EXISTS study_items (id INTEGER PRIMARY KEY AUTOINCREMENT, source_id INTEGER NOT NULL, chunk_id INTEGER NOT NULL, concept_id TEXT, lang TEXT, question TEXT NOT NULL, options_json TEXT NOT NULL, answer INTEGER NOT NULL, why TEXT, by TEXT NOT NULL DEFAULT 'app', choice INTEGER, correct INTEGER, confidence TEXT, answered_at INTEGER, created_at INTEGER NOT NULL)");
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_study_items_source ON study_items(source_id)");
  sqlite.exec("CREATE TABLE IF NOT EXISTS study_adapt (chunk_id INTEGER NOT NULL, mode TEXT NOT NULL, lang TEXT NOT NULL, source_id INTEGER NOT NULL, text TEXT NOT NULL, by TEXT NOT NULL DEFAULT 'app', created_at INTEGER NOT NULL, PRIMARY KEY (chunk_id, mode, lang))");
  // claims under each concept: what the concept says, the reasons behind it, where it comes from, and whether it checks out
  sqlite.exec("CREATE TABLE IF NOT EXISTS claims (id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id TEXT NOT NULL, text TEXT NOT NULL, because_json TEXT NOT NULL DEFAULT '[]', source_id INTEGER, chunk_id INTEGER, quote TEXT, status TEXT NOT NULL DEFAULT 'unchecked', note TEXT, evidence TEXT, checked_by TEXT, checked_at INTEGER, by TEXT NOT NULL DEFAULT 'ai', lang TEXT, position INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)");
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_claims_concept ON claims(concept_id)");
  if (!has("writings", "post_json")) sqlite.exec("ALTER TABLE writings ADD COLUMN post_json TEXT");
  sqlite.exec("CREATE TABLE IF NOT EXISTS embeddings (kind TEXT NOT NULL, ref_id TEXT NOT NULL, model TEXT NOT NULL, hash TEXT NOT NULL, vector BLOB NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (kind, ref_id))");
  if (!has("models", "purpose")) {
    sqlite.exec("ALTER TABLE models ADD COLUMN purpose TEXT NOT NULL DEFAULT 'chat'");
    // add the default embedding models for installs made before search existed
    const now = Date.now();
    const prov = (kind: string) => sqlite.prepare("SELECT id FROM providers WHERE kind = ? ORDER BY id LIMIT 1").get(kind) as { id: number } | undefined;
    const add = (pid: number | undefined, modelId: string, label: string, price: number, notes: string) => {
      if (pid) sqlite.prepare("INSERT INTO models (provider_id, model_id, label, input_price, output_price, context_window, max_output, purpose, notes, enabled, created_at) VALUES (?, ?, ?, ?, 0, NULL, 4096, 'embed', ?, 1, ?)").run(pid, modelId, label, price, notes, now);
    };
    add(prov("ollama")?.id, "nomic-embed-text", "Nomic Embed (local)", 0, "Free search model. Download it on the Ollama card first.");
    add(prov("gemini")?.id, "gemini-embedding-001", "Gemini Embedding", 0.15, "Search model. Check the price on Google's pricing page.");
  }
}

export type DB = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

function open(): DB {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000"); // the app and the MCP server can write at the same time
  sqlite.pragma("foreign_keys = OFF");
  sqlite.exec(INIT_SQL);
  migrate(sqlite);
  const db = drizzle(sqlite, { schema }) as DB;
  const count = sqlite.prepare("SELECT COUNT(*) AS n FROM concepts").get() as { n: number };
  const seeded = sqlite.prepare("SELECT value FROM settings WHERE key='seeded'").get();
  if (!seeded && count.n === 0) {
    seedDemo(db);
    sqlite.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('seeded','1')").run();
  }
  const prov = sqlite.prepare("SELECT COUNT(*) AS n FROM providers").get() as { n: number };
  if (prov.n === 0) seedAiDefaults(db);
  return db;
}

// Reuse one connection across hot reloads in development.
const g = globalThis as unknown as { __neuronDb?: DB };
export function getDb(): DB {
  if (!g.__neuronDb) g.__neuronDb = open();
  return g.__neuronDb;
}

export { schema };
