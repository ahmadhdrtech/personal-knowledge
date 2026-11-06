"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Page from "@/components/Page";
import { useGraph } from "@/components/store";
import PriorityView from "@/components/views/PriorityView";
import ProgressView from "@/components/views/ProgressView";
import MindMapView from "@/components/views/MindMapView";
import FlowView from "@/components/views/FlowView";
import MatrixView from "@/components/views/MatrixView";
import SunburstView from "@/components/views/SunburstView";
import NeighborhoodView from "@/components/views/NeighborhoodView";

const VIEWS = ["progress", "priority", "flow", "mindmap", "matrix", "sunburst", "neighborhood"] as const;
type V = (typeof VIEWS)[number];

export default function ViewsPage() {
  return <Suspense fallback={<div className="content" />}><Inner /></Suspense>;
}

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const { t, graph } = useGraph();
  const v: V = (VIEWS as readonly string[]).includes(params.get("v") || "") ? (params.get("v") as V) : "progress";
  const info: Record<V, { name: string; hint: string }> = {
    progress: { name: t("Progress", "Perkembangan"), hint: t("How your mastery has changed over time, what improved and what is slipping.", "Bagaimana penguasaanmu berubah dari waktu ke waktu, apa yang meningkat, dan apa yang menurun.") },
    mindmap: { name: t("Mind map", "Peta pikiran"), hint: t("Your map as a tree of domains, concepts, parts and examples.", "Petamu sebagai pohon domain, konsep, bagian, dan contoh.") },
    priority: { name: t("Priority", "Prioritas"), hint: t("What to study first: mastery against how connected each concept is.", "Apa yang perlu dipelajari dulu: penguasaan dibanding seberapa terhubung tiap konsep.") },
    flow: { name: t("Learning flow", "Alur belajar"), hint: t("Prerequisites and causes laid out step by step, left to right.", "Prasyarat dan sebab-akibat disusun langkah demi langkah, kiri ke kanan.") },
    matrix: { name: t("Domain matrix", "Matriks domain"), hint: t("Which topics share concepts and links, and which aren't connected yet.", "Topik mana yang berbagi konsep dan tautan, dan mana yang belum terhubung.") },
    sunburst: { name: t("Sunburst", "Sunburst"), hint: t("Every domain and its concepts, colored by mastery.", "Setiap domain dan konsepnya, diwarnai menurut penguasaan.") },
    neighborhood: { name: t("Neighborhood", "Sekitar konsep"), hint: t("One concept in the middle and how it reaches the rest of the map.", "Satu konsep di tengah dan bagaimana ia terhubung ke seluruh peta.") },
  };
  return (
    <Page title={t("Views", "Tampilan")} lede={t("Other ways to look at your map. Each one answers a different question. Click any concept to open it.", "Cara lain melihat petamu. Masing-masing menjawab pertanyaan berbeda. Klik konsep mana pun untuk membukanya.")}>
      <div className="tabs-row" role="tablist">
        {VIEWS.map((k) => <button key={k} className="tab" role="tab" aria-selected={v === k} onClick={() => router.replace(`/views?v=${k}`, { scroll: false })}>{info[k].name}</button>)}
      </div>
      <p className="muted small" style={{ marginTop: -8 }}>{info[v].hint}</p>
      {graph && graph.concepts.length === 0 && v !== "progress" ? (
        <div className="box"><p style={{ margin: 0 }}>{t("Your map is empty, so there’s nothing to draw yet.", "Petamu masih kosong, jadi belum ada yang bisa digambar.")} <Link className="link" href="/sources">{t("Add your first source", "Tambahkan sumber pertamamu")}</Link></p></div>
      ) : <>
      {v === "progress" && <ProgressView />}
      {v === "mindmap" && <MindMapView />}
      {v === "priority" && <PriorityView />}
      {v === "flow" && <FlowView />}
      {v === "matrix" && <MatrixView />}
      {v === "sunburst" && <SunburstView />}
      {v === "neighborhood" && <NeighborhoodView initial={params.get("c")} />}
      </>}
    </Page>
  );
}
