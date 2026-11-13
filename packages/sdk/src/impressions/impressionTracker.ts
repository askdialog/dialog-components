// The rule for every Dialog view: at least half of the element visible for one
// continuous second, counted once per item and per context (`reset()`).
// Batches go out on idle, at the batch limit, on `flush()`, `reset()` and pagehide.
// Browser APIs only, no import: storefront bundles load this file alone.
const DEFAULT_VISIBILITY_THRESHOLD = 0.5;
const DEFAULT_DWELL_MS = 1000;
const DEFAULT_IDLE_FLUSH_MS = 1500;
const DEFAULT_MAX_ITEMS_PER_BATCH = 100;

export interface ImpressionTrackerOptions {
  /** Receive each batch of item ids, in the order they qualified. */
  onImpressions: (itemIds: string[]) => void;
  /** Share of the element that must be visible, 0.5 by default: keep the Dialog rule. */
  visibilityThreshold?: number;
  /** Continuous visible time in ms, 1000 by default: keep the Dialog rule. */
  dwellMs?: number;
  /** Quiet time in ms before a pending batch goes out. */
  idleFlushMs?: number;
  /** A batch goes out as soon as it holds this many items. */
  maxItemsPerBatch?: number;
}

export interface ImpressionTracker {
  /** Watch an element; its item counts once the element meets the visibility rule. */
  observe(element: Element, itemId: string): void;
  /** Count an item now, without waiting for visibility. */
  record(itemId: string): void;
  /** Send the pending batch. */
  flush(): void;
  /** Start a new context: send the pending batch, unwatch every element and count every item again. */
  reset(): void;
  /** Send the pending batch and stop tracking. */
  disconnect(): void;
}

export function createImpressionTracker({
  onImpressions,
  visibilityThreshold = DEFAULT_VISIBILITY_THRESHOLD,
  dwellMs = DEFAULT_DWELL_MS,
  idleFlushMs = DEFAULT_IDLE_FLUSH_MS,
  maxItemsPerBatch = DEFAULT_MAX_ITEMS_PER_BATCH,
}: ImpressionTrackerOptions): ImpressionTracker {
  let pending: string[] = [];
  const seen = new Set<string>();
  const observedItems = new Map<Element, string>();
  const dwellTimers = new Map<Element, ReturnType<typeof setTimeout>>();
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  const flush = (): void => {
    clearTimeout(idleTimer);
    if (pending.length === 0) {
      return;
    }
    const batch = pending;
    pending = [];
    onImpressions(batch);
  };

  const record = (itemId: string): void => {
    if (seen.has(itemId)) {
      return;
    }
    seen.add(itemId);
    pending.push(itemId);
    if (pending.length >= maxItemsPerBatch) {
      flush();

      return;
    }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(flush, idleFlushMs);
  };

  const cancelDwell = (element: Element): void => {
    const timer = dwellTimers.get(element);
    if (timer !== undefined) {
      clearTimeout(timer);
      dwellTimers.delete(element);
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const itemId = observedItems.get(entry.target);
        if (itemId === undefined) {
          continue;
        }
        if (entry.intersectionRatio < visibilityThreshold) {
          cancelDwell(entry.target);
          continue;
        }
        if (!dwellTimers.has(entry.target)) {
          dwellTimers.set(
            entry.target,
            setTimeout(() => {
              dwellTimers.delete(entry.target);
              record(itemId);
            }, dwellMs),
          );
        }
      }
    },
    { threshold: visibilityThreshold },
  );

  const stopObserving = (): void => {
    observer.disconnect();
    for (const timer of dwellTimers.values()) {
      clearTimeout(timer);
    }
    dwellTimers.clear();
    observedItems.clear();
  };

  // Send qualified impressions before leaving the page.
  const handlePagehide = (): void => {
    flush();
  };

  // A back/forward-cache restore is a new page display: count every item again, after a fresh dwell.
  const handlePageshow = (event: PageTransitionEvent): void => {
    if (!event.persisted) {
      return;
    }
    seen.clear();
    for (const element of observedItems.keys()) {
      cancelDwell(element);
      observer.unobserve(element);
      observer.observe(element);
    }
  };

  window.addEventListener("pagehide", handlePagehide);
  window.addEventListener("pageshow", handlePageshow);

  return {
    observe(element, itemId) {
      observedItems.set(element, itemId);
      observer.observe(element);
    },
    record,
    flush,
    reset() {
      flush();
      seen.clear();
      stopObserving();
    },
    disconnect() {
      flush();
      stopObserving();
      window.removeEventListener("pagehide", handlePagehide);
      window.removeEventListener("pageshow", handlePageshow);
    },
  };
}
