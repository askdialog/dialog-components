import { searchIndexName } from "../services/search";
import {
  SearchIndex,
  SearchProductHit,
  SearchRequest,
  SearchResponse,
  SearchResult,
  SearchSections,
} from "../types/search";
import { SearchControllerOptions } from "../search/types";
import { SearchSection } from "../types/searchController";
import { ProductsQuery } from "./searchFilters";

const QUERY_SUGGESTIONS_PER_PAGE = 5;

const isQuerySuggestions = (section: SearchSection): boolean =>
  section.index === "query_suggestions";

export const requestedSections = (
  query: string,
  sections: SearchControllerOptions["sections"] = [],
): readonly SearchSection[] => {
  const resolved = typeof sections === "function" ? sections() : sections;

  // The empty query lists products, and beside them only query suggestions:
  // the most popular, when the merchant chose them.
  return query === "" ? resolved.filter(isQuerySuggestions) : resolved;
};

interface SearchRequestConfig {
  indexName: string;
  language: string;
  country: string;
  hitsPerPage: number;
}

interface SearchResults {
  response: SearchResult<SearchProductHit>;
  sections: SearchSections | undefined;
}

/** Sections search the products query, never its filters. */
export const buildSearchRequest = (
  products: ProductsQuery,
  sections: readonly SearchSection[],
  { indexName, language, country, hitsPerPage }: SearchRequestConfig,
): SearchRequest => ({
  requests: [
    { indexName, ...products, hitsPerPage },
    ...sections.map((section) => ({
      indexName: searchIndexName(section.index, language, country),
      query: products.query,
      page: 0,
      hitsPerPage:
        section.hitsPerPage ??
        (isQuerySuggestions(section)
          ? QUERY_SUGGESTIONS_PER_PAGE
          : hitsPerPage),
    })),
  ],
});

export const readSearchResults = (
  result: SearchResponse,
  requested: readonly SearchSection[],
  { indexName, language, country }: SearchRequestConfig,
): SearchResults => {
  const response = result.results.find((entry) => entry.index === indexName);
  if (response === undefined) {
    throw new Error(`Dialog search returned no ${indexName} entry`);
  }
  const sections: Partial<Record<SearchIndex, SearchResult>> = {};
  for (const section of requested) {
    const requestedIndexName = searchIndexName(
      section.index,
      language,
      country,
    );
    const entry = result.results.find(
      (candidate) => candidate.index === requestedIndexName,
    );
    if (entry !== undefined) {
      sections[section.index] = entry;
    }
  }

  return {
    // Each index answers its own record type.
    response: response as SearchResult<SearchProductHit>,
    sections: requested.length === 0 ? undefined : (sections as SearchSections),
  };
};
