import en from "./content/ui.en.json";
import uz from "./content/ui.uz.json";
import ru from "./content/ui.ru.json";

export type Lang = "en" | "uz" | "ru";
export const LANGS: Lang[] = ["en", "uz", "ru"];
export const LANG_LABEL: Record<Lang, string> = { en: "EN", uz: "UZ", ru: "RU" };
export const dictionaries: Record<Lang, Record<string, string>> = { en, uz, ru };

export function t(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  const raw = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => (name in vars ? String(vars[name]) : `{${name}}`));
}

/** URL ?lang= wins, then the stored choice, then the browser language; English otherwise. */
export function detectLang(search: string, stored: string | null, browser: string): Lang {
  const fromUrl = new URLSearchParams(search).get("lang");
  for (const c of [fromUrl, stored, browser.slice(0, 2).toLowerCase()]) {
    if (c && (LANGS as string[]).includes(c)) return c as Lang;
  }
  return "en";
}
