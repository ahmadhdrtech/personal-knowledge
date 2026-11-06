// Blog platforms for the research-to-post flow. Client-safe (no database).
// Each platform sets sensible field limits and format rules; the user can change them in Settings → Your blog.
import type { Bi } from "./types";

export type BlogPlatform = "markdown" | "wordpress" | "ghost" | "medium" | "substack" | "static" | "custom";

export type BlogSettings = {
  platform: BlogPlatform;
  name: string; url: string; adminPath: string; lang: "en" | "id";
  audience: string; voice: string;
  titleMax: number; slugMax: number; excerptMax: number; tagsMax: number; // tagsMax = how many tags
  allowHtml: boolean;
  notes: string; // extra rules in the user's words
};

type Preset = { name: Bi; about: Bi; adminPath: string; excerpt: Bi; titleMax: number; slugMax: number; excerptMax: number; tagsMax: number; allowHtml: boolean; rules: string; hasSlug: boolean; hasTags: boolean };

export const PLATFORMS: Record<BlogPlatform, Preset> = {
  markdown: {
    name: { en: "Any Markdown blog or CMS", id: "Blog atau CMS Markdown apa pun" }, about: { en: "A safe default: plain Markdown that pastes into most editors.", id: "Pilihan aman: Markdown biasa yang bisa ditempel ke kebanyakan editor." },
    adminPath: "", excerpt: { en: "Summary", id: "Ringkasan" }, titleMax: 70, slugMax: 80, excerptMax: 160, tagsMax: 6, allowHtml: false, hasSlug: true, hasTags: true,
    rules: "Plain Markdown only: ## headings, short paragraphs, lists, tables, [links](https://…). No raw HTML. The page shows the title, so the body starts at ## level.",
  },
  wordpress: {
    name: { en: "WordPress", id: "WordPress" }, about: { en: "Paste the Markdown into the block editor; it converts headings, lists and links.", id: "Tempel Markdown ke editor blok; judul, daftar, dan tautan otomatis dikonversi." },
    adminPath: "/wp-admin/post-new.php", excerpt: { en: "Excerpt / meta description", id: "Kutipan / deskripsi meta" }, titleMax: 60, slugMax: 75, excerptMax: 155, tagsMax: 8, allowHtml: true, hasSlug: true, hasTags: true,
    rules: "Markdown that the WordPress block editor converts on paste: ## headings, lists, tables, links, images by URL. Keep the title under 60 characters and the meta description under 155 for search results.",
  },
  ghost: {
    name: { en: "Ghost", id: "Ghost" }, about: { en: "Paste into a Markdown card, or straight into the editor.", id: "Tempel ke kartu Markdown, atau langsung ke editor." },
    adminPath: "/ghost/#/editor/post", excerpt: { en: "Excerpt", id: "Kutipan" }, titleMax: 70, slugMax: 80, excerptMax: 300, tagsMax: 6, allowHtml: false, hasSlug: true, hasTags: true,
    rules: "Markdown for a Ghost Markdown card: ## headings, lists, links, images by URL. Custom excerpt up to 300 characters.",
  },
  medium: {
    name: { en: "Medium", id: "Medium" }, about: { en: "Medium has no slug field and allows up to 5 topics; the subtitle shows under the title.", id: "Medium tidak punya kolom slug dan maksimal 5 topik; subjudul tampil di bawah judul." },
    adminPath: "/new-story", excerpt: { en: "Subtitle", id: "Subjudul" }, titleMax: 100, slugMax: 80, excerptMax: 140, tagsMax: 5, allowHtml: false, hasSlug: false, hasTags: true,
    rules: "Medium-friendly Markdown: ## and ### headings only, short paragraphs, lists, links, block quotes. No tables (Medium doesn't support them): use a list instead. Code in ``` blocks.",
  },
  substack: {
    name: { en: "Substack", id: "Substack" }, about: { en: "A newsletter post: title, subtitle and body; no tags.", id: "Postingan newsletter: judul, subjudul, dan isi; tanpa tag." },
    adminPath: "/publish/post", excerpt: { en: "Subtitle", id: "Subjudul" }, titleMax: 80, slugMax: 80, excerptMax: 160, tagsMax: 0, allowHtml: false, hasSlug: true, hasTags: false,
    rules: "Substack-friendly Markdown: ## headings, short paragraphs, lists, links, block quotes. No tables. Written to be read in an email inbox: a strong first paragraph.",
  },
  static: {
    name: { en: "Static site (Hugo, Jekyll, Astro, Next.js…)", id: "Situs statis (Hugo, Jekyll, Astro, Next.js…)" }, about: { en: "Download the post as a .md file with front matter and drop it into your content folder.", id: "Unduh tulisan sebagai file .md dengan front matter, lalu taruh di folder konten situsmu." },
    adminPath: "", excerpt: { en: "Description", id: "Deskripsi" }, titleMax: 70, slugMax: 80, excerptMax: 160, tagsMax: 6, allowHtml: false, hasSlug: true, hasTags: true,
    rules: "Markdown for a static site generator: ## headings, lists, tables, fenced code blocks with a language, [links](https://…). The title, slug, description and tags go in the front matter, not the body.",
  },
  custom: {
    name: { en: "Custom (set your own rules)", id: "Kustom (atur aturanmu sendiri)" }, about: { en: "Your own site or admin form: set the limits and write the rules below.", id: "Situs atau form admin milikmu: atur batasnya dan tulis aturannya di bawah." },
    adminPath: "", excerpt: { en: "Summary", id: "Ringkasan" }, titleMax: 140, slugMax: 80, excerptMax: 300, tagsMax: 6, allowHtml: false, hasSlug: true, hasTags: true,
    rules: "Markdown. Follow the notes below.",
  },
};

export const DEFAULT_BLOG: BlogSettings = {
  platform: "markdown", name: "", url: "", adminPath: "", lang: "en",
  audience: "", voice: "Clear and friendly; explains simply with real examples",
  titleMax: 70, slugMax: 80, excerptMax: 160, tagsMax: 6, allowHtml: false, notes: "",
};

/** Settings with the platform's limits applied (used when the platform is changed). */
export function withPlatform(b: BlogSettings, p: BlogPlatform): BlogSettings {
  const x = PLATFORMS[p];
  return { ...b, platform: p, adminPath: b.adminPath && b.platform === p ? b.adminPath : x.adminPath, titleMax: x.titleMax, slugMax: x.slugMax, excerptMax: x.excerptMax, tagsMax: x.tagsMax, allowHtml: x.allowHtml };
}

/** The format rules Claude follows, in plain words. */
export function formatRules(b: BlogSettings): string {
  const x = PLATFORMS[b.platform] || PLATFORMS.markdown;
  const parts = [
    `Platform: ${x.name.en}. ${x.rules}`,
    `Title: at most ${b.titleMax} characters.`,
    x.hasSlug ? `Slug: lowercase words joined by hyphens, at most ${b.slugMax} characters.` : "No slug field.",
    `${x.excerpt.en}: at most ${b.excerptMax} characters; it makes people click.`,
    x.hasTags && b.tagsMax > 0 ? `Tags: up to ${b.tagsMax}, comma separated.` : "No tags.",
    b.allowHtml ? "HTML is allowed but prefer Markdown." : "No HTML: it would show as text or be removed.",
    "Links must start with https://.",
  ];
  if (b.notes.trim()) parts.push(`The writer's own rules: ${b.notes.trim()}`);
  return parts.join(" ");
}

/** Read stored settings, including those saved by older versions (which had one free-text `format`). */
export function normalizeBlog(raw: Record<string, unknown> | null | undefined): BlogSettings {
  const r = raw || {};
  const legacy = typeof r.format === "string" && !r.platform;
  const platform = (legacy ? "custom" : (r.platform as BlogPlatform)) in PLATFORMS ? ((legacy ? "custom" : r.platform) as BlogPlatform) : DEFAULT_BLOG.platform;
  const base = withPlatform({ ...DEFAULT_BLOG }, platform);
  const num = (v: unknown, d: number, max: number) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.min(max, Math.round(Number(v))) : d);
  const str = (v: unknown, d: string, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : d);
  const out: BlogSettings = {
    platform,
    name: str(r.name, base.name, 120), url: str(r.url, base.url, 200).replace(/\/+$/, ""),
    adminPath: str(r.adminPath, base.adminPath, 160), lang: r.lang === "id" ? "id" : r.lang === "en" ? "en" : base.lang,
    audience: str(r.audience, base.audience, 400), voice: str(r.voice, base.voice, 300),
    titleMax: num(r.titleMax, legacy ? 140 : base.titleMax, 300), slugMax: num(r.slugMax, base.slugMax, 200),
    excerptMax: num(r.excerptMax, legacy ? 300 : base.excerptMax, 1000), tagsMax: num(r.tagsMax, base.tagsMax, 30),
    allowHtml: typeof r.allowHtml === "boolean" ? r.allowHtml : base.allowHtml,
    notes: str(legacy ? r.format : r.notes, base.notes, 1500),
  };
  // older versions kept the blog section separately; fold it into the address
  if (legacy && typeof r.section === "string" && r.section && out.url && !out.url.endsWith(r.section)) out.notes = `Posts live under ${r.section}. ${out.notes}`.trim();
  return out;
}

/** A .md file with YAML front matter, for static sites or keeping a copy. */
export function toMarkdownFile(p: { title: string; body: string; slug: string; excerpt: string; tags: string; coverUrl: string; sources: { title: string; url?: string }[] }, date = new Date()) {
  const q = (s: string) => JSON.stringify(s);
  const tags = p.tags.split(",").map((t) => t.trim()).filter(Boolean);
  const fm = [
    "---", `title: ${q(p.title)}`, `slug: ${q(p.slug)}`, `date: ${date.toISOString().slice(0, 10)}`,
    p.excerpt ? `description: ${q(p.excerpt)}` : null,
    tags.length ? `tags: [${tags.map(q).join(", ")}]` : null,
    p.coverUrl ? `cover: ${q(p.coverUrl)}` : null,
    "draft: true", "---", "",
  ].filter((x) => x != null).join("\n");
  return fm + p.body.trim() + "\n";
}
