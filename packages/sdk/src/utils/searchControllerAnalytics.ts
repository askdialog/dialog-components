import { SearchProductHit, SearchResult } from "../types/search";
import {
  SearchAnalyticsEnvelope,
  SearchResultItem,
} from "../types/searchAnalytics";
import { SearchControllerAnalytics } from "../types/searchController";
import {
  createSearchImpressionTracker,
  SearchImpressionTracker,
} from "./searchImpressions";

/** Internal binding for search impressions and selections. */
export interface ControllerAnalyticsBinding {
  onResponse(result: SearchResult<SearchProductHit>): void;
  observeResult(
    element: Element,
    result: SearchResult<SearchProductHit>,
    index: number,
  ): void;
  select(result: SearchResult<SearchProductHit>, index: number): void;
  dispose(): void;
}

const resultItem = (
  result: SearchResult<SearchProductHit>,
  index: number,
): SearchResultItem => ({
  // `objectID` is the variant id; analytics count products.
  product_id: String(result.hits[index].id),
  // One-based position across all pages.
  position: result.page * result.hitsPerPage + index + 1,
});

export function createControllerAnalytics(
  analytics: SearchControllerAnalytics,
): ControllerAnalyticsBinding {
  let impressions: SearchImpressionTracker | undefined;
  let envelope: SearchAnalyticsEnvelope | undefined;

  // Defer browser-dependent tracking until a response arrives.
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

        search_type: "lexical",
        // Convert the API page to one-based analytics numbering.
        page: result.page + 1,
        total_hits: result.nbHits,
        query_length: [...result.query].length,
      };
      tracker().setContext(envelope);
      if (result.nbHits === 0) {
        // Empty results emit immediately without visibility tracking.
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
      // Count the impression before recording the selection.
      tracker().forceImpression(item);
      analytics.trackSelectSearchResult({ ...envelope, items: [item] });
    },
    dispose() {
      impressions?.disconnect();
    },
  };
}
