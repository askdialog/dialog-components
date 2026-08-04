// Mirrors the public Nest storefront-search DTO exactly (POST /public/search,
// `storefrontSearchRequestSchema` / `storefrontSearchResponseSchema` in
// @dialog/shared-schemas) — camelCase wire format, no internal Python casing.

export interface SearchRequest {
  /** Trimmed server-side; must keep at least two visible characters (code points). */
  query: string;
  /** Zero-indexed results page. Defaults to 0 server-side. */
  page?: number;
  /** Between 1 and 100. Defaults to 20 server-side. */
  hitsPerPage?: number;
  /** Previous response's queryId while the query is unchanged; omit for a new query. */
  queryId?: string;
}

export interface SearchOptions {
  /** Forwarded to fetch untouched: aborting rejects with the native AbortError. */
  signal?: AbortSignal;
}

export interface SearchPrice {
  /** Decimal amount as a string, exactly as indexed (e.g. "24.90"). */
  amount: string;
  currencyCode: string;
}

export interface SearchPriceRange {
  min: SearchPrice;
  max: SearchPrice;
}

/**
 * Storefront-ready projection of a search hit. Every display field is
 * best-effort: a product may carry only its id.
 */
export interface SearchProduct {
  id: string;
  title?: string;
  url?: string;
  imageUrl?: string;
  priceRange?: SearchPriceRange;
  inStock?: boolean;
}

export interface SearchHit {
  id: string;
  score: number;
  product: SearchProduct;
}

export interface SearchResponse {
  /** Engine-generated id for search attribution analytics. */
  queryId: string;
  hits: SearchHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMs: number;
  query: string;
}
