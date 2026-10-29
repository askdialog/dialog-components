import { SearchProductHit, SearchResult } from "../types/search";
import { createControllerAnalytics } from "../utils/searchControllerAnalytics";
import { hitHref } from "../utils/searchDisplay";
import { SearchController, SearchControllerOptions } from "./types";

type HitTrackingOptions = Pick<
  SearchControllerOptions,
  "analytics" | "navigate"
> & {
  storefrontRoot: string;
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
  /** Stop tracking; `observeHit` and `selectHit` then do nothing. */
  dispose(): void;
}

export const createHitTracking = ({
  analytics,
  navigate,
  storefrontRoot,
  products,
}: HitTrackingOptions): HitTracking => {
  const binding = createControllerAnalytics(analytics);
  let disposed = false;

  const productUrl = (hit: SearchProductHit): string | undefined =>
    hitHref(hit, storefrontRoot);

  return {
    open: binding.open,
    onProducts: binding.onResponse,
    close: binding.close,
    productUrl,

    dispose() {
      disposed = true;
      binding.dispose();
    },

    observeHit(element, index) {
      const result = products();
      if (!disposed && result !== undefined) {
        binding.observeResult(element, result, index);
      }
    },

    selectHit(index, options) {
      const result = products();
      if (disposed || result === undefined) {
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
