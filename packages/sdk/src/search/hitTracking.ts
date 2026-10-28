import { SearchProductHit, SearchResult } from "../types/search";
import { createControllerAnalytics } from "../utils/searchControllerAnalytics";
import { SearchController, SearchControllerOptions } from "./types";

type HitTrackingOptions = Pick<
  SearchControllerOptions,
  "analytics" | "navigate" | "buildProductUrl"
> & {
  /** The products result the hits are rendered from. */
  products: () => SearchResult<SearchProductHit> | undefined;
};

/** Impressions, selections and the opened signal of the controller's hits. */
export interface HitTracking
  extends Pick<SearchController, "observeHit" | "selectHit" | "productUrl"> {
  open(): void;
  /** Start a new impression context for each new products result. */
  onProducts(products: SearchResult<SearchProductHit>): void;
  /** Flush qualified impressions; the next result starts a new context. */
  close(): void;
  dispose(): void;
}

export const createHitTracking = ({
  analytics,
  navigate,
  buildProductUrl,
  products,
}: HitTrackingOptions): HitTracking => {
  const binding = createControllerAnalytics(analytics);

  const productUrl = (hit: SearchProductHit): string | undefined =>
    hit.url !== undefined && hit.url !== "" ? hit.url : buildProductUrl?.(hit);

  return {
    open: binding.open,
    onProducts: binding.onResponse,
    close: binding.close,
    dispose: binding.dispose,
    productUrl,

    observeHit(element, index) {
      const result = products();
      if (result !== undefined) {
        binding.observeResult(element, result, index);
      }
    },

    selectHit(index, options) {
      const result = products();
      if (result === undefined) {
        return false;
      }
      binding.select(result, index);
      const hit = result.hits[index];
      const url = productUrl(hit);
      if (
        (options?.navigate ?? true) &&
        navigate !== undefined &&
        url !== undefined
      ) {
        navigate(url, hit);

        return true;
      }

      return false;
    },
  };
};
