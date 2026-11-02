import { searchIndexName } from "../services/search";
import { SearchStatus } from "../types/searchController";
import { createSearchDraft } from "./createSearchDraft";
import { createHitTracking } from "./hitTracking";
import { createListeners } from "./listeners";
import { createMerchantContext } from "./merchantConfig";
import { searchModeSetup } from "./searchMode";
import { createSearchRunner } from "./searchRunner";
import {
  applySearchState,
  readIndexState,
  searchStateChange,
  withIndexState,
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
    language,
    country,
    analytics,
    navigate,
    initialSearchState = {},
    debounceMs = 100,
    hitsPerPage = 12,
  } = controllerOptions;
  const indexName = searchIndexName("products", language, country);
  const merchant = createMerchantContext(controllerOptions);
  const listeners = createListeners<SearchSnapshot>();
  let snapshot: SearchSnapshot = {
    searchState: withIndexState(initialSearchState, indexName),
    results: IDLE,
    context: merchant.context,
  };
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  const update = (patch: Partial<SearchSnapshot>): void => {
    snapshot = { ...snapshot, ...patch };
    listeners.notify(snapshot);
  };

  const hitTracking = createHitTracking({
    analytics,
    navigate,
    storefrontRoot: merchant.context.storefrontRoot,
    products: () => snapshot.results.products,
  });

  const runner = createSearchRunner({
    ...searchModeSetup(controllerOptions),
    requestConfig: { indexName, language, country, hitsPerPage },
    filterableAttributes: () => snapshot.context.filterableAttributes,
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

  // The merchant config loads at the first open or search; the refinements
  // the last request dropped as unknown are sent once it is there.
  const loadConfig = (): void => {
    merchant.load((loaded) => {
      if (!disposed) {
        update({ context: { ...snapshot.context, ...loaded } });
        runner.refresh();
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

  const controller: SearchController = {
    getSnapshot: () => snapshot,
    subscribe: listeners.subscribe,

    setSearchState(updater) {
      if (disposed) {
        return;
      }
      const searchState = withIndexState(
        applySearchState(snapshot.searchState, updater),
        indexName,
      );
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

    search() {
      if (disposed) {
        return;
      }
      cancel();
      send();
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

    // Hit tracking does nothing once disposed.
    observeHit: hitTracking.observeHit,
    selectHit: hitTracking.selectHit,
    productUrl: hitTracking.productUrl,

    createDraft: () => createSearchDraft(controller),

    dispose() {
      disposed = true;
      cancel();
      listeners.clear();
      hitTracking.dispose();
    },
  };

  return controller;
}
