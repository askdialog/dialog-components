import {
  SearchFacetsRequest,
  SearchFacetsResponse,
  SearchIndex,
  SearchOptions,
  SearchRequest,
  SearchResponse,
} from "../types/search";
import { postSearchApi } from "./searchApi";

const SEARCH_PATH = "/public/search/lexical";
const FACETS_PATH = "/public/search/lexical/facets";

/** Build an index name from an ISO 639-1 language and the shopper's ISO 3166-1 alpha-2 country. */
export const searchIndexName = (
  index: SearchIndex,
  language: string,
  country: string,
): string => {
  if (!/^[a-z]{2}$/.test(language)) {
    throw new Error("Search language must be a lowercase ISO 639-1 code.");
  }
  if (!/^[A-Za-z]{2}$/.test(country)) {
    throw new Error("Search country must be an ISO 3166-1 alpha-2 code.");
  }

  return `${index}_${language}_${country.toLowerCase()}`;
};

/** Send one request. The caller controls cancellation through `options.signal`. */
export const searchLexical = (
  apiKey: string,
  request: SearchRequest,
  options?: SearchOptions,
): Promise<SearchResponse> =>
  postSearchApi<SearchResponse>(apiKey, SEARCH_PATH, request, {
    signal: options?.signal,
  });

/** Count the products search per value; records no search analytics. The caller controls cancellation through `options.signal`. */
export const searchLexicalFacets = (
  apiKey: string,
  request: SearchFacetsRequest,
  options?: SearchOptions,
): Promise<SearchFacetsResponse> =>
  postSearchApi<SearchFacetsResponse>(apiKey, FACETS_PATH, request, {
    signal: options?.signal,
  });
