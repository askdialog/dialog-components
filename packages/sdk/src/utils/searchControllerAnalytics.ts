import { SearchResult } from "../types/search";
import {
  SearchAnalyticsEnvelope,
  SearchResultItem,
} from "../types/searchAnalytics";
import { SearchControllerAnalytics } from "../types/searchController";
import {
  createSearchImpressionTracker,
  SearchImpressionTracker,
} from "./searchImpressions";

/**
 * Internal DEC-2448 wiring of the search controller: envelope computation,
 * viewport impressions and selection attribution. Not part of the public API.
 */
export interface ControllerAnalyticsBinding {
  onResponse(result: SearchResult): void;
  observeResult(element: Element, result: SearchResult, index: number): void;
  select(result: SearchResult, index: number): void;
  dispose(): void;
}

const resultItem = (result: SearchResult, index: number): SearchResultItem => ({
  product_id: result.hits[index].objectID,
  // 1-based and absolute across pages (page 2, first item, 20/page → 21).
  position: result.page * result.hitsPerPage + index + 1,
});

export function createControllerAnalytics(
  analytics: SearchControllerAnalytics,
): ControllerAnalyticsBinding {
  let impressions: SearchImpressionTracker | undefined;
  let envelope: SearchAnalyticsEnvelope | undefined;

  // Lazy: the tracker needs window/IntersectionObserver, so a controller
  // constructed in a non-browser context stays inert until a response lands.
  const tracker = (): SearchImpressionTracker => {
    impressions ??= createSearchImpressionTracker({
      emit: analytics.trackViewSearchResults,
    });

    return impressions;
  };

  return {
    onResponse(result) {
      envelope = {
        query_id: result.queryID,
        index: result.index,
        surface: analytics.surface,
        // The storefront search API is lexical-only today.
        search_type: "lexical",
        // Analytics pages are 1-based; the wire response is 0-based.
        page: result.page + 1,
        total_hits: result.nbHits,
        query_length: [...result.query].length,
      };
      tracker().setContext(envelope);
      if (result.nbHits === 0) {
        // A rendered no-results state is the view event with zero items; it
        // shows above the fold, no viewport gating needed.
        analytics.trackViewSearchResults({ ...envelope, items: [] });
      }
    },
    observeResult(element, result, index) {
      tracker().observe(element, resultItem(result, index));
    },
    select(result, index) {
      if (envelope === undefined) {
        return;
      }
      const item = resultItem(result, index);
      // The click forces the item's impression so CTR by position stays ≤100%.
      tracker().forceImpression(item);
      analytics.trackSelectSearchResult({ ...envelope, items: [item] });
    },
    dispose() {
      impressions?.disconnect();
    },
  };
}
