import { SearchFunction, SearchStatus } from "../types/searchController";
import {
  buildSearchRequest,
  readSearchResults,
  requestedSections,
} from "../utils/searchRequests";
import { productsQuery } from "../utils/searchFilters";
import { ReadIndexState } from "./searchState";
import {
  FilterableAttribute,
  SearchControllerOptions,
  SearchResults,
} from "./types";

interface SearchRunnerOptions {
  transport: SearchFunction;
  requestConfig: Parameters<typeof buildSearchRequest>[2];
  sections: SearchControllerOptions["sections"];
  /** Read when each request is built. */
  filterableAttributes: () => readonly FilterableAttribute[];
  /** Called with each results change; never after `cancel` for that request. */
  onResults: (update: (results: SearchResults) => SearchResults) => void;
}

const isAbort = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

/** Send one request at a time: a newer one aborts the previous, a stale answer is dropped. */
export const createSearchRunner = ({
  transport,
  requestConfig,
  sections,
  filterableAttributes,
  onResults,
}: SearchRunnerOptions): {
  run: (entry: ReadIndexState) => Promise<void>;
  cancel: () => void;
  /** Send the last request again when it carries refinements, read against a new search config. */
  refresh: () => void;
  /** The last request when it failed, else undefined. */
  failed: () => ReadIndexState | undefined;
} => {
  let abortController: AbortController | undefined;
  let requestId = 0;
  let failed: ReadIndexState | undefined;
  let last: ReadIndexState | undefined;

  const cancel = (): void => {
    requestId += 1;
    failed = undefined;
    last = undefined;
    abortController?.abort();
    abortController = undefined;
  };

  const run = async (entry: ReadIndexState): Promise<void> => {
    cancel();
    const controller = new AbortController();
    abortController = controller;
    last = entry;
    const id = requestId;
    const query = entry.query.trim();
    const requested = requestedSections(query, sections);
    const request = buildSearchRequest(
      productsQuery({ ...entry, query }, filterableAttributes()),
      requested,
      requestConfig,
    );

    onResults((results) => ({ ...results, status: SearchStatus.LOADING }));
    if (id !== requestId) {
      return; // A subscriber cancelled it while notified.
    }
    try {
      const response = await transport(request, { signal: controller.signal });
      if (id !== requestId) {
        return; // A newer request replaced this one.
      }
      const { response: products, sections: answered } = readSearchResults(
        response,
        requested,
        requestConfig,
      );
      onResults(() => ({
        status:
          products.nbHits === 0 ? SearchStatus.EMPTY : SearchStatus.SUCCESS,
        products,
        sections: answered,
      }));
    } catch (error) {
      if (isAbort(error) || id !== requestId) {
        return; // Cancellation and superseded requests are not search errors.
      }
      failed = entry;
      onResults(() => ({ status: SearchStatus.ERROR, error }));
    }
  };

  const refresh = (): void => {
    if (last?.refinementList !== undefined || last?.range !== undefined) {
      void run(last);
    }
  };

  return { run, cancel, refresh, failed: () => failed };
};
