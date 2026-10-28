import type {
  SearchController,
  SearchSnapshot,
} from "@askdialog/dialog-sdk/search";

export interface RecreatableController extends SearchController {
  /** Undo `dispose`: the next call creates a new instance. */
  revive(): void;
}

/**
 * A controller whose identity survives StrictMode's effect replay: `dispose`
 * drops the current instance, `revive` lets the next call create a new one,
 * and the subscribers (connectors, `useSyncExternalStore`) follow it.
 */
export const createRecreatableController = (
  create: () => SearchController,
): RecreatableController => {
  const listeners = new Set<(snapshot: SearchSnapshot) => void>();
  let current: SearchController | undefined;
  let disposed = false;
  // Kept after disposal, which leaves no instance to read.
  let lastSnapshot: SearchSnapshot | undefined;

  // A disposed controller does nothing until revived, as the SDK's.
  const run = (action: (controller: SearchController) => void): void => {
    if (!disposed) {
      action(get());
    }
  };

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
    getSnapshot() {
      if (!disposed || lastSnapshot === undefined) {
        lastSnapshot = get().getSnapshot();
      }

      return lastSnapshot;
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    setSearchState: (updater) => run((c) => c.setSearchState(updater)),
    search: () => run((c) => c.search()),
    open: () => run((c) => c.open()),
    close: () => run((c) => c.close()),
    observeHit: (element, index) => run((c) => c.observeHit(element, index)),
    selectHit: (index, options) => !disposed && get().selectHit(index, options),
    productUrl: (hit) => get().productUrl(hit),
    retry: () => run((c) => c.retry()),
    dispose() {
      disposed = true;
      current?.dispose();
      current = undefined;
    },
    revive() {
      disposed = false;
    },
  };
};
