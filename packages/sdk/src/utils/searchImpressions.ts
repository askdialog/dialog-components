import { createImpressionTracker } from "../impressions";
import {
  SearchAnalyticsEnvelope,
  SearchResultItem,
  ViewSearchResultsParams,
} from "../types/searchAnalytics";

const DEFAULT_MAX_ITEMS_PER_EVENT = 100;

export interface SearchImpressionTrackerOptions {
  /** Receive each batch, typically through `dialog.trackViewSearchResults`. */
  emit: (params: ViewSearchResultsParams) => void;
  visibilityThreshold?: number;
  dwellMs?: number;
  idleFlushMs?: number;
  maxItemsPerEvent?: number;
}

export interface SearchImpressionTracker {
  /** Flush the previous batch and start tracking the new response. */
  setContext(envelope: SearchAnalyticsEnvelope): void;
  /** Track viewport impressions for a result element. */
  observe(element: Element, item: SearchResultItem): void;
  /** Record and flush an impression without waiting for visibility. */
  forceImpression(item: SearchResultItem): void;
  flush(): void;
  disconnect(): void;
}

/** Search result views under the Dialog impression rule, one per product and per response. */
export function createSearchImpressionTracker({
  emit,
  maxItemsPerEvent = DEFAULT_MAX_ITEMS_PER_EVENT,
  ...rule
}: SearchImpressionTrackerOptions): SearchImpressionTracker {
  let envelope: SearchAnalyticsEnvelope | undefined;
  // The result each element shows, and each clicked result: the event reports the one counted.
  const elementItems = new Map<Element, SearchResultItem>();
  const forcedItems = new Map<string, SearchResultItem>();

  // Impressions count products: the product id is the item id.
  const impressions = createImpressionTracker({
    ...rule,
    maxItemsPerBatch: maxItemsPerEvent,
    onImpressions(batch) {
      if (envelope === undefined) {
        return;
      }
      emit({
        ...envelope,
        items: batch.flatMap(
          ({ itemId, element }) =>
            (element === undefined
              ? forcedItems.get(itemId)
              : elementItems.get(element)) ?? [],
        ),
      });
    },
  });

  return {
    setContext(nextEnvelope) {
      // Flush under the previous context before replacing it.
      impressions.reset();
      elementItems.clear();
      forcedItems.clear();
      envelope = nextEnvelope;
    },
    observe(element, item) {
      if (envelope === undefined) {
        return;
      }
      elementItems.set(element, item);
      impressions.observe(element, item.product_id);
    },
    forceImpression(item) {
      if (envelope === undefined) {
        return;
      }
      forcedItems.set(item.product_id, item);
      impressions.record(item.product_id);
      impressions.flush();
    },
    flush: impressions.flush,
    disconnect: impressions.disconnect,
  };
}
