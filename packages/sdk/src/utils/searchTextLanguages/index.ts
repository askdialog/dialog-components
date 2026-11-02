import { ar } from "./ar";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { ja } from "./ja";
import { ko } from "./ko";
import { nl } from "./nl";
import { pl } from "./pl";
import { pt } from "./pt";
import type { TextsFactory } from "./types";

/** Search texts by ISO 639-1 language, the widget's languages. */
export const SEARCH_TEXT_LANGUAGES: Record<string, TextsFactory> = {
  ar,
  de,
  en,
  es,
  fr,
  it,
  ja,
  ko,
  nl,
  pl,
  pt,
};
