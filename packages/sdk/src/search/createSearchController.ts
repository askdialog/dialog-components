import { searchIndexName } from "../services/search";
import { SearchStatus } from "../types/searchController";
import { createHitTracking } from "./hitTracking";
import { createSearchRunner } from "./searchRunner";
import {
  applySearchState,
  readIndexState,
  searchStateChange,
} from "./searchState";
import {
  SearchController,
  SearchControllerOptions,
  SearchResults,
  SearchSnapshot,
  SearchState,
} from "./types";

const IDLE: SearchResults = { status: SearchStatus.IDLE };

/** Hold the search state, the results and the context; send a request on each change. */
export function createSearchController({
  transport,
  language,
  country,
  analytics,
  navigate,
  buildProductUrl,
  initialSearchState = {},
  debounceMs = 100,
  hitsPerPage = 12,
  sections = [],
}: SearchControllerOptions): SearchController {
  const indexName = searchIndexName("products", language, country);
  const context = { language, country };
  const listeners = new Set<(snapshot: SearchSnapshot) => void>();
  let snapshot: SearchSnapshot = {
    searchState: {
      ...initialSearchState,
      [indexName]: readIndexState(initialSearchState, indexName),
    },
    results: IDLE,
    context,
  };
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  const update = (patch: Partial<SearchSnapshot>): void => {
    snapshot = { ...snapshot, ...patch };
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const hitTracking = createHitTracking({
    analytics,
    navigate,
    buildProductUrl,
    products: () => snapshot.results.products,
  });

  const runner = createSearchRunner({
    transport,
    requestConfig: { indexName, language, country, hitsPerPage },
    sections,
    onResults: (next) => {
      const results = next(snapshot.results);
      if (
        results.products !== undefined &&
        results.products !== snapshot.results.products
      ) {
        hitTracking.onProducts(results.products);
      }
      update({ results });
    },
  });

  const cancel = (): void => {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
    runner.cancel();
  };

  const send = (): void => {
    debounceTimer = undefined;
    void runner.run(readIndexState(snapshot.searchState, indexName));
  };

  return {
    getSnapshot: () => snapshot,

    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    setSearchState(updater) {
      if (disposed) {
        return;
      }
      const applied = applySearchState(snapshot.searchState, updater);
      const searchState = {
        ...applied,
        [indexName]: readIndexState(applied, indexName),
      };
      const change = searchStateChange(
        snapshot.searchState,
        searchState,
        indexName,
      );
      update({ searchState });
      // A subscriber can dispose the controller while notified.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (disposed) {
        return;
      }
      if (change === "query") {
        cancel();
        debounceTimer = setTimeout(send, debounceMs);
      } else if (change === "other") {
        cancel();
        send();
      }
    },

    open() {
      if (disposed) {
        return;
      }
      hitTracking.open();
      const { status } = snapshot.results;
      const waiting =
        status !== SearchStatus.IDLE && status !== SearchStatus.ERROR;
      const query = readIndexState(snapshot.searchState, indexName).query;
      if (waiting || debounceTimer !== undefined || query !== "") {
        return;
      }
      send();
    },

    close() {
      if (disposed) {
        return;
      }
      cancel();
      hitTracking.close();
      const searchState: SearchState = {
        ...snapshot.searchState,
        [indexName]: { query: "", page: 0 },
      };
      update({ searchState, results: IDLE });
    },

    retry() {
      const failed = runner.failed();
      if (disposed || failed === undefined) {
        return;
      }
      void runner.run(failed);
    },

    observeHit: hitTracking.observeHit,
    selectHit: hitTracking.selectHit,
    productUrl: hitTracking.productUrl,

    dispose() {
      disposed = true;
      cancel();
      listeners.clear();
      hitTracking.dispose();
    },
  };
}
