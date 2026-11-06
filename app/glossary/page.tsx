"use client";
import { useState } from "react";
import Page from "@/components/Page";
import { useGraph } from "@/components/store";
import { NodeBtn } from "@/components/ui";

export default function GlossaryPage() {
  const { graph, act, toast, t } = useGraph();
  const [term, setTerm] = useState(""), [def, setDef] = useState(""), [q, setQ] = useState("");
  const [edit, setEdit] = useState<string | null>(null), [editDef, setEditDef] = useState("");
  const add = async () => {
    if (!term.trim() || !def.trim()) { toast(t("Enter a term and its definition", "Isi istilah dan definisinya")); return; }
    await act("glossaryUpsert", { term, definition: def }); setTerm(""); setDef(""); toast(t("Definition saved to your glossary", "Definisi disimpan ke glosarium"));
  };
  const items = (graph?.glossary || []).filter((g) => !q || `${g.term} ${g.definition}`.toLowerCase().includes(q.toLowerCase()));
  const defs = (graph?.concepts || []).filter((c) => c.userDef);
  return (
    <Page title={t("Glossary", "Glosarium")} lede={t("Terms you teach the AI. These, plus your own concept definitions, are added to every AI prompt as the source of truth. When the AI’s knowledge conflicts with them, it follows them and says so.", "Istilah yang kamu ajarkan ke AI. Istilah ini, ditambah definisi konsepmu sendiri, dimasukkan ke setiap perintah AI sebagai acuan utama. Kalau pengetahuan AI berbeda, AI mengikuti punyamu dan menyebutkan perbedaannya.")}>
      <div className="box" style={{ marginBottom: 16 }}>
        <h3>{t("Teach a term", "Ajarkan istilah")}</h3>
        <div className="split"><input className="field" placeholder={t("Term", "Istilah")} aria-label={t("Term", "Istilah")} style={{ maxWidth: "34%" }} value={term} onChange={(e) => setTerm(e.target.value)} />
          <input className="field" placeholder={t("Definition", "Definisi")} aria-label={t("Definition", "Definisi")} value={def} onChange={(e) => setDef(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} /></div>
        <div className="btnrow"><button className="btn primary small" onClick={add}>{t("Teach this term", "Ajarkan istilah ini")}</button></div>
      </div>
      <div className="grid2">
        <div className="box">
          <div className="split"><h3 style={{ marginTop: 0 }}>{t("Glossary", "Glosarium")} ({graph?.glossary.length || 0})</h3>
            <input className="field" type="search" placeholder={t("Filter", "Saring")} style={{ maxWidth: 180 }} value={q} onChange={(e) => setQ(e.target.value)} /></div>
          {items.length ? <ul className="plain">{items.map((g) => (
            <li key={g.term} className="row-item">
              <b style={{ fontWeight: 500 }}>{g.term}</b>
              {edit === g.term ? <>
                <textarea className="field" rows={2} value={editDef} onChange={(e) => setEditDef(e.target.value)} style={{ marginTop: 6 }} />
                <div className="btnrow"><button className="btn primary small" onClick={async () => { await act("glossaryUpsert", { term: g.term, definition: editDef }); setEdit(null); }}>{t("Save", "Simpan")}</button><button className="btn small" onClick={() => setEdit(null)}>{t("Cancel", "Batal")}</button></div>
              </> : <>
                <span className="alt">{g.definition}</span>
                <div className="inline" style={{ marginTop: 4 }}><button className="link small" onClick={() => { setEdit(g.term); setEditDef(g.definition); }}>{t("Edit", "Ubah")}</button>
                  <button className="link small" onClick={() => act("glossaryDelete", { term: g.term })}>{t("Remove", "Hapus")}</button></div>
              </>}
            </li>
          ))}</ul> : <p className="muted">{q ? t("No terms match.", "Tidak ada istilah yang cocok.") : t("No terms yet. When the AI isn’t sure about a word, it asks you to define it, and the answer lands here.", "Belum ada istilah. Saat AI tidak yakin dengan suatu kata, AI memintamu mendefinisikannya, dan jawabanmu masuk ke sini.")}</p>}
        </div>
        <div className="box">
          <h3>{t("Your concept definitions", "Definisi konsepmu")} ({defs.length})</h3>
          {defs.length ? <ul className="plain">{defs.map((c) => <li key={c.id} className="row-item"><NodeBtn id={c.id} /><span className="alt">{c.userDef}</span></li>)}</ul>
            : <p className="muted">{t("Add “your definition” on a concept’s Overview tab. It’s used the same way as glossary terms.", "Tambahkan “definisimu” di tab Ringkasan sebuah konsep. Dipakai sama seperti istilah glosarium.")}</p>}
        </div>
      </div>
    </Page>
  );
}
