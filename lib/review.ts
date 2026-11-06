// Spaced review with FSRS (ts-fsrs). One card per concept; every test answer is a review.
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";
import { eq } from "drizzle-orm";
import { getDb, schema as S } from "./db";
import type { Confidence, ReviewInfo } from "./types";

const scheduler = fsrs({ enable_fuzz: true, request_retention: 0.9 });

/** Multiple choice: right and certain is Easy; any wrong answer is Again. */
export function rateMcq(right: boolean, conf: Confidence): Grade {
  if (!right) return Rating.Again;
  return conf === "sure" ? Rating.Easy : conf === "fair" ? Rating.Good : Rating.Hard;
}
/** Essay: by score, with a guess never counting as Easy. */
export function rateEssay(score: number, conf: Confidence): Grade {
  if (score < 50) return Rating.Again;
  if (score < 70) return Rating.Hard;
  if (score >= 85 && conf !== "guess") return Rating.Easy;
  return Rating.Good;
}

function load(raw: string): Card {
  const c = JSON.parse(raw);
  return { ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined };
}

export function scheduleReview(conceptId: string, grade: Grade) {
  const db = getDb();
  const row = db.select().from(S.reviewCards).where(eq(S.reviewCards.conceptId, conceptId)).get();
  const now = new Date();
  const card = row ? load(row.fsrsStateJson) : createEmptyCard(now);
  const next = scheduler.next(card, now, grade).card;
  const json = JSON.stringify(next);
  const due = next.due.getTime();
  db.insert(S.reviewCards).values({ conceptId, fsrsStateJson: json, dueAt: due })
    .onConflictDoUpdate({ target: S.reviewCards.conceptId, set: { fsrsStateJson: json, dueAt: due } }).run();
  return due;
}

export function reviewInfo(): Map<string, ReviewInfo> {
  const rows = getDb().select().from(S.reviewCards).all();
  const m = new Map<string, ReviewInfo>();
  for (const r of rows) {
    try {
      const c = load(r.fsrsStateJson);
      m.set(r.conceptId, { due: r.dueAt, reps: c.reps, lapses: c.lapses, stability: Math.round(c.stability * 10) / 10, state: c.state, last: c.last_review ? c.last_review.getTime() : null });
    } catch { /* skip a broken card */ }
  }
  return m;
}
