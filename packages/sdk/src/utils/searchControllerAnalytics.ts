import { SearchResponse } from "../types/search";
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
  onResponse(response: SearchResponse): void;
  observeResult(
    element: Element,
    response: SearchResponse,
    index: number,
  ): void;
  select(response: SearchResponse, index: number): void;
  dispose(): void;
}

const resultItem = (
  response: SearchResponse,
  index: number,
): SearchResultItem => ({
  product_id: response.hits[index].product.id,
  // 1-based and absolute across pages (page 2, first item, 20/page → 21).
  position: response.page * response.hitsPerPage + index + 1,
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
    onResponse(response) {
      envelope = {
        // Straight off the response: the controller resends the previous
        // queryId while the query text is unchanged, so the id is stable
        // across pagination and rotates with the query.
        query_id: response.queryId,
        surface: analytics.surface,
        // Analytics pages are 1-based; the wire response is 0-based.
        page: response.page + 1,
        total_hits: response.nbHits,
        query_length: [...response.query].length,
      };
      tracker().setContext(envelope);
      if (response.nbHits === 0) {
        // A rendered no-results state is the view event with zero items; it
        // shows above the fold, no viewport gating needed.
        analytics.trackViewSearchResults({ ...envelope, items: [] });
      }
    },
    observeResult(element, response, index) {
      tracker().observe(element, resultItem(response, index));
    },
    select(response, index) {
      if (envelope === undefined) {
        return;
      }
      const item = resultItem(response, index);
      // The click forces the item's impression so CTR by position stays ≤100%.
      tracker().forceImpression(item);
      analytics.trackSelectSearchResult({ ...envelope, items: [item] });
    },
    dispose() {
      impressions?.disconnect();
    },
  };
}
