// Shared types. Safe to import from client and server code.

export type Bi = { en: string; id: string };
export type Lang = "en" | "id";
export type View = "network" | "domains";
export type Depth = "quick" | "balanced" | "deep";
export type Confidence = "guess" | "fair" | "sure";
export type LinkType = "prerequisite" | "part_of" | "causes" | "contrasts" | "example_of" | "related";
export type Theme = "system" | "light" | "dark";

export interface Domain { key: string; name: Bi; color: number }

export interface SourceRef { sourceId: number; title: string; note: string; quote: string | null; chunkId: number | null; page: number | null }
export interface ReviewInfo { due: number; reps: number; lapses: number; stability: number; state: number; last: number | null }
export interface VocabItem { vid: number; en: string; ind: string; ex: string }

export interface McqQuestion {
  qid: number;
  q: Bi;
  o: Bi[];
  a: number;
  why: Bi;
  bridge: string | null;
  ai: boolean;
}

export interface Concept {
  id: string;
  label: Bi;
  summary: Bi;
  userDef: string | null;
  mastery: number;
  miscon: boolean;
  auto: boolean;
  origin: string | null;
  domains: string[];
  sources: SourceRef[];
  vocab: VocabItem[];
  quiz: McqQuestion[];
  attempts: number;
  review: ReviewInfo | null;
}

export interface Link {
  lid: number;
  from: string;
  to: string;
  type: LinkType;
  status: "suggested" | "approved";
  why: Bi | null;
}

export interface GlossaryItem { term: string; definition: string }

export interface ImportReport {
  title: string;
  sourceId: number | null;
  added: string[];
  merged: string[];
  domains: string[];
  links: number[];
  unknown: string[];
  /** New concepts merged into an existing one because they meant the same thing. */
  similar?: { label: string; into: string; score: number }[];
  at: number;
}

export interface Prefs { lang: Lang; view: View; depth: Depth; theme: Theme }

export interface Calibration {
  total: number;
  sure: { n: number; right: number };
  fair: { n: number; right: number };
  guess: { n: number; right: number };
}

export interface Graph {
  domains: Domain[];
  concepts: Concept[];
  links: Link[];
  glossary: GlossaryItem[];
  lastImport: ImportReport | null;
  prefs: Prefs;
  calibration: Calibration;
  ai: { ready: boolean; tiers: Record<Depth, string | null> };
  demoOffline: boolean;
  profile: Profile;
  blog: BlogSettings;
}

export interface SourceRow { id: number; title: string; kind: string; urlOrPath: string | null; createdAt: number; words: number; chunks: number; concepts: { id: string; label: Bi }[] }

/* ---------- AI config ---------- */
export type ProviderKind = "anthropic" | "openrouter" | "gemini" | "ollama" | "openai_compatible";

export interface ProviderRow {
  id: number;
  kind: ProviderKind;
  name: string;
  baseUrl: string | null;
  hasKey: boolean;
  keySource: "app" | "env" | "none";
  keyHint: string | null;
  enabled: boolean;
}

export interface ModelRow {
  id: number;
  providerId: number;
  modelId: string;
  label: string;
  inputPrice: number;
  outputPrice: number;
  contextWindow: number | null;
  maxOutput: number;
  purpose: "chat" | "embed";
  notes: string | null;
  enabled: boolean;
}

export interface UsageRow {
  id: number;
  createdAt: number;
  providerName: string;
  providerKind: string;
  modelId: string;
  feature: string;
  depth: string;
  conceptId: string | null;
  inputTokens: number;
  outputTokens: number;
  estimated: boolean;
  costUsd: number;
  latencyMs: number;
  status: string;
  error: string | null;
}

/** Blog fields for a piece meant for the blog (matches the portfolio admin form). */
export type PostFields = { slug: string; excerpt: string; tags: string; coverUrl: string; sources: { title: string; url?: string }[] };
export type Writing = { id: number; kind: "writing" | "note"; title: string; body: string; brief: Record<string, string>; conceptIds: string[]; lang: string | null; post: PostFields | null; createdAt: number; updatedAt: number };

/** Who the learner is. Goes into every AI prompt so examples fit their interests. */
export type Profile = { name: string; about: string; interests: string; examples: string };
/** Where research turns into posts (Writing menu and the Claude Desktop blog flow). */
export type BlogSettings = { name: string; url: string; section: string; adminPath: string; lang: "en" | "id"; audience: string; voice: string; format: string };

/** One question asked to find what the learner already understands. */
export type ProbeItem = { concept: string | null; question: string; answer: string; verdict: "knows" | "partly" | "gap" | "misconception"; confidence?: Confidence | null; note?: string };
export type LessonCheck = { question: string; options?: string[]; answer_index?: number; why?: string };
export type LessonResult = { correct: boolean; confidence: Confidence; answer?: string; misconception?: string; feedback?: string; at: number; by: "claude" | "app" };
export type LessonStep = {
  title: string; concept: string | null; why?: string;
  status: "todo" | "teaching" | "passed" | "needs_review";
  predict?: string; prediction?: string; explanation?: string; check?: LessonCheck; result?: LessonResult;
};
export type Lesson = { id: number; goal: string; status: "probing" | "active" | "done"; startSummary: string | null; probe: ProbeItem[]; steps: LessonStep[]; current: number; summary: string | null; next: string[]; lang: string | null; createdAt: number; updatedAt: number };
