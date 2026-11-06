// Learning rules shared by server and client. Ported from the prototype.
import type { Bi, Concept, Confidence, Lang, Link, LinkType } from "./types";

export const TYPES: Record<LinkType, { say: Bi; dir: boolean; name: Bi }> = {
  prerequisite: { say: { en: "is needed for", id: "dibutuhkan untuk" }, dir: true, name: { en: "Needed for", id: "Dibutuhkan untuk" } },
  part_of: { say: { en: "is part of", id: "bagian dari" }, dir: true, name: { en: "Part of", id: "Bagian dari" } },
  causes: { say: { en: "leads to", id: "menyebabkan" }, dir: true, name: { en: "Leads to", id: "Menyebabkan" } },
  contrasts: { say: { en: "contrasts with", id: "berlawanan dengan" }, dir: false, name: { en: "Contrasts", id: "Berlawanan" } },
  example_of: { say: { en: "is an example of", id: "contoh dari" }, dir: true, name: { en: "Example of", id: "Contoh dari" } },
  related: { say: { en: "relates to", id: "berkaitan dengan" }, dir: false, name: { en: "Related", id: "Berkaitan" } },
};
export const LINK_TYPES = Object.keys(TYPES) as LinkType[];

export const CONF: { k: Confidence; en: string; id: string }[] = [
  { k: "guess", en: "Guessing", id: "Menebak" },
  { k: "fair", en: "Fairly sure", id: "Cukup yakin" },
  { k: "sure", en: "Certain", id: "Yakin sekali" },
];

export const LEVEL_NAME = {
  unseen: { en: "Not studied", id: "Belum dipelajari" },
  shaky: { en: "Shaky", id: "Goyah" },
  solid: { en: "Solid", id: "Kuat" },
} as const;
export type Level = keyof typeof LEVEL_NAME;
export const level = (m: number): Level => (m === 0 ? "unseen" : m < 60 ? "shaky" : "solid");

/** Confidence-based marking for multiple choice. */
export const CBM = {
  right: { guess: 6, fair: 14, sure: 20 },
  wrong: { guess: 0, fair: -8, sure: -18 },
} as const;

export const VERDICT: Record<string, [Bi, Bi]> = {
  "right-sure": [{ en: "Solid.", id: "Mantap." }, { en: "You knew it, and you knew that you knew it.", id: "Kamu tahu jawabannya, dan kamu sadar kamu tahu." }],
  "right-fair": [{ en: "Correct.", id: "Benar." }, { en: "Your confidence is catching up with your knowledge.", id: "Rasa yakinmu mulai menyusul pengetahuanmu." }],
  "right-guess": [{ en: "Lucky guess.", id: "Tebakan beruntung." }, { en: "Right answer, low confidence. It stays in your review queue until you answer it with confidence.", id: "Jawabannya benar, tapi kamu kurang yakin. Konsep ini tetap di antrean review sampai kamu menjawabnya dengan yakin." }],
  "wrong-guess": [{ en: "Honest gap.", id: "Celah yang jujur." }, { en: "You knew you didn’t know. That’s the easiest kind of gap to fix.", id: "Kamu sadar belum tahu. Celah seperti ini paling mudah ditutup." }],
  "wrong-fair": [{ en: "Shaky.", id: "Masih goyah." }, { en: "Read the explanation, then try again later.", id: "Baca penjelasannya, lalu coba lagi nanti." }],
  "wrong-sure": [{ en: "Misconception flagged.", id: "Miskonsepsi ditandai." }, { en: "You were certain and wrong, so this concept moves to the top of your review.", id: "Kamu yakin tapi salah, jadi konsep ini naik ke urutan teratas review." }],
};

export function mcqDelta(right: boolean, conf: Confidence, bridge: boolean) {
  let d: number = CBM[right ? "right" : "wrong"][conf];
  if (right && bridge && conf !== "guess") d += 5;
  return d;
}

/** Essay: ((score − 50) / 50 × 20) × confidence multiplier. */
export function essayDelta(score: number, conf: Confidence) {
  const raw = ((score - 50) / 50) * 20;
  const mult = raw >= 0 ? { guess: 0.5, fair: 0.85, sure: 1.1 }[conf] : { guess: 0.3, fair: 0.8, sure: 1.3 }[conf];
  return Math.round(raw * mult);
}

export const clampMastery = (m: number) => Math.max(0, Math.min(100, Math.round(m)));

/* ---------- text helpers ---------- */
export function T(o: Bi | string | null | undefined, lang: Lang): string {
  if (!o) return "";
  if (typeof o === "string") return o;
  return lang === "id" ? o.id || o.en || "" : o.en || o.id || "";
}

export function slug(s: string) {
  return (
    String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "c"
  );
}

/* ---------- graph queries ---------- */
export function neighbors(links: Link[], id: string) {
  const s = new Set([id]);
  links.forEach((l) => {
    if (l.from === id) s.add(l.to);
    if (l.to === id) s.add(l.from);
  });
  return s;
}

/** Is a concept due now? Misconceptions always are; scheduled ones when their date has come; unscheduled ones while below 60%. */
export function isDue(c: Concept, now = Date.now()) {
  if (c.miscon) return true;
  if (c.review) return c.review.due <= now;
  return c.mastery < 60;
}

/** Review queue: misconceptions first, then scheduled reviews that are most overdue, then weak concepts never reviewed. */
export function due(concepts: Concept[], now = Date.now()) {
  const rank = (c: Concept) => (c.miscon ? 0 : c.review ? 1 : 2);
  return concepts.filter((c) => isDue(c, now)).sort((a, b) =>
    rank(a) - rank(b) || (a.review && b.review ? a.review.due - b.review.due : 0) || a.mastery - b.mastery);
}

/** Scheduled reviews still in the future, soonest first. */
export function upcoming(concepts: Concept[], now = Date.now()) {
  return concepts.filter((c) => !c.miscon && c.review && c.review.due > now).sort((a, b) => a.review!.due - b.review!.due);
}

export type PathStep = { id: string; type: LinkType | null };

/** Walk back through incoming prerequisite and part_of links. */
export function chainBack(links: Link[], id: string, seen = new Set([id])): PathStep[] {
  const out: PathStep[] = [];
  links
    .filter((l) => l.status === "approved" && l.to === id && (l.type === "prerequisite" || l.type === "part_of"))
    .forEach((l) => {
      if (seen.has(l.from)) return;
      seen.add(l.from);
      out.push(...chainBack(links, l.from, seen), { id: l.from, type: l.type });
    });
  return out;
}

/** Then forward through causes and prerequisite. */
export function chainFwd(links: Link[], id: string, seen = new Set([id])): PathStep[] {
  const out: PathStep[] = [];
  links
    .filter((l) => l.status === "approved" && l.from === id && (l.type === "causes" || l.type === "prerequisite"))
    .forEach((l) => {
      if (seen.has(l.to)) return;
      seen.add(l.to);
      out.push({ id: l.to, type: l.type }, ...chainFwd(links, l.to, seen));
    });
  return out;
}
