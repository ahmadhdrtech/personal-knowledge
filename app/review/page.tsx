"use client";
import { useRouter } from "next/navigation";
import Page from "@/components/Page";
import { useGraph } from "@/components/store";
import { CalibrationBlock } from "@/components/HomePanel";
import { domainColor, Dot, fmtDay, fmtRel } from "@/components/ui";
import { due, level, LEVEL_NAME, upcoming } from "@/lib/logic";
import type { Concept } from "@/lib/types";

export default function ReviewPage() {
  const { graph, T, t, lang } = useGraph();
  const router = useRouter();
  const queue = graph ? due(graph.concepts) : [];
  const soon = graph ? upcoming(graph.concepts) : [];
  const never = graph ? graph.concepts.filter((c) => !c.review && !queue.includes(c)) : [];
  const open = (id: string, tab = "test") => router.push(`/?c=${encodeURIComponent(id)}&tab=${tab}`);
  const dom = (k: string) => graph!.domains.find((d) => d.key === k);
  const why = (c: Concept) => c.miscon ? <span className="badge bad">{t("Misconception", "Miskonsepsi")}</span>
    : c.review ? <span className="badge acc">{t("Scheduled", "Terjadwal")} · {fmtRel(c.review.due, lang)}</span>
    : <span className="badge">{T(LEVEL_NAME[level(c.mastery)])} · {t("not scheduled yet", "belum terjadwal")}</span>;

  // next 14 days, how many reviews each day
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d.getTime(); });
  const perDay = days.map((d) => soon.filter((c) => c.review!.due >= d && c.review!.due < d + 86_400_000).length);
  const maxDay = Math.max(1, ...perDay);

  return (
    <Page title={t("Review", "Review")}
      lede={t("Spaced review: every answer you give schedules when that concept comes back. Easy answers wait longer; mistakes come back soon. Misconceptions always come first.", "Review berjarak: setiap jawabanmu menentukan kapan konsep itu muncul lagi. Jawaban mudah menunggu lebih lama; kesalahan cepat muncul lagi. Miskonsepsi selalu didahulukan.")}
      actions={queue.length ? <button className="btn primary" onClick={() => open(queue[0].id)}>{t(`Start review (${queue.length})`, `Mulai review (${queue.length})`)}</button> : undefined}>
      {graph && <>
        <div className="grid2" style={{ marginBottom: 16 }}>
          <div className="box"><h3 style={{ marginTop: 0 }}>{t("Confidence check", "Cek keyakinan")}</h3><CalibrationBlock /></div>
          <div className="box">
            <h3 style={{ marginTop: 0 }}>{t("Next 14 days", "14 hari ke depan")}</h3>
            {soon.length ? <>
              <div className="bars" style={{ height: 90 }}>{perDay.map((n, i) => <div key={i} className={`b${n ? "" : " zero"}`} style={{ height: `${(n / maxDay) * 100}%` }} title={`${fmtDay(days[i], lang)}: ${n}`} />)}</div>
              <div className="axis"><span>{t("Today", "Hari ini")}</span><span>{fmtDay(days[13], lang)}</span></div>
            </> : <p className="muted small">{t("Nothing scheduled yet. Answer a few test questions and their next reviews appear here.", "Belum ada jadwal. Jawab beberapa soal tes dan jadwal review berikutnya muncul di sini.")}</p>}
          </div>
        </div>
        <h3>{t("Due now", "Perlu direview sekarang")} ({queue.length})</h3>
        {queue.length ? (
          <div className="tablewrap"><table className="t">
            <thead><tr><th>#</th><th>{t("Concept", "Konsep")}</th><th>{t("Domains", "Domain")}</th><th>{t("Why it’s here", "Kenapa muncul")}</th><th>{t("Mastery", "Penguasaan")}</th><th className="num">{t("Answers", "Jawaban")}</th><th></th></tr></thead>
            <tbody>{queue.map((c, i) => (
              <tr key={c.id}>
                <td className="muted">{i + 1}</td>
                <td><button className="link" onClick={() => open(c.id, "overview")}>{T(c.label)}</button></td>
                <td>{c.domains.map((k) => <span key={k} className="tag"><Dot color={domainColor(dom(k)?.color ?? 0)} />{T(dom(k)?.name)}</span>)}</td>
                <td>{why(c)}</td>
                <td style={{ minWidth: 140 }}><div className="meter"><div className="track"><div className="fill" style={{ width: `${c.mastery}%`, background: `var(--${level(c.mastery)})` }} /></div><span>{c.mastery}%</span></div></td>
                <td className="num">{c.attempts}</td>
                <td><div className="inline" style={{ flexWrap: "nowrap" }}><button className="btn small" onClick={() => open(c.id)}>{t("Test", "Tes")}</button><button className="btn small" onClick={() => open(c.id, "discuss")}>{t("Discuss", "Diskusi")}</button></div></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <div className="empty">{t("Nothing due right now.", "Tidak ada yang perlu direview sekarang.")}</div>}

        <h3>{t("Coming up", "Berikutnya")} ({soon.length})</h3>
        {soon.length ? <div className="tablewrap"><table className="t">
          <thead><tr><th>{t("Concept", "Konsep")}</th><th>{t("Due", "Jadwal")}</th><th className="num">{t("Reviews", "Review")}</th><th className="num">{t("Forgotten", "Lupa")}</th><th className="num">{t("Memory strength", "Kekuatan ingatan")}</th><th></th></tr></thead>
          <tbody>{soon.map((c) => <tr key={c.id}>
            <td><button className="link" onClick={() => open(c.id, "overview")}>{T(c.label)}</button></td>
            <td>{fmtDay(c.review!.due, lang)} <span className="muted small">({fmtRel(c.review!.due, lang)})</span></td>
            <td className="num">{c.review!.reps}</td><td className="num">{c.review!.lapses}</td>
            <td className="num">{t(`${c.review!.stability} days`, `${c.review!.stability} hari`)}</td>
            <td><button className="btn small" onClick={() => open(c.id)}>{t("Practice early", "Latihan lebih awal")}</button></td>
          </tr>)}</tbody></table></div> : <p className="muted">{t("No reviews scheduled yet.", "Belum ada review terjadwal.")}</p>}

        {never.length > 0 && <>
          <h3>{t("Not scheduled yet", "Belum terjadwal")} ({never.length})</h3>
          <p className="muted small">{t("These are 60% or above but have never been tested, so they have no schedule. One answer each puts them on the calendar.", "Konsep ini sudah 60% ke atas tapi belum pernah dites, jadi belum ada jadwalnya. Satu jawaban untuk masing-masing akan memasukkannya ke kalender.")}</p>
          <p>{never.map((c, i) => <span key={c.id}>{i ? " · " : ""}<button className="link" onClick={() => open(c.id)}>{T(c.label)}</button></span>)}</p>
        </>}
        <p className="muted small" style={{ marginTop: 14 }}>{t("Memory strength is how many days until you’re about 90% likely to still remember it (FSRS stability).", "Kekuatan ingatan adalah berapa hari sampai peluangmu masih ingat sekitar 90% (stabilitas FSRS).")}</p>
      </>}
    </Page>
  );
}
