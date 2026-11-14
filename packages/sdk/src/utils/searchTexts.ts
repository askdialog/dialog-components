import type { SearchBusinessRanking } from "../types/dialogConfig";
import type { SearchSort } from "../types/search";
import type { SearchNumericOperator } from "../types/searchFilters";
import { SEARCH_TEXT_LANGUAGES } from "./searchTextLanguages";

/** The attributes `filterFields` labels; `vendor` and `product_type` read as two of them. */
export type SearchFilterField =
  | "price"
  | "brand"
  | "category"
  | "productType"
  | "color"
  | "size";

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
  /** Label of a common filtered attribute the search publishes none for. */
  filterFields: Readonly<Record<SearchFilterField, string>>;
  /** A comparison in words, e.g. "Price below €30.00". */
  filterComparison: (
    field: string,
    operator: SearchNumericOperator,
    value: string,
  ) => string;
  /** An inclusive range in words, e.g. "Price between €10.00 and €20.00". */
  filterBetween: (field: string, min: string, max: string) => string;
  /** An excluded value in words, e.g. "Color: excluding red". */
  filterExclusion: (field: string, value: string) => string;
  /** A range's bounds alone, under its field's label, e.g. "€10.00 – €20.00". */
  filterValueRange: (min: string, max: string) => string;
  /** The fold of a filter's values while folded, with how many it hides, e.g. "See more (4)". */
  seeMore: (count: number) => string;
  /** The fold once unfolded. */
  seeLess: string;
  /** Next to the applied filters: removes them all. */
  clearAll: string;
  /** In the empty state under filters: removes them all. */
  clearFilters: string;
  /** Title of the empty state when the filters leave no result. */
  filteredEmptyTitle: string;
  /** Body of the empty state when the filters leave no result. */
  filteredEmptyBody: string;
  /** Label of the price floor field. */
  priceMin: string;
  /** Label of the price ceiling field. */
  priceMax: string;
  /** The error under a price floor above its ceiling. */
  priceMinAboveMax: string;
  /** Name of a chip's remove button, from the chip's text, e.g. "Remove filter: Color: red". */
  removeFilter: (text: string) => string;
  /** Label of the filters landmark. */
  filtersLabel: string;
  /** Label of the applied filters list. */
  appliedFiltersLabel: string;
  /** Label of the products' order control. */
  sortLabel: string;
  /** Name of each order the shopper can pick. */
  sortOptions: Readonly<Record<SearchSort, string>>;
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
