import {
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
