import { SearchBusinessRanking } from "../types/dialogConfig";
import {
  SearchProductHit,
  SearchResult,
  SearchSections,
} from "../types/search";
import {
  SearchControllerAnalytics,
  SearchFunction,
  SearchSection,
  SearchStatus,
} from "../types/searchController";
import { SearchTexts } from "../utils/searchTexts";

/** What the visitor asks for on one index, in InstantSearch's `uiState` entry shape. */
export interface IndexSearchState {
  readonly query: string;
  /** Zero-based page; absent means 0. */
  readonly page?: number;
}

/** InstantSearch's `uiState`: entries keyed by index name, e.g. `products_fr_be`. */
export type SearchState = Readonly<Record<string, IndexSearchState>>;

export type SearchStateUpdater =
  | SearchState
  | ((searchState: SearchState) => SearchState);

/** Read-only answer to the last request. */
export interface SearchResults {
  readonly status: SearchStatus;
  /** Last products result; kept while the next one loads, cleared on error or close. */
  readonly products?: SearchResult<SearchProductHit>;
  readonly sections?: SearchSections;
  readonly error?: unknown;
}

/** An attribute the shopper can filter products on, from the search config. */
export interface FilterableAttribute {
  readonly key: string;
  readonly label: string;
  readonly type: "keyword" | "number" | "boolean" | "date";
  readonly values: readonly string[];
}

/** The part of the storefront search config the SDK reads. */
export interface SearchConfig {
  readonly filterableAttributes: readonly FilterableAttribute[];
}

/** The merchant's configuration, passed in or loaded once per page. */
export interface MerchantConfig {
  /** Absent when the merchant chose none or its loading failed. */
  readonly businessRanking?: SearchBusinessRanking;
  readonly searchConfig?: SearchConfig;
}

/** Read-only context the requests and the UI are built from. */
export interface SearchContext {
  /** Lowercase ISO 639-1 language code, e.g. `fr`. */
  readonly language: string;
  /** Shopper's ISO 3166-1 alpha-2 country, e.g. `BE`. */
  readonly country: string;
  /** Undefined until loaded, without one, or when its loading failed. */
  readonly businessRanking?: SearchBusinessRanking;
  /** Empty until loaded or when its loading failed. */
  readonly filterableAttributes: readonly FilterableAttribute[];
  /** Default texts of the language, overrides applied. */
  readonly texts: SearchTexts;
}

export interface SearchSnapshot {
  readonly searchState: SearchState;
  readonly results: SearchResults;
  readonly context: SearchContext;
}

export interface SearchControllerOptions {
  /** Search function bound to its client, or a custom transport. */
  transport: SearchFunction;
  /** Loads the merchant config when `config` is absent; without either, the context keeps no config. */
  apiKey?: string;
  /** The merchant config when the surface already has it; nothing is then loaded. */
  config?: MerchantConfig;
  /** Replace some of the default texts. */
  texts?: Partial<SearchTexts>;
  language: string;
  country: string;
  /** Event callbacks; the controller batches and deduplicates impressions. */
  analytics: SearchControllerAnalytics;
  /** Navigate after recording a selection. Omit to use native link navigation. */
  navigate?: (url: string, hit: SearchProductHit) => void;
  /** Build a product's link when its hit has no `url`, e.g. `/products/${hit.handle}`. */
  buildProductUrl?: (hit: SearchProductHit) => string | undefined;
  initialSearchState?: SearchState;
  /** Delay before a query change is sent; other changes are sent at once. */
  debounceMs?: number;
  hitsPerPage?: number;
  /** Sections searched next to products; the empty query searches none. */
  sections?: readonly SearchSection[] | (() => readonly SearchSection[]);
}

/** Holds the search state, the results and the context of one search. */
export interface SearchController {
  /** The same object until the next change. */
  getSnapshot(): SearchSnapshot;
  /** Called with a new snapshot on each change; returns an unsubscribe function. */
  subscribe(listener: (snapshot: SearchSnapshot) => void): () => void;
  /** Any change other than the page resets the page to 0. */
  setSearchState(updater: SearchStateUpdater): void;
  /** Send the search state now, without waiting for a pending query debounce. */
  search(): void;
  /** Emit the search opened signal; with no query, run the empty-query search. */
  open(): void;
  /** Cancel requests, flush qualified impressions and return to idle with no query. */
  close(): void;
  /** Track impressions for the element rendering `results.products.hits[index]`. */
  observeHit(element: Element, index: number): void;
  /**
   * Record the impression and selection of `results.products.hits[index]`, then
   * call `navigate`. Pass `{ navigate: false }` for middle-clicks or modified clicks.
   * Returns true when `navigate` ran; call `preventDefault()` then.
   */
  selectHit(index: number, options?: { navigate?: boolean }): boolean;
  /** The hit's `url`, else `buildProductUrl`'s result; undefined when neither gives one. */
  productUrl(hit: SearchProductHit): string | undefined;
  /** Replay the last request when it failed. */
  retry(): void;
  /** Cancel requests, remove subscribers and observers; the controller then does nothing. */
  dispose(): void;
}
