"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, errText, useGraph } from "./store";
import Hint from "./Hint";
import { NodeBtn } from "./ui";
import type { Claim, ClaimStatus, Concept } from "@/lib/types";

export const STATUS: Record<ClaimStatus, { en: string; id: string; cls: string; hint: [string, string] }> = {
  unchecked: { en: "Not checked", id: "Belum dicek", cls: "", hint: ["Nobody has checked this claim against its source yet.", "Klaim ini belum dicek terhadap sumbernya."] },
  supported: { en: "Supported", id: "Didukung", cls: "ok", hint: ["The source clearly says this, for the reasons given.", "Sumber jelas menyatakan ini, dengan alasan yang disebutkan."] },
  partly: { en: "Partly", id: "Sebagian", cls: "warn", hint: ["Part is in the source, but it overstates, drops a condition, or a reason isn't there.", "Sebagian ada di sumber, tapi berlebihan, menghilangkan syarat, atau alasannya tidak ada."] },
  unsupported: { en: "Not in source", id: "Tidak di sumber", cls: "warn", hint: ["The source doesn't say this. It may be true, but it isn't grounded in what you read.", "Sumber tidak menyatakan ini. Mungkin benar, tapi tidak berdasar pada yang kamu baca."] },
  contradicted: { en: "Contradicted", id: "Bertentangan", cls: "bad", hint: ["The source, your definition or your glossary says otherwise.", "Sumber, definisimu, atau glosariummu menyatakan sebaliknya."] },
  disputed: { en: "Disputed", id: "Diperdebatkan", cls: "bad", hint: ["The source says it, but it conflicts with well-established knowledge. Check the note.", "Sumber menyatakannya, tapi bertentangan dengan pengetahuan yang mapan. Lihat catatannya."] },
};
const BY = { ai: { en: "AI", id: "AI" }, claude: { en: "Claude", id: "Claude" }, you: { en: "You", id: "Kamu" } };

export function StatusBadge({ s }: { s: ClaimStatus }) {
  const { t } = useGraph();
  return <span className={`badge ${STATUS[s].cls}`} title={t(STATUS[s].hint[0], STATUS[s].hint[1])}>{t(STATUS[s].en, STATUS[s].id)}</span>;
}

type Post = (b: Record<string, unknown>, label?: string) => Promise<{ claims: Claim[] } | null>;

export function ClaimCard({ c, post, showConcept }: { c: Claim; post: Post; showConcept?: boolean }) {
  const { t, lang } = useGraph();
  const [edit, setEdit] = useState<{ text: string; because: string } | null>(null);
  const [armed, setArmed] = useState(false);
  return (
    <li className={`claim claim-${c.status}`}>
      <div className="split" style={{ alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          {showConcept && <div className="small" style={{ marginBottom: 2 }}><NodeBtn id={c.conceptId} /></div>}
          {edit ? <textarea className="field" rows={2} value={edit.text} onChange={(e) => setEdit({ ...edit, text: e.target.value })} aria-label={t("Claim", "Klaim")} />
            : <p className="claim-text">{c.text}</p>}
        </div>
        <StatusBadge s={c.status} />
      </div>
      {edit ? <>
        <label className="small muted">{t("Because (one reason per line)", "Karena (satu alasan per baris)")}</label>
        <textarea className="field" rows={3} value={edit.because} onChange={(e) => setEdit({ ...edit, because: e.target.value })} />
        <div className="btnrow"><button className="btn primary small" onClick={async () => { await post({ action: "update", id: c.id, text: edit.text, because: edit.because.split("\n") }); setEdit(null); }}>{t("Save", "Simpan")}</button><button className="btn small" onClick={() => setEdit(null)}>{t("Cancel", "Batal")}</button></div>
      </> : c.because.length > 0 && <ul className="because">{c.because.map((b, i) => <li key={i}><span className="muted">{t("because", "karena")}</span> {b}</li>)}</ul>}
      {c.quote && <blockquote className="claim-quote">“{c.quote}”<span className="muted small"> · {c.sourceTitle || t("source", "sumber")}{c.page ? `, ${t("p.", "hlm.")} ${c.page}` : ""}</span></blockquote>}
      {c.note && <p className="small claim-note"><b>{t("Check:", "Cek:")}</b> {c.note}{c.evidence && <> · {/^https?:/.test(c.evidence) ? <a className="link" href={c.evidence} target="_blank" rel="noreferrer">{t("evidence", "bukti")}</a> : c.evidence}</>}</p>}
      {!edit && <div className="inline claim-actions">
        <span className="muted small">{t(BY[c.by].en, BY[c.by].id)}{c.checkedBy ? ` · ${t("checked by", "dicek oleh")} ${t(BY[c.checkedBy].en, BY[c.checkedBy].id)}` : ""}</span>
        <select className="field small-select" value="" onChange={(e) => e.target.value && post({ action: "status", id: c.id, status: e.target.value })} aria-label={t("Mark as", "Tandai sebagai")}>
          <option value="">{t("Mark as…", "Tandai…")}</option>
          {(Object.keys(STATUS) as ClaimStatus[]).map((k) => <option key={k} value={k}>{t(STATUS[k].en, STATUS[k].id)}</option>)}
        </select>
        <button className="link small" onClick={() => setEdit({ text: c.text, because: c.because.join("\n") })}>{t("Edit", "Ubah")}</button>
        <button className="link small" onBlur={() => setArmed(false)} onClick={() => { if (!armed) { setArmed(true); return; } post({ action: "delete", id: c.id }); }}>{armed ? t("Click again", "Klik lagi") : t("Delete", "Hapus")}</button>
      </div>}
    </li>
  );
}

/** The Claims tab in the concept panel. */
export default function ClaimsTab({ c }: { c: Concept }) {
  const { t, toast, graph } = useGraph();
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [add, setAdd] = useState<{ text: string; because: string } | null>(null);
  const load = () => api<{ claims: Claim[] }>(`/api/claims?concept=${encodeURIComponent(c.id)}`).then((r) => setClaims(r.claims)).catch((e) => toast(errText(e)));
  useEffect(() => { load(); }, [c.id]);
  const post: Post = async (b, label) => {
    if (label) setBusy(label);
    try { const r = await api<{ claims: Claim[]; added?: number; checked?: number }>("/api/claims", { method: "POST", body: JSON.stringify({ conceptId: c.id, ...b }) }); setClaims(r.claims); if (r.added === 0) toast(t("No claims found in the sources.", "Tidak ada klaim yang ditemukan di sumber.")); return r; }
    catch (e) { toast(errText(e)); return null; } finally { if (label) setBusy(null); }
  };
  const ready = !!graph?.ai.ready;
  const unchecked = claims?.filter((x) => x.status === "unchecked").length || 0;
  const problems = claims?.filter((x) => ["unsupported", "contradicted", "disputed", "partly"].includes(x.status)).length || 0;
  const prompt = t(`Fact-check my Neuron concept "${c.label.en}"`, `Cek fakta konsep Neuron "${c.label.id || c.label.en}"`);
  if (!claims) return <p className="muted small">{t("Loading…", "Memuat…")}</p>;
  return (
    <>
      <h3 className="inline">{t("Claims and reasons", "Klaim dan alasan")}<Hint>{t("The key things your sources say about this concept, each with the reasons given and the sentence it comes from. Checking compares each claim with its passage, your definition and your glossary. Lessons, blog posts and the Assistant use supported claims as ground truth.", "Hal-hal penting yang dinyatakan sumbermu tentang konsep ini, masing-masing dengan alasan dan kalimat asalnya. Pengecekan membandingkan tiap klaim dengan bagian sumbernya, definisimu, dan glosariummu. Pelajaran, tulisan blog, dan Asisten memakai klaim yang didukung sebagai pegangan.")}</Hint></h3>
      {claims.length > 0 && <p className="small muted" style={{ marginTop: 0 }}>{t(`${claims.length} claims`, `${claims.length} klaim`)}{unchecked ? ` · ${t(`${unchecked} not checked`, `${unchecked} belum dicek`)}` : ""}{problems ? ` · ${t(`${problems} need a look`, `${problems} perlu diperiksa`)}` : ""}</p>}
      <div className="btnrow" style={{ marginTop: 0 }}>
        {ready ? <>
          <button className="btn small primary" disabled={!!busy} onClick={() => post({ action: "extract", replace: claims.some((x) => x.by !== "you") }, "extract")}>{busy === "extract" ? t("Reading sources…", "Membaca sumber…") : claims.some((x) => x.by !== "you") ? t("Find claims again", "Cari klaim lagi") : t("Find claims in sources", "Cari klaim di sumber")}</button>
          {unchecked > 0 && <button className="btn small" disabled={!!busy} onClick={() => post({ action: "check" }, "check")}>{busy === "check" ? t("Checking…", "Mengecek…") : t(`Check ${unchecked}`, `Cek ${unchecked}`)}</button>}
        </> : <Link className="btn small" href="/models">{t("Set up a model", "Atur model")}</Link>}
        <button className="btn small" onClick={() => setAdd(add ? null : { text: "", because: "" })}>{t("Add your own", "Tambah sendiri")}</button>
      </div>
      {!ready && <p className="small muted">{t("Or, free with your Claude subscription, ask Claude Desktop:", "Atau, gratis dengan langganan Claude, minta Claude Desktop:")} <button className="chip" onClick={async () => { try { await navigator.clipboard.writeText(prompt); toast(t("Copied", "Disalin")); } catch {} }}>{prompt}</button></p>}
      {add && <div className="claim-add">
        <textarea className="field" rows={2} placeholder={t("A claim in one sentence", "Satu klaim dalam satu kalimat")} value={add.text} onChange={(e) => setAdd({ ...add, text: e.target.value })} />
        <textarea className="field" rows={2} placeholder={t("Because… (one reason per line, optional)", "Karena… (satu alasan per baris, opsional)")} value={add.because} onChange={(e) => setAdd({ ...add, because: e.target.value })} />
        <div className="btnrow"><button className="btn primary small" disabled={!add.text.trim()} onClick={async () => { await post({ action: "add", text: add.text, because: add.because.split("\n") }); setAdd(null); }}>{t("Add claim", "Tambah klaim")}</button></div>
      </div>}
      {claims.length ? <ul className="plain claims">{claims.map((x) => <ClaimCard key={x.id} c={x} post={post} />)}</ul>
        : <p className="muted small">{t("No claims yet. Find them in this concept's sources, or write your own.", "Belum ada klaim. Cari di sumber konsep ini, atau tulis sendiri.")}</p>}
    </>
  );
}
