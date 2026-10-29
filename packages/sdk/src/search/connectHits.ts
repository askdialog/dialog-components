import {
  SearchDisplayLine,
  SearchProductHit,
  SearchResult,
} from "../types/search";
import { hitImage } from "../utils/searchDisplay";
import { splitTitleMatch, TitleParts } from "../utils/titleHighlight";
import { Connector, createConnector } from "./connector";
import { SearchContext, SearchController } from "./types";

/** What a surface renders for a product hit, all from the server's `_display`. */
export interface ProductHitDisplay {
  readonly title: string;
  /** The title split around the answered query, for highlighting. */
  readonly titleParts: TitleParts;
  /** HTTP(S) link; absent when unsafe or off the storefront. */
  readonly href?: string;
  readonly image?: string;
  /** Formatted in the shopper's market currency. */
  readonly price: string;
  /** Struck next to the price when higher than it; else empty. */
  readonly compareAtPrice: string;
  /** The first line the merchant shows above the title. */
  readonly lineAboveTitle?: string;
  /** The first line the merchant shows below the title. */
  readonly lineBelowTitle?: string;
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

const lineText = (
  lines: readonly SearchDisplayLine[],
  position: SearchDisplayLine["position"],
): string | undefined => lines.find((line) => line.position === position)?.text;

/** The display `connectHits` gives `hit`: its title highlighted for `query`. */
export const productHitDisplay = (
  controller: SearchController,
  hit: SearchProductHit,
  query: string,
): ProductHitDisplay => {
  const { title, price, compare_at_price, lines } = hit._display;

  return {
    title,
    titleParts: splitTitleMatch(title, query),
    href: controller.productUrl(hit),
    image: hitImage(hit),
    price,
    compareAtPrice: compare_at_price ?? "",
    lineAboveTitle: lineText(lines, "above_title"),
    lineBelowTitle: lineText(lines, "below_title"),
  };
};

const renderHits = (
  controller: SearchController,
  products: SearchResult<SearchProductHit> | undefined,
  { businessRanking, texts }: SearchContext,
): HitsRenderState => {
  const query = products?.query ?? "";

  return {
    hits: (products?.hits ?? []).map((hit) => ({
      hit,
      display: productHitDisplay(controller, hit, query),
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
