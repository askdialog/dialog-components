import {
  SearchFacetCounts,
  SearchFacetsRequest,
  SearchFacetsResponse,
} from "../types/search";
import { SearchFacetsFunction } from "../types/searchController";
import { ProductsQuery } from "../utils/searchFilters";
import { attributesToRender } from "./connectDynamicWidgets";
import { PRICE_ATTRIBUTE } from "./merchantConfig";
import { FilterableAttribute } from "./types";

interface FacetCountsOptions {
  transport: SearchFacetsFunction;
  indexName: string;
  /** The attributes to count, read when each request is built. */
  attributes: () => readonly string[];
  /** Called when counts answer, with undefined when they fail; never for a superseded request. */
  onCounts: (counts: SearchFacetCounts | undefined) => void;
}

/** What the `facets` option counts: the filters a filters UI renders, and the price's bounds. */
export const countedAttributes = (
  filterableAttributes: readonly FilterableAttribute[],
): string[] => [
  ...new Set([...attributesToRender(filterableAttributes), PRICE_ATTRIBUTE]),
];

const isAbort = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

/**
 * The counts of the products search, apart from its hits: one request per
 * query, filters and attributes, so a page change asks none; a request for
 * other ones aborts the previous.
 */
export const createFacetCounts = ({
  transport,
  indexName,
  attributes,
  onCounts,
}: FacetCountsOptions): {
  /** Ask the counts of this search, unless they are held or on their way. */
  request: (products: ProductsQuery) => void;
  /** Abort the counts on their way and forget the held ones. */
  stop: () => void;
} => {
  let abortController: AbortController | undefined;
  let requestId = 0;
  // The request whose counts are held or on their way.
  let sentKey: string | undefined;

  const stop = (): void => {
    requestId += 1;
    sentKey = undefined;
    abortController?.abort();
    abortController = undefined;
  };

  const request = ({
    query,
    facetFilters,
    numericFilters,
  }: ProductsQuery): void => {
    const body: SearchFacetsRequest = {
      indexName,
      query,
      ...(facetFilters === undefined ? {} : { facetFilters }),
      ...(numericFilters === undefined ? {} : { numericFilters }),
      facets: [...attributes()],
    };
    const key = JSON.stringify(body);
    if (key === sentKey) {
      return;
    }
    stop();
    sentKey = key;
    const controller = new AbortController();
    abortController = controller;
    const id = requestId;
    // A transport that throws fails like one that rejects.
    void new Promise<SearchFacetsResponse>((resolve) => {
      resolve(transport(body, { signal: controller.signal }));
    }).then(
      (response) => {
        if (id === requestId) {
          abortController = undefined;
          onCounts({
            facets: response.facets,
            facetsStats: response.facets_stats,
          });
        }
      },
      (error: unknown) => {
        if (id !== requestId || isAbort(error)) {
          return;
        }
        abortController = undefined;
        sentKey = undefined; // The next search asks them again.
        onCounts(undefined);
      },
    );
  };

  return { request, stop };
};
