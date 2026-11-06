import { sqliteTable, text, integer, real, primaryKey, blob } from "drizzle-orm/sqlite-core";

const now = () => Date.now();

export const domains = sqliteTable("domains", {
  key: text("key").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameId: text("name_id").notNull(),
  colorIndex: integer("color_index").notNull().default(0),
});

export const concepts = sqliteTable("concepts", {
  id: text("id").primaryKey(),
  labelEn: text("label_en").notNull(),
  labelId: text("label_id").notNull().default(""),
  summaryEn: text("summary_en").notNull().default(""),
  summaryId: text("summary_id").notNull().default(""),
  userDefinition: text("user_definition"),
  mastery: integer("mastery").notNull().default(0),
  misconception: integer("misconception", { mode: "boolean" }).notNull().default(false),
  auto: integer("auto", { mode: "boolean" }).notNull().default(false),
  originSourceId: integer("origin_source_id"),
  createdAt: integer("created_at").notNull().$defaultFn(now),
  updatedAt: integer("updated_at").notNull().$defaultFn(now),
});

export const conceptDomains = sqliteTable(
  "concept_domains",
  {
    conceptId: text("concept_id").notNull(),
    domainKey: text("domain_key").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.conceptId, t.domainKey] })],
);

export const sources = sqliteTable("sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("text"), // text | note | pdf | docx | url | youtube
  urlOrPath: text("url_or_path"),
  text: text("text").notNull().default(""),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

export const chunks = sqliteTable("chunks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceId: integer("source_id").notNull(),
  idx: integer("idx").notNull(),
  page: integer("page"),
  text: text("text").notNull(),
});

export const conceptSources = sqliteTable("concept_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: text("concept_id").notNull(),
  sourceId: integer("source_id").notNull(),
  chunkId: integer("chunk_id"),
  note: text("note").notNull().default(""),
  quote: text("quote"),
});

export const links = sqliteTable("links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromId: text("from_id").notNull(),
  toId: text("to_id").notNull(),
  type: text("type").notNull(), // prerequisite | part_of | causes | contrasts | example_of | related
  status: text("status").notNull().default("suggested"), // suggested | approved
  whyEn: text("why_en"),
  whyId: text("why_id"),
  sourceId: integer("source_id"),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

export const vocab = sqliteTable("vocab", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: text("concept_id").notNull(),
  termEn: text("term_en").notNull(),
  termId: text("term_id").notNull(),
  example: text("example").notNull().default(""),
});

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: text("concept_id").notNull(),
  kind: text("kind").notNull(), // mcq | essay
  payloadJson: text("payload_json").notNull(),
  bridgeConceptId: text("bridge_concept_id"),
  aiGenerated: integer("ai_generated", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

export const attempts = sqliteTable("attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: text("concept_id").notNull(),
  questionId: integer("question_id"),
  kind: text("kind").notNull(),
  correct: integer("correct", { mode: "boolean" }).notNull(),
  score: integer("score"),
  confidence: text("confidence").notNull(), // guess | fair | sure
  masteryDelta: integer("mastery_delta").notNull(),
  answerText: text("answer_text"),
  feedbackJson: text("feedback_json"),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

export const glossary = sqliteTable("glossary", {
  term: text("term").primaryKey(),
  definition: text("definition").notNull(),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

export const chats = sqliteTable("chats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: text("concept_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

export const reviewCards = sqliteTable("review_cards", {
  conceptId: text("concept_id").primaryKey(),
  fsrsStateJson: text("fsrs_state_json").notNull(),
  dueAt: integer("due_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/* ---------- AI: providers, models, usage ---------- */

export const providers = sqliteTable("providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(), // anthropic | openrouter | gemini | ollama | openai_compatible
  name: text("name").notNull(),
  baseUrl: text("base_url"),
  apiKey: text("api_key"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

export const models = sqliteTable("models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  providerId: integer("provider_id").notNull(),
  modelId: text("model_id").notNull(),
  label: text("label").notNull(),
  inputPrice: real("input_price").notNull().default(0), // USD per 1M input tokens
  outputPrice: real("output_price").notNull().default(0), // USD per 1M output tokens
  contextWindow: integer("context_window"),
  maxOutput: integer("max_output").notNull().default(4096),
  purpose: text("purpose").notNull().default("chat"), // chat | embed
  notes: text("notes"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

export const usageLog = sqliteTable("usage_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: integer("created_at").notNull().$defaultFn(now),
  providerId: integer("provider_id"),
  providerKind: text("provider_kind").notNull(),
  providerName: text("provider_name").notNull(),
  modelRowId: integer("model_row_id"),
  modelId: text("model_id").notNull(),
  feature: text("feature").notNull(), // import | vocab | mcq | essay_question | essay_grade | discuss | test
  depth: text("depth").notNull(),
  conceptId: text("concept_id"),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  estimated: integer("estimated", { mode: "boolean" }).notNull().default(false),
  costUsd: real("cost_usd").notNull().default(0),
  latencyMs: integer("latency_ms").notNull().default(0),
  status: text("status").notNull(), // ok | error | aborted
  error: text("error"),
});

/** Vectors for semantic search. kind: concept | chunk. */
export const embeddings = sqliteTable(
  "embeddings",
  {
    kind: text("kind").notNull(),
    refId: text("ref_id").notNull(),
    model: text("model").notNull(),
    hash: text("hash").notNull(),
    vector: blob("vector", { mode: "buffer" }).notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.kind, t.refId] })],
);

/** Writing and discussion notes saved from Claude Desktop. kind: writing | note. */
export const writings = sqliteTable("writings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull().default("writing"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  briefJson: text("brief_json").notNull().default("{}"),
  conceptIds: text("concept_ids").notNull().default("[]"),
  lang: text("lang"),
  postJson: text("post_json"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
