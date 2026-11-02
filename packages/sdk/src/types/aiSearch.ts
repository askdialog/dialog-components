import type { SearchFilters } from "./searchFilters";

/** The filters one source applied: the AI query constructor's, or the shopper's. */
export interface SearchFilterBlock extends SearchFilters {
  source: "query_constructor" | "user";
}

/** The display label of each filtered attribute, keyed by attribute. */
export type SearchAttributeLabels = Record<string, string>;

/** What an AI search result adds to a lexical one. */
export interface AiSearchResultFields {
  /** One block per source; blocks combine with AND. */
  filters?: SearchFilterBlock[];
  /** The label of each attribute in `filters`. */
  attributeLabels?: SearchAttributeLabels;
}

/** What an AI search returned, for the overview written about its first page. */
export interface AiOverviewRequest {
  /** At least two code points after trimming. */
  query: string;
  /** Lowercase ISO 639-1 language code. */
  language: string;
  /** Shopper's ISO 3166-1 alpha-2 country, as in the search's index name. */
  country: string;
  /** The overview covers page 0 only. */
  page?: 0;
  filters?: SearchFilterBlock[];
  nbHits: number;
  /** At most 3. */
  objectIDs?: string[];
}

/** A next AI search to offer, with its complete filters. */
export interface AiOverviewSuggestion {
  label: string;
  filters: SearchFilters;
}

export interface AiOverviewResponse {
  text: string;
  suggestions: AiOverviewSuggestion[];
  attributeLabels?: SearchAttributeLabels;
}
