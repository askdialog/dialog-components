/** Supported indices before adding language and country. */
export const SEARCH_INDICES = [
  "products",
  "collections",
  "articles",
  "pages",
] as const;

export type SearchIndex = (typeof SEARCH_INDICES)[number];

export interface SearchQuery {
  /**
   * `<index>_<lang>_<country>`, e.g. `products_fr_be`.
   * Use the same language and lowercase ISO 3166-1 alpha-2 country for every entry.
   * Unsupported index names return 404.
   */
  indexName: string;
  /** At least two code points after server-side trimming. */
  query: string;
  /** Zero-based page; server default: 0. */
  page?: number;
  /** Page size from 1 to 100; server default: 20. */
  hitsPerPage?: number;
}

export interface SearchRequest {
  requests: SearchQuery[];
}

export interface SearchOptions {
  /** Passed to fetch; cancellation rejects with `AbortError`. */
  signal?: AbortSignal;
}

/** A collection, article or page hit. */
export interface SearchHit {
  objectID: string;
  title?: string;
  url?: string;
  handle?: string;
  imageUrl?: string;
}

/**
 * A product hit: Algolia's Shopify record, plus `url` and `currency`.
 * Prices are numbers in the base currency of the shopper's market (`currency`);
 * a price the market lacks is absent.
 */
export interface SearchProductHit {
  /** Variant id, the last segment of the Shopify GID. */
  objectID: string;
  /** Product id, a number when numeric. */
  id: number | string;
  title?: string;
  handle?: string;
  url?: string;
  variant_title?: string;
  position?: number;
  image?: string;
  product_image?: string;
  body_html_safe?: string;
  vendor?: string;
  product_type?: string;
  tags: string[];
  sku?: string;
  barcode?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  /** Lowercase option name to selected value. */
  options: Record<string, string>;
  option_names: string[];
  price?: number;
  compare_at_price?: number;
  variants_min_price?: number;
  variants_max_price?: number;
  variants_compare_at_price_min?: number;
  variants_compare_at_price_max?: number;
  /** ISO 4217 base currency of the shopper's market. */
  currency?: string;
  variants_count?: number;
  inventory_quantity?: number;
  inventory_available: boolean;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
}

/** Products results carry `SearchProductHit`, other indices `SearchHit`. */
export interface SearchResult<THit = SearchProductHit | SearchHit> {
  index: string;
  hits: THit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
  query: string;
  queryID: string;
}

/** Results in request order. */
export interface SearchResponse {
  results: SearchResult[];
}
