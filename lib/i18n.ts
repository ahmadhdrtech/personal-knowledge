// Server-side helper: pick the English or Indonesian text for the user's language.
import { getPrefs } from "./repo";

export const st = (en: string, id: string) => (getPrefs().lang === "id" ? id : en);
