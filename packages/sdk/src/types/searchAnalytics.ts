// Property names are forwarded unchanged to analytics; renaming them breaks consumers.

export const SEARCH_SURFACES = [
  "autocomplete",
  "search_page",
  "smart_discovery",
  "ai_bar",
] as const;

export type SearchSurface = (typeof SEARCH_SURFACES)[number];

export const SEARCH_TYPES = ["lexical"] as const;

export type SearchType = (typeof SEARCH_TYPES)[number];

export interface SearchAnalyticsEnvelope {
  query_id: string;
  /** Index returned by the API, e.g. `products_fr_be`. */
  index: string;
  /** UI surface displaying the results. */
  surface: SearchSurface;
  /** Search mode that produced the results. */
  search_type: SearchType;
  /** One-based results page. */
  page: number;
  /** Total hits across all pages. */
  total_hits: number;
  /** Number of code points in the trimmed query. */
  query_length: number;
}

/** The shopper opened search (focused the search input). */
export interface OpenedSearchParams {
  surface: SearchSurface;
  search_type: SearchType;
}

/** Position is one-based across pages: page 2 at 20 hits/page starts at 21. */
export interface SearchResultItem {
  product_id: string;
  position: number;
}

/**
 * Impressions batched and deduplicated by (query_id, product_id).
 * Empty results use `items: []` and `total_hits: 0`.
 */
export interface ViewSearchResultsParams extends SearchAnalyticsEnvelope {
  items: SearchResultItem[];
}

/** One selected result per event. */
export interface SelectSearchResultParams extends SearchAnalyticsEnvelope {
  items: [SearchResultItem];
}

interface SearchEventUser {
  user_id?: string;
  /** @deprecated Use `user_id`; `userId` is removed in the next version. */
  userId?: string;
}

export interface ViewSearchResultsEventPayload
  extends ViewSearchResultsParams,
    SearchEventUser {}

export interface SelectSearchResultEventPayload
  extends SelectSearchResultParams,
    SearchEventUser {}

export interface OpenedSearchEventPayload extends OpenedSearchParams {
  user_id?: string;
}
