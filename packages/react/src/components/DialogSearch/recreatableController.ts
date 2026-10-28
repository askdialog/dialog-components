import type {
  SearchController,
  SearchSnapshot,
} from "@askdialog/dialog-sdk/search";

/**
 * A controller whose identity survives StrictMode's effect replay: `dispose`
 * drops the current instance, the next call creates a new one, and the
 * subscribers (connectors, `useSyncExternalStore`) follow it.
 */
export const createRecreatableController = (
  create: () => SearchController,
): SearchController => {
  const listeners = new Set<(snapshot: SearchSnapshot) => void>();
  let current: SearchController | undefined;

  const get = (): SearchController => {
    if (current === undefined) {
      current = create();
      current.subscribe((snapshot) => {
        for (const listener of listeners) {
          listener(snapshot);
        }
      });
    }

    return current;
  };

  return {
    getSnapshot: () => get().getSnapshot(),
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    setSearchState: (updater) => get().setSearchState(updater),
    search: () => get().search(),
    open: () => get().open(),
    close: () => get().close(),
    observeHit: (element, index) => get().observeHit(element, index),
    selectHit: (index, options) => get().selectHit(index, options),
    productUrl: (hit) => get().productUrl(hit),
    retry: () => get().retry(),
    dispose() {
      current?.dispose();
      current = undefined;
    },
  };
};
