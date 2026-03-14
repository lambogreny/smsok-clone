import type { Locale } from "./config";

const dictionaries = {
  th: () => import("./dict/th.json").then((m) => m.default),
  en: () => import("./dict/en.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}
