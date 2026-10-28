import { SearchProductHit, SearchResult } from "../types/search";
import { hitImage, hitTitle, safeHref } from "../utils/searchDisplay";
import {
  formatSearchCompareAtPrice,
  formatSearchPrice,
} from "../utils/searchPrice";
import { splitTitleMatch, TitleParts } from "../utils/titleHighlight";
import { Connector, createConnector } from "./connector";
import { SearchContext, SearchController } from "./types";

/** What a surface renders for a product hit. */
export interface ProductHitDisplay {
  readonly title: string;
  /** The title split around the answered query, for highlighting. */
  readonly titleParts: TitleParts;
  /** HTTP(S) link; absent when the hit has none and none can be built. */
  readonly href?: string;
  readonly image?: string;
  /** Lowest variant price in the market currency; empty when unknown. */
  readonly price: string;
  /** Struck next to the price when higher than it; else empty. */
  readonly compareAtPrice: string;
}

export interface ProductHit {
  readonly hit: SearchProductHit;
  readonly display: ProductHitDisplay;
}

export interface HitsRenderState {
  /** Hits of the shown products result; kept while the next one loads. */
  readonly hits: readonly ProductHit[];
  /** The query the shown hits answer. */
  readonly query: string;
  /** The business ranking's title on the empty query, else the products label. */
  readonly title: string;
}

export interface HitsConnector extends Connector<HitsRenderState> {
  /** Track impressions for the element rendering `hits[index]`. */
  observe(element: Element, index: number): void;
  /**
   * Record the selection of `hits[index]` and navigate unless `{ navigate: false }`.
   * Returns true when navigation ran; call `preventDefault()` then.
   */
  select(index: number, options?: { navigate?: boolean }): boolean;
}

const marketLocale = ({ language, country }: SearchContext): string =>
  `${language}-${country.toUpperCase()}`;

/**
 * The display `connectHits` gives `hit`: its title highlighted for `query`,
 * its prices in `locale`, the shopper's market when omitted.
 */
export const productHitDisplay = (
  controller: SearchController,
  hit: SearchProductHit,
  query: string,
  locale = marketLocale(controller.getSnapshot().context),
): ProductHitDisplay => {
  const title = hitTitle(hit);

  return {
    title,
    titleParts: splitTitleMatch(title, query),
    href: safeHref(controller.productUrl(hit)),
    image: hitImage(hit),
    price: formatSearchPrice(hit, locale),
    compareAtPrice: formatSearchCompareAtPrice(hit, locale),
  };
};

const renderHits = (
  controller: SearchController,
  products: SearchResult<SearchProductHit> | undefined,
  context: SearchContext,
): HitsRenderState => {
  const { businessRanking, texts } = context;
  const locale = marketLocale(context);
  const query = products?.query ?? "";

  return {
    hits: (products?.hits ?? []).map((hit) => ({
      hit,
      display: productHitDisplay(controller, hit, query, locale),
    })),
    query,
    title:
      query === "" ? texts.rankingLabel(businessRanking) : texts.productsLabel,
  };
};

/** Product hits ready to render, their section title, and their tracking. */
export function connectHits(controller: SearchController): HitsConnector {
  const connector = createConnector(controller, {
    read: ({ results, context }) => [results.products, context] as const,
    render: ([products, context]) => renderHits(controller, products, context),
  });
  const { getRenderState, subscribe, dispose, disposed } = connector;

  return {
    getRenderState,
    subscribe,
    dispose,

    observe(element, index) {
      if (!disposed()) {
        controller.observeHit(element, index);
      }
    },

    select: (index, options) =>
      !disposed() && controller.selectHit(index, options),
  };
}
