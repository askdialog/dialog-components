// Storefront-search analytics contract (DEC-2448), snake_case end to end:
// these property names ARE the canonical PostHog properties — the host
// bridge forwards them verbatim (no camelCase mapping), so any rename here
// is a breaking change of the cross-repo contract.

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
  /** Public index name the result came from (e.g. `products_fr`) — the Algolia Insights tuple's index. */
  index: string;
  /** Where results are displayed — not the integration technology. */
  surface: SearchSurface;
  /** Retrieval mode that produced the results. */
  search_type: SearchType;
  /** 1-based results page. */
  page: number;
  /** Total results for the query, not for the page. */
  total_hits: number;
  /** Code points of the trimmed query. */
  query_length: number;
}

// A result identified positionally. `position` is 1-based and absolute
// across pages (page 2, first item, 20/page → 21).
export interface SearchResultItem {
  product_id: string;
  position: number;
}

// `view_search_results`: viewport impressions, batched and deduplicated by
// (query_id, product_id) — may be emitted several times for one query_id as
// the user scrolls, never re-counting an item. A rendered no-results state is
// this same event with `items: []` and `total_hits: 0`.
export interface ViewSearchResultsParams extends SearchAnalyticsEnvelope {
  items: SearchResultItem[];
}

// `select_search_result`: one click, single-item `items` array (GA4 symmetry).
export interface SelectSearchResultParams extends SearchAnalyticsEnvelope {
  items: [SearchResultItem];
}

// `userId` is transport-level identity stamped on every EventsHandler event
// (same as add-to-cart/checkout) — NOT an analytics property: the host bridge
// whitelists it out and identity comes from the host's own enrichment.
export interface ViewSearchResultsEventPayload extends ViewSearchResultsParams {
  userId?: string;
}

export interface SelectSearchResultEventPayload
  extends SelectSearchResultParams {
  userId?: string;
}
