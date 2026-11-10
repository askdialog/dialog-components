import { SearchAttributeLabels, SearchFilterBlock } from "../types/aiSearch";
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
import { SearchAppearance } from "../types/searchAppearance";
import { SearchFilters } from "../types/searchFilters";
import { SearchTexts } from "../utils/searchTexts";
import { FilterableAttribute, MerchantConfig } from "./merchantConfigTypes";
import { SearchRouting } from "./routeUrl";

export type {
  FilterableAttribute,
  MerchantConfig,
  SearchConfig,
} from "./merchantConfigTypes";

/** What the visitor asks for on one index, in InstantSearch's `uiState` entry shape. */
export interface IndexSearchState {
  readonly query: string;
  /** Zero-based page; absent means 0. */
  readonly page?: number;
  /**
   * Values picked per attribute: OR within an attribute, AND across. An attribute
   * the search config does not declare as `keyword` or `boolean` is not sent.
   */
  readonly refinementList?: Readonly<Record<string, readonly string[]>>;
  /**
   * Inclusive bounds per attribute, `min:max`, either side empty. An attribute
   * the search config does not declare as `number` is not sent.
   */
  readonly range?: Readonly<Record<string, `${number | ""}:${number | ""}`>>;
  /**
   * Filters the other two cannot express (an exclusion, a mix of attributes in
   * one group, a strict or exact bound), sent as they are.
   */
  readonly filters?: SearchFilters;
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
  /** AI mode: the filters the last products result applied, one block per source. */
  readonly filters?: readonly SearchFilterBlock[];
  /** AI mode: the label of each attribute in `filters`. */
  readonly attributeLabels?: Readonly<SearchAttributeLabels>;
  readonly error?: unknown;
}

/** Read-only context the requests and the UI are built from. */
export interface SearchContext {
  /** The controller's mode, fixed at its creation. */
  readonly mode: SearchMode;
  /** Lowercase ISO 639-1 language code, e.g. `fr`. */
  readonly language: string;
  /** Shopper's ISO 3166-1 alpha-2 country, e.g. `BE`. */
  readonly country: string;
  /** ISO 4217 currency of the shopper's market; prices show as bare amounts without it. */
  readonly currency?: string;
  /** Undefined until loaded, without one, or when its loading failed. */
  readonly businessRanking?: SearchBusinessRanking;
  /** Empty until loaded or when its loading failed. */
  readonly filterableAttributes: readonly FilterableAttribute[];
  /** The merchant's search appearance; `{}` until loaded, without one, or when its loading failed. */
  readonly appearance: SearchAppearance;
  /** Default texts of the language, overrides applied. */
  readonly texts: SearchTexts;
  /** The path a hit's relative `_display.url` resolves under. */
  readonly storefrontRoot: string;
}

export interface SearchSnapshot {
  readonly searchState: SearchState;
  readonly results: SearchResults;
  readonly context: SearchContext;
}

/** Lexical matches product titles; AI extracts filters from a natural-language query. */
export type SearchMode = "lexical" | "ai";

export interface SearchControllerOptions {
  /**
   * Fixed at creation; default `lexical`. The AI mode searches products only,
   * and sends no request for a query shorter than 2 characters.
   */
  mode?: SearchMode;
  /** Replaces the mode's transport, which `apiKey` then needn't bind. */
  transport?: SearchFunction;
  /**
   * Binds the mode's transport when `transport` is absent, and loads the
   * merchant config when `config` is absent; without either, the context keeps no config.
   */
  apiKey?: string;
  /**
   * The merchant config when the surface already has it, e.g. from
   * `loadMerchantConfig`; nothing is then loaded.
   */
  config?: MerchantConfig;
  /** Replace some of the default texts. */
  texts?: Partial<SearchTexts>;
  language: string;
  country: string;
  /** ISO 4217 currency of the shopper's market, e.g. `EUR`, which filter prices are written in. */
  currency?: string;
  /** Event callbacks; the controller batches and deduplicates impressions. */
  analytics: SearchControllerAnalytics;
  /** Navigate after recording a selection. Omit to use native link navigation. */
  navigate?: (url: string, hit: SearchProductHit) => void;
  /** @deprecated Ignored: every hit's `_display.url` is its link. */
  buildProductUrl?: (hit: SearchProductHit) => string | undefined;
  /**
   * The path a relative `_display.url` resolves under, e.g. `/` or `/fr-fr/`
   * (Shopify's `window.Shopify.routes.root`); default `/`.
   */
  storefrontRoot?: string;
  initialSearchState?: SearchState;
  /**
   * Keep the products entry's query, page and refinements in the URL, pushing
   * a history entry on each change but a query's, and follow back and forward.
   * `true` reads and writes `q`, `page`, `f.<attribute>` and `price`.
   */
  routing?: boolean | SearchRouting;
  /** Delay before a query change is sent; other changes are sent at once. */
  debounceMs?: number;
  hitsPerPage?: number;
  /**
   * Sections searched next to products; the empty query searches only
   * `query_suggestions`. Each section gets `hitsPerPage`, 5 for `query_suggestions`.
   */
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
  /** The hit's `_display.url` resolved under `storefrontRoot`; undefined when unsafe or off the storefront. */
  productUrl(hit: SearchProductHit): string | undefined;
  /** Replay the last request when it failed. */
  retry(): void;
  /** A controller over a copy of this search state, sharing its context and results. */
  createDraft(): SearchDraft;
  /** Cancel requests, remove subscribers and observers; the controller then does nothing. */
  dispose(): void;
}

/**
 * A controller that collects search state changes, e.g. in a filters sheet, and
 * sends no request: `search`, `open`, `close` and `retry` do nothing, and hits
 * are tracked on the parent, whose context and results it shows.
 */
export interface SearchDraft extends SearchController {
  /** Apply the draft's search state to the parent in one search, then end the draft. */
  commit(): void;
  /** End the draft without applying it. */
  discard(): void;
}
