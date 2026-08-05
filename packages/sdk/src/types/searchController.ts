import {
  SearchHit,
  SearchOptions,
  SearchRequest,
  SearchResponse,
} from "./search";
import {
  SearchSurface,
  SelectSearchResultParams,
  ViewSearchResultsParams,
} from "./searchAnalytics";

export const SearchStatus = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  /** The request succeeded with zero hits — distinct from `success` so views render a no-results state. */
  EMPTY: "empty",
  ERROR: "error",
} as const;

export type SearchStatus = (typeof SearchStatus)[keyof typeof SearchStatus];

export interface SearchControllerState {
  status: SearchStatus;
  /** Last committed (run) query — not the text currently being typed. */
  query: string;
  /** Zero-indexed page of the last run. */
  page: number;
  /** Last landed response; kept while the next page loads, cleared on error. */
  response?: SearchResponse;
  error?: unknown;
}

export type SearchFunction = (
  request: SearchRequest,
  options?: SearchOptions,
) => Promise<SearchResponse>;

/**
 * Analytics sinks for the DEC-2448 storefront-search contract — wire the two
 * track methods to the `Dialog` instance. Impressions (viewport batching,
 * dedup, click-forced) and the zero-items no-results event are owned by the
 * controller; integrations only declare where results are displayed.
 */
export interface SearchControllerAnalytics {
  surface: SearchSurface;
  trackViewSearchResults: (params: ViewSearchResultsParams) => void;
  trackSelectSearchResult: (params: SelectSearchResultParams) => void;
}

export interface SearchControllerOptions {
  /** The bound `dialog.search` function. */
  search: SearchFunction;
  analytics: SearchControllerAnalytics;
  /**
   * Platform navigation adapter, called by `selectResult` AFTER attribution
   * is recorded, with the product URL of the selected hit. Omit it when the
   * rendering layer navigates natively (plain `<a href>`): attribution still
   * fires, the events are designed to survive navigation.
   */
  navigate?: (url: string, hit: SearchHit) => void;
  debounceMs?: number;
  hitsPerPage?: number;
}

/**
 * Framework-agnostic stateful search behavior around the stateless
 * `dialog.search()` transport: debounce, cancellation, stale-response
 * protection, pagination, retry and DEC-2448 attribution. Rendering and
 * routing stay in the integration (raw JavaScript, React, Vue, Shopify).
 */
export interface SearchController {
  /** Debounced entry point for keystrokes. */
  setQuery(rawQuery: string): void;
  /** Immediate (non-debounced) submission, e.g. Enter or a search button. */
  submit(rawQuery: string): void;
  /** Immediate pagination of the current results (zero-indexed). */
  setPage(page: number): void;
  /** Re-run the failed request; no-op unless the state is `error`. */
  retry(): void;
  /**
   * Watch the rendered element of `state.response.hits[index]` for a
   * viewport impression. Call it for every result element after rendering.
   */
  observeResult(element: Element, index: number): void;
  /**
   * Record selection attribution for `state.response.hits[index]` (forced
   * impression + select event), then hand navigation to the `navigate`
   * adapter. Call it on click AND middle-click/cmd+click.
   */
  selectResult(index: number): void;
  /** Register a state listener; returns its unsubscribe function. */
  subscribe(listener: (state: SearchControllerState) => void): () => void;
  getState(): SearchControllerState;
  /** Cancel everything in flight and detach listeners/observers. */
  dispose(): void;
}
