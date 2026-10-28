import { searchIndexName } from "../services/search";
import { SearchStatus } from "../types/searchController";
import { createHitTracking } from "./hitTracking";
import { createMerchantContext } from "./merchantConfig";
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
export function createSearchController(
  controllerOptions: SearchControllerOptions,
): SearchController {
  const {
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
  } = controllerOptions;
  const indexName = searchIndexName("products", language, country);
  const merchant = createMerchantContext(controllerOptions);
  const listeners = new Set<(snapshot: SearchSnapshot) => void>();
  let snapshot: SearchSnapshot = {
    searchState: {
      ...initialSearchState,
      [indexName]: readIndexState(initialSearchState, indexName),
    },
    results: IDLE,
    context: merchant.context,
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

  // The merchant config loads at the first open or search.
  const loadConfig = (): void => {
    merchant.load((loaded) => {
      if (!disposed) {
        update({ context: { ...snapshot.context, ...loaded } });
      }
    });
  };

  const cancel = (): void => {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
    runner.cancel();
  };

  const send = (): void => {
    debounceTimer = undefined;
    loadConfig();
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
        loadConfig();
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
      loadConfig();
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

    observeHit(element, index) {
      if (!disposed) {
        hitTracking.observeHit(element, index);
      }
    },

    selectHit: (index, options) =>
      !disposed && hitTracking.selectHit(index, options),

    productUrl: hitTracking.productUrl,

    dispose() {
      disposed = true;
      cancel();
      listeners.clear();
      hitTracking.dispose();
    },
  };
}
