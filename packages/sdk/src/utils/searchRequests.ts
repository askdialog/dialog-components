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

export const requestedSections = (
  query: string,
  sections: SearchControllerOptions["sections"] = [],
): readonly SearchSection[] => {
  if (query === "") {
    return []; // The empty query only lists products.
  }

  return typeof sections === "function" ? sections() : sections;
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

export const buildSearchRequest = (
  query: string,
  page: number,
  sections: readonly SearchSection[],
  { indexName, language, country, hitsPerPage }: SearchRequestConfig,
): SearchRequest => ({
  requests: [
    { indexName, query, page, hitsPerPage },
    ...sections.map((section) => ({
      indexName: searchIndexName(section.index, language, country),
      query,
      page: 0,
      hitsPerPage: section.hitsPerPage ?? hitsPerPage,
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
