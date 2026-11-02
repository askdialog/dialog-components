import { searchIndexName } from "../services/search";
import { createListeners } from "./listeners";
import {
  applySearchState,
  searchStateChange,
  withIndexState,
} from "./searchState";
import { SearchController, SearchDraft, SearchSnapshot } from "./types";

/** Collect search state changes over the parent's results; `commit` sends them in one search. */
export const createSearchDraft = (parent: SearchController): SearchDraft => {
  const { language, country } = parent.getSnapshot().context;
  const indexName = searchIndexName("products", language, country);
  const listeners = createListeners<SearchSnapshot>();
  // The search state is immutable: the parent's object is the draft's copy.
  let snapshot: SearchSnapshot = { ...parent.getSnapshot() };
  let ended = false;

  const update = (patch: Partial<SearchSnapshot>): void => {
    snapshot = { ...snapshot, ...patch };
    listeners.notify(snapshot);
  };

  const unfollow = parent.subscribe(({ results, context }) => {
    if (results !== snapshot.results || context !== snapshot.context) {
      update({ results, context });
    }
  });

  const end = (): void => {
    ended = true;
    unfollow();
    listeners.clear();
  };

  const nothing = (): void => undefined;

  const draft: SearchDraft = {
    getSnapshot: () => snapshot,
    subscribe: listeners.subscribe,

    setSearchState(updater) {
      if (ended) {
        return;
      }
      update({
        searchState: withIndexState(
          applySearchState(snapshot.searchState, updater),
          indexName,
        ),
      });
    },

    search: nothing,
    open: nothing,
    close: nothing,
    retry: nothing,

    observeHit(element, index) {
      if (!ended) {
        parent.observeHit(element, index);
      }
    },
    selectHit: (index, options) => !ended && parent.selectHit(index, options),
    productUrl: (hit) => parent.productUrl(hit),

    createDraft: () => createSearchDraft(draft),

    commit() {
      if (ended) {
        return;
      }
      const { searchState } = snapshot;
      const change = searchStateChange(
        parent.getSnapshot().searchState,
        searchState,
        indexName,
      );
      end();
      parent.setSearchState(searchState);
      // A query change waits for the parent's debounce; send it now instead.
      if (change === "query") {
        parent.search();
      }
    },

    discard: end,
    dispose: end,
  };

  return draft;
};
