import {
  SearchAnalyticsEnvelope,
  SearchResultItem,
  ViewSearchResultsParams,
} from "../types/searchAnalytics";

// An item counts as seen after being ≥50% visible for ≥500ms; qualified items
// are batched and flushed on qualification inactivity, context change,
// pagehide or the batch cap — in practice 1-3 events per search, not one per
// item.
const DEFAULT_VISIBILITY_THRESHOLD = 0.5;
const DEFAULT_DWELL_MS = 500;
const DEFAULT_IDLE_FLUSH_MS = 1500;
const DEFAULT_MAX_ITEMS_PER_EVENT = 100;

export interface SearchImpressionTrackerOptions {
  /** Receives each flushed batch — wire it to `dialog.trackViewSearchResults`. */
  emit: (params: ViewSearchResultsParams) => void;
  visibilityThreshold?: number;
  dwellMs?: number;
  idleFlushMs?: number;
  maxItemsPerEvent?: number;
}

export interface SearchImpressionTracker {
  /** Declare the envelope of the response being rendered; flushes the previous batch. */
  setContext(envelope: SearchAnalyticsEnvelope): void;
  /** Watch a rendered result element for viewport impressions. */
  observe(element: Element, item: SearchResultItem): void;
  /** A click counts as an impression, otherwise CTR by position can exceed 100%. */
  forceImpression(item: SearchResultItem): void;
  flush(): void;
  disconnect(): void;
}

export function createSearchImpressionTracker({
  emit,
  visibilityThreshold = DEFAULT_VISIBILITY_THRESHOLD,
  dwellMs = DEFAULT_DWELL_MS,
  idleFlushMs = DEFAULT_IDLE_FLUSH_MS,
  maxItemsPerEvent = DEFAULT_MAX_ITEMS_PER_EVENT,
}: SearchImpressionTrackerOptions): SearchImpressionTracker {
  let envelope: SearchAnalyticsEnvelope | undefined;
  let pending: SearchResultItem[] = [];
  const seen = new Set<string>();
  const observedItems = new Map<Element, SearchResultItem>();
  const dwellTimers = new Map<Element, ReturnType<typeof setTimeout>>();
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  const flush = (): void => {
    clearTimeout(idleTimer);
    if (envelope === undefined || pending.length === 0) {
      return;
    }
    emit({ ...envelope, items: pending });
    pending = [];
  };

  const record = (item: SearchResultItem): void => {
    if (envelope === undefined) {
      return;
    }
    const key = `${envelope.query_id}:${item.product_id}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    pending.push(item);
    if (pending.length >= maxItemsPerEvent) {
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
        const item = observedItems.get(entry.target);
        if (item === undefined) {
          continue;
        }
        if (entry.intersectionRatio >= visibilityThreshold) {
          if (!dwellTimers.has(entry.target)) {
            dwellTimers.set(
              entry.target,
              setTimeout(() => {
                dwellTimers.delete(entry.target);
                record(item);
              }, dwellMs),
            );
          }
        } else {
          cancelDwell(entry.target);
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

  // The page can die mid-batch: ship what already qualified. The host bridge
  // captures this last event with a beacon-capable transport.
  const handlePagehide = (): void => {
    flush();
  };

  // A back/forward-cache restore is a new exposure: re-qualify what is on
  // screen instead of keeping it deduplicated forever. Dwell timers frozen
  // mid-count resume with their remaining delay, so cancel them — the
  // restored exposure must earn its full dwell.
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
    setContext(nextEnvelope) {
      // Pending impressions belong to the envelope they qualified under.
      flush();
      seen.clear();
      envelope = nextEnvelope;
      stopObserving();
    },
    observe(element, item) {
      observedItems.set(element, item);
      observer.observe(element);
    },
    forceImpression(item) {
      record(item);
      flush();
    },
    flush,
    disconnect() {
      flush();
      stopObserving();
      window.removeEventListener("pagehide", handlePagehide);
      window.removeEventListener("pageshow", handlePageshow);
    },
  };
}
