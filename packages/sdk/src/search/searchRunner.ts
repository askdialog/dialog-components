import { SearchFacetCounts } from "../types/search";
import { SearchStatus } from "../types/searchController";
import {
  buildSearchRequest,
  readSearchResults,
  requestedSections,
} from "../utils/searchRequests";
import { productsQuery } from "../utils/searchFilters";
import { countedAttributes, createFacetCounts } from "./facetCounts";
import { SearchModeSetup } from "./searchMode";
import { ReadIndexState } from "./searchState";
import { FilterableAttribute, SearchResults } from "./types";

interface SearchRunnerOptions extends SearchModeSetup {
  requestConfig: Parameters<typeof buildSearchRequest>[2];
  /** Read when each request is built. */
  filterableAttributes: () => readonly FilterableAttribute[];
  /** Called with each results change; never after `cancel` for that request. */
  onResults: (update: (results: SearchResults) => SearchResults) => void;
}

const isAbort = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

// The results with these counts in place of the ones they held.
const withCounts = (
  results: SearchResults,
  counts: SearchFacetCounts | undefined,
): SearchResults => {
  const next: { -readonly [Key in keyof SearchResults]: SearchResults[Key] } = {
    ...results,
  };
  delete next.facets;
  delete next.facetsStats;
  if (counts !== undefined) {
    next.facets = counts.facets;
    if (counts.facetsStats !== undefined) {
      next.facetsStats = counts.facetsStats;
    }
  }

  return next;
};

/**
 * Send one products request at a time: a newer one aborts the previous, a
 * stale answer is dropped. With a counts transport, their counts leave with
 * them, apart: the hits never wait for them.
 */
export const createSearchRunner = ({
  transport,
  requestConfig,
  sections,
  filterableAttributes,
  facetsTransport,
  minQueryLength,
  onResults,
}: SearchRunnerOptions): {
  run: (entry: ReadIndexState) => Promise<void>;
  /** Abort the products request; counts on their way go on, unless the next search asks others. */
  cancel: () => void;
  /** Abort both requests and forget the counts. */
  stop: () => void;
  /** Send the last request again when it carries refinements, read against a new search config. */
  refresh: () => void;
  /** The last request when it failed, else undefined. */
  failed: () => ReadIndexState | undefined;
} => {
  let abortController: AbortController | undefined;
  let requestId = 0;
  let failed: ReadIndexState | undefined;
  let last: ReadIndexState | undefined;
  let counts: SearchFacetCounts | undefined;
  const facetCounts =
    facetsTransport === undefined
      ? undefined
      : createFacetCounts({
          transport: facetsTransport,
          indexName: requestConfig.indexName,
          attributes: () => countedAttributes(filterableAttributes()),
          onCounts: (next) => {
            counts = next;
            onResults((results) => withCounts(results, counts));
          },
        });

  const queryOf = (entry: ReadIndexState) =>
    productsQuery(
      { ...entry, query: entry.query.trim() },
      filterableAttributes(),
    );

  const cancel = (): void => {
    requestId += 1;
    failed = undefined;
    last = undefined;
    abortController?.abort();
    abortController = undefined;
  };

  const run = async (entry: ReadIndexState): Promise<void> => {
    cancel();
    const query = entry.query.trim();
    if ([...query].length < minQueryLength) {
      onResults(() => ({ status: SearchStatus.IDLE }));

      return;
    }
    const controller = new AbortController();
    abortController = controller;
    last = entry;
    const id = requestId;
    const requested = requestedSections(query, sections);
    const products = queryOf(entry);
    const request = buildSearchRequest(products, requested, requestConfig);

    onResults((results) => ({ ...results, status: SearchStatus.LOADING }));
    if (id !== requestId) {
      return; // A subscriber cancelled it while notified.
    }
    // Sent first, so that both leave together and the hits never wait for it.
    facetCounts?.request(products);
    try {
      const response = await transport(request, { signal: controller.signal });
      if (id !== requestId) {
        return; // A newer request replaced this one.
      }
      const { response: hits, sections: answered } = readSearchResults(
        response,
        requested,
        requestConfig,
      );
      onResults(() =>
        withCounts(
          {
            status:
              hits.nbHits === 0 ? SearchStatus.EMPTY : SearchStatus.SUCCESS,
            products: hits,
            sections: answered,
            filters: hits.filters,
            attributeLabels: hits.attributeLabels,
          },
          counts,
        ),
      );
    } catch (error) {
      if (isAbort(error) || id !== requestId) {
        return; // Cancellation and superseded requests are not search errors.
      }
      failed = entry;
      onResults(() => ({ status: SearchStatus.ERROR, error }));
    }
  };

  const stop = (): void => {
    cancel();
    facetCounts?.stop();
    counts = undefined;
  };

  // Counts already asked for the same search and attributes are not asked again.
  const refresh = (): void => {
    if (last?.refinementList !== undefined || last?.range !== undefined) {
      void run(last);
    } else if (last !== undefined) {
      facetCounts?.request(queryOf(last));
    }
  };

  return { run, cancel, stop, refresh, failed: () => failed };
};
