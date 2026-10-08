import { searchIndexName } from "../services/search";
import {
  SearchIndex,
  SearchProductHit,
  SearchRequest,
  SearchResponse,
  SearchResult,
  SearchSections,
} from "../types/search";
import {
  SearchControllerState,
  SearchSection,
  SearchStatus,
} from "../types/searchController";

export const INITIAL_SEARCH_STATE: SearchControllerState = {
  status: SearchStatus.IDLE,
  query: "",
  page: 0,
  response: undefined,
  sections: undefined,
  error: undefined,
};

// Match the API minimum query length.
const MIN_QUERY_CODE_POINTS = 2;

export const normalizeQuery = (rawQuery: string): string | undefined => {
  const query = rawQuery.trim();

  return [...query].length >= MIN_QUERY_CODE_POINTS ? query : undefined;
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
    // The products index answers product records only.
    response: response as SearchResult<SearchProductHit>,
    // Each index answers its own record.
    sections: requested.length === 0 ? undefined : (sections as SearchSections),
  };
};
