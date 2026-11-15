import {
  SearchFacetsRequest,
  SearchFacetsResponse,
  SearchIndex,
  SearchOptions,
  SearchRequest,
  SearchResponse,
} from "./search";
import {
  OpenedSearchParams,
  SearchSurface,
  SelectSearchResultParams,
  ViewSearchResultsParams,
} from "./searchAnalytics";

export const SearchStatus = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  /** Successful request with zero hits. */
  EMPTY: "empty",
  ERROR: "error",
} as const;

export type SearchStatus = (typeof SearchStatus)[keyof typeof SearchStatus];

export interface SearchSection {
  index: Exclude<SearchIndex, "products">;
  hitsPerPage?: number;
}

export type SearchFunction = (
  request: SearchRequest,
  options?: SearchOptions,
) => Promise<SearchResponse>;

/** Event callbacks; the controller handles impression batching and deduplication. */
export interface SearchControllerAnalytics {
  surface: SearchSurface;
  trackViewSearchResults: (params: ViewSearchResultsParams) => void;
  trackSelectSearchResult: (params: SelectSearchResultParams) => void;
  /** Called by `open()`; optional so existing custom adapters keep compiling. */
  trackOpenedSearch?: (params: OpenedSearchParams) => void;
}

/** Sends a facet counts request; a counts-only transport, never called in AI mode. */
export type SearchFacetsFunction = (
  request: SearchFacetsRequest,
  options?: SearchOptions,
) => Promise<SearchFacetsResponse>;

/** The facet counts a search controller asks, opt-in. */
export interface SearchFacetsOptions {
  /**
   * Lexical mode: count each value of the filters to render, and the price's
   * bounds, in a request to `/public/search/lexical/facets` sent with the
   * hits', which is unchanged and never waits for it; a page change asks none.
   * Default `false`; the AI mode ignores it.
   */
  facets?: boolean;
  /** Replaces the counts transport, which `apiKey` then needn't bind. */
  facetsTransport?: SearchFacetsFunction;
}
