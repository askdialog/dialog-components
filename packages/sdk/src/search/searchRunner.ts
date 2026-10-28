import { SearchFunction, SearchStatus } from "../types/searchController";
import {
  buildSearchRequest,
  readSearchResults,
  requestedSections,
} from "../utils/searchRequests";
import {
  IndexSearchState,
  SearchControllerOptions,
  SearchResults,
} from "./types";

interface SearchRunnerOptions {
  transport: SearchFunction;
  requestConfig: Parameters<typeof buildSearchRequest>[3];
  sections: SearchControllerOptions["sections"];
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
  onResults,
}: SearchRunnerOptions): {
  run: (entry: Required<IndexSearchState>) => Promise<void>;
  cancel: () => void;
  /** The last request when it failed, else undefined. */
  failed: () => Required<IndexSearchState> | undefined;
} => {
  let abortController: AbortController | undefined;
  let requestId = 0;
  let failed: Required<IndexSearchState> | undefined;

  const cancel = (): void => {
    requestId += 1;
    abortController?.abort();
    abortController = undefined;
  };

  const run = async (entry: Required<IndexSearchState>): Promise<void> => {
    cancel();
    failed = undefined;
    const controller = new AbortController();
    abortController = controller;
    const id = requestId;
    const query = entry.query.trim();
    const requested = requestedSections(query, sections);
    const request = buildSearchRequest(
      query,
      entry.page,
      requested,
      requestConfig,
    );

    onResults((results) => ({ ...results, status: SearchStatus.LOADING }));
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

  return { run, cancel, failed: () => failed };
};
