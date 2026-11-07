"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGraph } from "./store";
import Logo from "./Logo";
import { due } from "@/lib/logic";
import type { Depth, Lang } from "@/lib/types";

const I = {
  map: <path d="M12 12l-6-5M12 12l6-4M12 12l-1 7M12 12l7 4" />,
  dash: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
  claims: <><path d="M9 12l2 2 4-4" /><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></>,
  study: <><path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4z" /><path d="M20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z" /></>,
  lesson: <><path d="M3 7l9-4 9 4-9 4z" /><path d="M7 9v5c0 1.5 2.2 3 5 3s5-1.5 5-3V9" /><path d="M21 7v6" /></>,
  review: <><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v4h4" /><path d="M12 8v4l3 2" /></>,
  sources: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4M9 12h7M9 16h7" /></>,
  gloss: <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11" /></>,
  models: <><rect x="5" y="5" width="14" height="14" rx="2" /><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" /><rect x="9" y="9" width="6" height="6" rx="1" /></>,
  views: <><circle cx="12" cy="12" r="9" /><path d="M12 3v9l7 5" /><path d="M12 12L4.5 16.5" /></>,
  write: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></>,
  connect: <><path d="M9 7V3M15 7V3" /><path d="M6 7h12v4a6 6 0 0 1-12 0z" /><path d="M12 17v4" /></>,
  usage: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  guide: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7" /><circle cx="12" cy="16.5" r=".6" fill="currentColor" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
};
const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

export default function Sidebar() {
  const path = usePathname();
  const { graph, act, t } = useGraph();
  const dueN = graph ? due(graph.concepts).length : 0;
  const misN = graph ? graph.concepts.filter((c) => c.miscon).length : 0;
  const pending = graph ? graph.links.filter((l) => l.status === "suggested").length : 0;

  const groups: { title: string; items: { href: string; label: string; icon: React.ReactNode; count?: number; hot?: boolean }[] }[] = [
    { title: t("Learn", "Belajar"), items: [
      { href: "/", label: t("Map", "Peta"), icon: I.map, count: pending || undefined },
      { href: "/lessons", label: t("Lessons", "Pelajaran"), icon: I.lesson },
      { href: "/study", label: t("Study", "Belajar"), icon: I.study },
      { href: "/views", label: t("Views", "Tampilan"), icon: I.views },
      { href: "/dashboard", label: t("Dashboard", "Dasbor"), icon: I.dash },
      { href: "/review", label: t("Review", "Review"), icon: I.review, count: dueN || undefined, hot: misN > 0 },
    ] },
    { title: t("Knowledge", "Pengetahuan"), items: [
      { href: "/sources", label: t("Sources", "Sumber"), icon: I.sources },
      { href: "/claims", label: t("Claims", "Klaim"), icon: I.claims },
      { href: "/glossary", label: t("Glossary", "Glosarium"), icon: I.gloss, count: graph?.glossary.length || undefined },
      { href: "/writing", label: t("Writing", "Tulisan"), icon: I.write },
    ] },
    { title: "AI", items: [
      { href: "/models", label: t("Models", "Model"), icon: I.models },
      { href: "/usage", label: t("Usage", "Pemakaian"), icon: I.usage },
      { href: "/connect", label: "Claude Desktop", icon: I.connect },
    ] },
    { title: t("App", "Aplikasi"), items: [
      { href: "/guide", label: t("Guide", "Panduan"), icon: I.guide },
      { href: "/settings", label: t("Settings", "Pengaturan"), icon: I.settings },
    ] },
  ];
  const isOn = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const depthName = { quick: t("Quick", "Cepat"), balanced: t("Balanced", "Seimbang"), deep: t("Deep reasoning", "Penalaran mendalam") };

  return (
    <nav className="side" aria-label={t("Main menu", "Menu utama")}>
      <div className="brand"><Logo />Neuron</div>
      {groups.map((g) => (
        <div className="nav" key={g.title}>
          <div className="nav-group">{g.title}</div>
          {g.items.map((it) => (
            <Link key={it.href} href={it.href} data-tour={`nav-${it.href.slice(1) || "map"}`} aria-current={isOn(it.href) ? "page" : undefined}>
              <Icon d={it.icon} />{it.label}
              {it.count ? <span className={`count${it.hot ? " hot" : ""}`}>{it.count}</span> : null}
            </Link>
          ))}
        </div>
      ))}
      {graph && (
        <div className="side-foot">
          <div className="seg" role="group" data-tour="sidebar-lang" aria-label={t("Language", "Bahasa")}>
            {(["en", "id"] as Lang[]).map((l) => (
              <button key={l} aria-pressed={graph.prefs.lang === l} onClick={() => act("prefs", { prefs: { lang: l } })}>{l === "en" ? "English" : "Indonesia"}</button>
            ))}
          </div>
          <label className="sel-wrap" data-tour="sidebar-depth">{t("AI depth", "Tingkat AI")}
            <select value={graph.prefs.depth} onChange={(e) => act("prefs", { prefs: { depth: e.target.value as Depth } })}>
              {(["quick", "balanced", "deep"] as Depth[]).map((d) => <option key={d} value={d}>{depthName[d]}</option>)}
            </select>
          </label>
          <Link href="/models" className="muted small" style={{ textDecoration: "none" }}>
            <span className={`ai-dot${graph.ai.tiers[graph.prefs.depth] ? " on" : ""}`} />
            {graph.ai.tiers[graph.prefs.depth] || t("No model set", "Belum ada model")}
          </Link>
        </div>
      )}
    </nav>
  );
}
