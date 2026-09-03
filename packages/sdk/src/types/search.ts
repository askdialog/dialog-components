/** Logical indices the public search serves; the wire name adds the locale. */
export const SEARCH_INDICES = [
  "products",
  "collections",
  "articles",
  "pages",
] as const;

export type SearchIndex = (typeof SEARCH_INDICES)[number];

export interface SearchQuery {
  /** `<index>_<locale>` (e.g. `products_fr`), one shared locale per request; unknown or unserved → 404. */
  indexName: string;
  /** Trimmed server-side; must keep at least two visible characters (code points). */
  query: string;
  /** Zero-indexed results page. Defaults to 0 server-side. */
  page?: number;
  /** Between 1 and 100. Defaults to 20 server-side. */
  hitsPerPage?: number;
}

export interface SearchRequest {
  requests: SearchQuery[];
}

export interface SearchOptions {
  /** Forwarded to fetch untouched: aborting rejects with the native AbortError. */
  signal?: AbortSignal;
}

export interface SearchPrice {
  /** Decimal amount as a string, exactly as indexed (e.g. "24.90"). */
  amount: string;
  /** Absent when the price was indexed without a currency. */
  currencyCode?: string;
}

export interface SearchPriceRange {
  min: SearchPrice;
  max: SearchPrice;
}

/**
 * A flat, storefront-ready record: `objectID` plus the record's attributes.
 * Every display field is best-effort — a hit may carry only its id;
 * `priceRange` only comes from the products index.
 */
export interface SearchHit {
  objectID: string;
  title?: string;
  url?: string;
  handle?: string;
  imageUrl?: string;
  priceRange?: SearchPriceRange;
}

export interface SearchResult {
  index: string;
  hits: SearchHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
  query: string;
  queryID: string;
}

/** One entry per request entry, in request order. */
export interface SearchResponse {
  results: SearchResult[];
}
