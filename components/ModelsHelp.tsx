"use client";
import { useGraph } from "./store";
import type { ProviderKind } from "@/lib/types";

type Tr = (en: string, id: string) => string;

/** What each kind of provider is, in plain words. */
export function providerInfo(t: Tr): Record<ProviderKind, { name: string; what: string; cost: string; key: string; keyUrl: string | null; url: string | null; urlHelp: string }> {
  return {
    anthropic: {
      name: "Anthropic API", what: t("Claude models, run by Anthropic.", "Model Claude, dijalankan oleh Anthropic."),
      cost: t("Paid per use. Separate from a Claude.ai subscription.", "Bayar sesuai pemakaian. Terpisah dari langganan Claude.ai."),
      key: t("Create one at console.anthropic.com → API keys. It starts with sk-ant-.", "Buat di console.anthropic.com → API keys. Diawali sk-ant-."),
      keyUrl: "https://console.anthropic.com/settings/keys", url: "https://api.anthropic.com",
      urlHelp: t("Leave as is.", "Biarkan seperti ini."),
    },
    openrouter: {
      name: "OpenRouter", what: t("One account that gives you hundreds of models from many companies, including free ones.", "Satu akun untuk ratusan model dari banyak perusahaan, termasuk yang gratis."),
      cost: t("Free models cost $0 (with daily limits). Others are paid from your OpenRouter credit.", "Model gratis $0 (ada batas harian). Lainnya dibayar dari saldo OpenRouter."),
      key: t("Create one at openrouter.ai → Keys. It starts with sk-or-.", "Buat di openrouter.ai → Keys. Diawali sk-or-."),
      keyUrl: "https://openrouter.ai/settings/keys", url: "https://openrouter.ai/api/v1",
      urlHelp: t("Leave as is.", "Biarkan seperti ini."),
    },
    gemini: {
      name: "Google Gemini", what: t("Google’s Gemini models.", "Model Gemini dari Google."),
      cost: t("Has a free tier with daily limits; Google may use free-tier data to improve its products.", "Ada paket gratis dengan batas harian; Google bisa memakai data paket gratis untuk mengembangkan produknya."),
      key: t("Create one at aistudio.google.com → Get API key. It starts with AIza.", "Buat di aistudio.google.com → Get API key. Diawali AIza."),
      keyUrl: "https://aistudio.google.com/apikey", url: "https://generativelanguage.googleapis.com/v1beta/openai",
      urlHelp: t("Leave as is.", "Biarkan seperti ini."),
    },
    ollama: {
      name: "Ollama", what: t("Runs open models on your own PC. Nothing leaves your computer.", "Menjalankan model terbuka di PC-mu sendiri. Tidak ada data yang keluar dari komputermu."),
      cost: t("Free. Speed depends on your PC; 8B models want about 16 GB of RAM.", "Gratis. Kecepatannya tergantung PC; model 8B butuh sekitar 16 GB RAM."),
      key: t("No key. Install the Ollama app and keep it running.", "Tanpa kunci. Pasang aplikasi Ollama dan biarkan berjalan."),
      keyUrl: "https://ollama.com/download", url: "http://localhost:11434",
      urlHelp: t("Leave as is, unless Ollama runs on another computer.", "Biarkan, kecuali Ollama berjalan di komputer lain."),
    },
    openai_compatible: {
      name: t("OpenAI-compatible", "Kompatibel OpenAI"), what: t("Any other service that speaks the OpenAI format: OpenAI, Groq, DeepSeek, Mistral, LM Studio and more.", "Layanan lain yang memakai format OpenAI: OpenAI, Groq, DeepSeek, Mistral, LM Studio, dan lainnya."),
      cost: t("Depends on the service.", "Tergantung layanannya."),
      key: t("From that service’s website. LM Studio needs none.", "Dari situs layanan tersebut. LM Studio tidak perlu."),
      keyUrl: null, url: null,
      urlHelp: t("Required. Copy the base URL from the service’s docs; it usually ends in /v1, e.g. https://api.openai.com/v1 or https://api.groq.com/openai/v1.", "Wajib diisi. Salin base URL dari dokumentasi layanannya; biasanya diakhiri /v1, mis. https://api.openai.com/v1 atau https://api.groq.com/openai/v1."),
    },
  };
}

/** Provider → key → model → depth, as four cards with an example under each. */
export function HowItFits({ compact }: { compact?: boolean }) {
  const { t } = useGraph();
  const pieces = [
    { n: 1, name: t("Provider", "Penyedia"), what: t("The company or app that runs the AI.", "Perusahaan atau aplikasi yang menjalankan AI."), eg: t("Like the rental company you hire machines from.", "Seperti perusahaan sewa alat tempat kamu menyewa mesin."), ex: "Anthropic, Google Gemini, OpenRouter, Ollama" },
    { n: 2, name: t("API key", "API key (kunci)"), what: t("A secret password that proves the account is yours. Set once per provider.", "Kata sandi rahasia yang membuktikan akun itu milikmu. Diisi sekali per penyedia."), eg: t("Like your account card at the rental company.", "Seperti kartu anggota di perusahaan sewa itu."), ex: "sk-ant-…, AIza…" },
    { n: 3, name: t("Model", "Model"), what: t("One specific AI from that provider. A provider has many; you add the ones you want.", "Satu AI tertentu dari penyedia itu. Satu penyedia punya banyak; kamu tambahkan yang kamu mau."), eg: t("Like choosing the mini excavator or the 20-ton one.", "Seperti memilih ekskavator mini atau yang 20 ton."), ex: "claude-haiku-5-5, gemini-3.8-flash, qwen3:8b" },
    { n: 4, name: t("AI depth", "Tingkat AI"), what: t("Which model does the work. Quick, Balanced and Deep each point to one model.", "Model mana yang bekerja. Cepat, Seimbang, dan Mendalam masing-masing menunjuk satu model."), eg: t("Like deciding which machine goes to which job.", "Seperti menentukan mesin mana untuk pekerjaan mana."), ex: t("Quick → a cheap model, Deep → your best one", "Cepat → model murah, Mendalam → model terbaikmu") },
  ];
  return (
    <div className="explain" data-tour="explain">
      {pieces.map((p) => (
        <div className="piece" key={p.n}>
          <div><span className="n">{p.n}</span><b>{p.name}</b></div>
          <p>{p.what}</p>
          {!compact && <p className="eg">{p.eg}</p>}
          <div className="eg"><span className="code">{p.ex}</span></div>
        </div>
      ))}
    </div>
  );
}
