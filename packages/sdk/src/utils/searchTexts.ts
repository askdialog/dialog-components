import type { SearchBusinessRanking } from "../types/dialogConfig";
import { SEARCH_TEXT_LANGUAGES } from "./searchTextLanguages";

/** Default storefront search texts, shared by every search surface. */
export interface SearchTexts {
  searching: (query: string) => string;
  noResults: string;
  retry: string;
  collectionsLabel: string;
  productsLabel: string;
  /** Title of the empty-query products, after the merchant's business ranking. */
  rankingLabel: (ranking: SearchBusinessRanking | undefined) => string;
  collectionsCount: (count: number) => string;
  resultsCount: (count: number) => string;
  seeAllLabel: (count: number) => string;
  previous: string;
  next: string;
  pageOf: (page: number, pages: number) => string;
}

const formatCount = (count: number, locale: string | undefined): string => {
  try {
    return new Intl.NumberFormat(locale).format(count);
  } catch {
    return String(count);
  }
};

/**
 * Texts for a locale (`fr`, `fr-BE`…), English when its language is unknown.
 * An override replaces only the keys it names.
 */
export const getSearchTexts = (
  locale: string | undefined,
  overrides: Partial<SearchTexts> = {},
): SearchTexts => {
  const requested = locale?.split("-")[0]?.toLowerCase() ?? "en";
  // An own property only: "constructor" or "__proto__" must fall back too.
  const language = Object.hasOwn(SEARCH_TEXT_LANGUAGES, requested)
    ? requested
    : "en";
  const pluralRules = new Intl.PluralRules(language);

  return {
    ...SEARCH_TEXT_LANGUAGES[language](
      (count) => formatCount(count, locale),
      (count, forms) => forms[pluralRules.select(count)] ?? forms.other,
    ),
    ...overrides,
  };
};
