"use client";
import Link from "next/link";
import { useGraph } from "./store";
import { domainColor, Dot, fmtRel, LinkSentence, NodeBtn } from "./ui";
import { TeachBox } from "./ConceptPanel";
import { due, level, LEVEL_NAME, upcoming } from "@/lib/logic";

export function MasteryBlock() {
  const { graph, T } = useGraph();
  const c = { solid: 0, shaky: 0, unseen: 0 };
  graph!.concepts.forEach((n) => c[level(n.mastery)]++);
  return (
    <>
      <div className="stack">{(["solid", "shaky", "unseen"] as const).map((l) => <div key={l} style={{ flex: c[l], background: `var(--${l})` }} />)}</div>
      <div className="keys">{(["solid", "shaky", "unseen"] as const).map((l) => <span key={l}><Dot color={`var(--${l})`} /> {T(LEVEL_NAME[l])} {c[l]}</span>)}</div>
    </>
  );
}

export function CalibrationBlock() {
  const { graph, t } = useGraph();
  const k = graph!.calibration;
  const pct = (b: { n: number; right: number }) => (b.n ? Math.round((b.right / b.n) * 100) : null);
  const ps = pct(k.sure), pg = pct(k.guess);
  if (!k.total) return <p className="muted">{t("Each answer asks how sure you are. Over time this shows whether you really know a concept or are guessing.", "Setiap jawaban menanyakan seberapa yakin kamu. Lama-lama ini menunjukkan apakah kamu benar-benar paham atau hanya menebak.")}</p>;
  return (
    <>
      <p className="small" style={{ margin: "0 0 4px" }}>{ps != null
        ? <>{t("When you’re certain, you’re right", "Saat kamu yakin sekali, kamu benar")} <strong>{ps}%</strong> {t(`of the time (${k.sure.n} answers).`, `dari waktu (${k.sure.n} jawaban).`)}</>
        : t("You haven’t answered with “Certain” yet.", "Kamu belum pernah menjawab dengan “Yakin sekali”.")}</p>
      <p className="muted small" style={{ margin: 0 }}>{pg != null ? t(`When you guess, you’re right ${pg}% of the time. `, `Saat menebak, kamu benar ${pg}% dari waktu. `) : ""}{ps != null && ps < 80 ? t("Being certain and wrong is the most important thing to catch, so those concepts come first in review.", "Yakin tapi salah adalah hal terpenting untuk ditangkap, jadi konsep-konsep itu didahulukan dalam review.") : ""}</p>
    </>
  );
}

export function ImportReportCard() {
  const { graph, act, toast, T, t } = useGraph();
  const r = graph!.lastImport;
  if (!r) return null;
  const ids = new Set(graph!.concepts.map((c) => c.id));
  const pend = r.links.filter((lid) => graph!.links.some((l) => l.lid === lid && l.status === "suggested"));
  return (
    <div className="card dashed">
      <p><strong>{t("Added from", "Ditambahkan dari")} “{r.title}”</strong></p>
      {r.added.length > 0 && <p className="small">{t("New concepts:", "Konsep baru:")} {r.added.filter((x) => ids.has(x)).map((id, i) => <span key={id}>{i ? ", " : ""}<NodeBtn id={id} /></span>)}</p>}
      {r.merged.length > 0 && <p className="small">{t("Merged into existing:", "Digabung ke yang sudah ada:")} {r.merged.filter((x) => ids.has(x)).map((id, i) => <span key={id}>{i ? ", " : ""}<NodeBtn id={id} /></span>)}</p>}
      {r.domains.length > 0 && <p className="small">{t("New domains:", "Domain baru:")} {r.domains.map((k) => T(graph!.domains.find((d) => d.key === k)?.name)).join(", ")}</p>}
      <p className="small">{t(`${pend.length} suggested links waiting for review.`, `${pend.length} saran tautan menunggu diperiksa.`)}</p>
      <div className="btnrow">
        {pend.length > 0 && <button className="btn primary small" onClick={async () => { await act("approveLinks", { lids: pend }); toast(t("Links approved", "Tautan disetujui")); }}>{t("Approve all links", "Setujui semua tautan")}</button>}
        <button className="btn small" onClick={() => act("dismissImport")}>{t("Dismiss", "Tutup")}</button>
      </div>
      {r.unknown.length > 0 && <TeachBox terms={r.unknown} />}
    </div>
  );
}

export function ReviewList({ limit = 6 }: { limit?: number }) {
  const { graph, t } = useGraph();
  const d = due(graph!.concepts);
  return (
    <ul className="plain">
      {d.slice(0, limit).map((n) => (
        <li key={n.id} className="row-item split"><span><NodeBtn id={n.id} tab="test" />{n.miscon && <span className="pill bad">{t("Misconception", "Miskonsepsi")}</span>}</span><span className="muted small">{n.mastery}%</span></li>
      ))}
      {!d.length && <li className="muted">{t("Nothing due.", "Tidak ada yang perlu direview.")}</li>}
    </ul>
  );
}

export function UpcomingList({ limit = 5 }: { limit?: number }) {
  const { graph, t, lang } = useGraph();
  const u = upcoming(graph!.concepts);
  if (!u.length) return <p className="muted small">{t("No reviews scheduled yet. Every answer you give schedules the next one.", "Belum ada review terjadwal. Setiap jawabanmu menjadwalkan review berikutnya.")}</p>;
  return <ul className="plain">{u.slice(0, limit).map((n) => <li key={n.id} className="row-item split"><NodeBtn id={n.id} /><span className="muted small">{fmtRel(n.review!.due, lang)}</span></li>)}</ul>;
}

export function Overlaps() {
  const { graph, T, t } = useGraph();
  const g = graph!;
  const overlaps: { a: (typeof g.domains)[number]; b: (typeof g.domains)[number]; shared: string[] }[] = [];
  g.domains.forEach((a, i) => g.domains.slice(i + 1).forEach((b) => {
    const shared = g.concepts.filter((n) => n.domains.includes(a.key) && n.domains.includes(b.key)).map((n) => n.id);
    if (shared.length) overlaps.push({ a, b, shared });
  }));
  return (
    <>
      <h3>{t("Where domains overlap", "Tempat domain bertemu")} ({overlaps.length})</h3>
      {overlaps.length ? <ul className="plain">{overlaps.map((o) => (
        <li key={o.a.key + o.b.key} className="row-item"><Dot color={domainColor(o.a.color)} /> {T(o.a.name)} ∩ <Dot color={domainColor(o.b.color)} /> {T(o.b.name)}: {o.shared.map((id, i) => <span key={id}>{i ? ", " : ""}<NodeBtn id={id} /></span>)}</li>
      ))}</ul> : <p className="muted">{t("No concept belongs to two domains yet.", "Belum ada konsep yang masuk dua domain.")}</p>}
    </>
  );
}

export function CrossLinks() {
  const { graph, t } = useGraph();
  const g = graph!;
  const byId = (id: string) => g.concepts.find((c) => c.id === id)!;
  const cross = g.links.filter((l) => l.status === "approved" && !byId(l.from).domains.some((k) => byId(l.to).domains.includes(k)));
  const pending = g.links.filter((l) => l.status === "suggested").length;
  return (
    <>
      <h3>{t("Links across domains", "Tautan lintas domain")} ({cross.length})</h3>
      <ul className="plain">{cross.map((l) => <li key={l.lid} className="row-item"><LinkSentence l={l} /></li>)}</ul>
      {pending > 0 && <p className="muted small">{t(`${pending} suggested links waiting for review. They show as blue dashed lines.`, `${pending} saran tautan menunggu diperiksa. Tampil sebagai garis putus-putus biru.`)}</p>}
    </>
  );
}

/** The panel shown next to the map when no concept is selected. */
export default function HomePanel() {
  const { graph, t } = useGraph();
  const g = graph!;
  return (
    <>
      <h2>{t("Your knowledge map", "Peta pengetahuanmu")}</h2>
      <p className="muted">{t(`${g.concepts.length} concepts in ${g.domains.length} domains. Pick a concept to read it, test yourself, or discuss it with the AI.`, `${g.concepts.length} konsep dalam ${g.domains.length} domain. Pilih satu konsep untuk membaca, menguji diri, atau berdiskusi dengan AI.`)}</p>
      <ImportReportCard />
      <h3>{t("Mastery", "Penguasaan")}</h3>
      <MasteryBlock />
      <h3>{t("Confidence check", "Cek keyakinan")}</h3>
      <CalibrationBlock />
      <h3>{t("Due for review", "Waktunya review")} ({due(g.concepts).length})</h3>
      <ReviewList />
      <h3>{t("Coming up", "Berikutnya")}</h3>
      <UpcomingList limit={3} />
      <Overlaps />
      <CrossLinks />
      <h3>{t("Your glossary", "Glosariummu")} ({g.glossary.length})</h3>
      {g.glossary.length ? <ul className="plain">{g.glossary.slice(0, 5).map((x) => <li key={x.term} className="row-item"><b style={{ fontWeight: 500 }}>{x.term}</b><span className="alt">{x.definition}</span></li>)}</ul>
        : <p className="muted">{t("Terms you teach the AI appear here. It treats them as the source of truth.", "Istilah yang kamu ajarkan ke AI muncul di sini. AI menjadikannya acuan utama.")}</p>}
      <p className="small"><Link className="link" href="/glossary">{t("Open the glossary", "Buka glosarium")}</Link></p>
    </>
  );
}
