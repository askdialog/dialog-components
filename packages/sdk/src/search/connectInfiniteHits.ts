import { SearchProductHit } from "../types/search";
import { SearchStatus } from "../types/searchController";
import { aiHitDisplay } from "./aiHitDisplay";
import { productHitDisplay } from "./connectHits";
import { Connector, createConnector } from "./connector";
import {
  ANSWERED,
  InfiniteHit,
  InfiniteHitsRenderState,
  NO_PAGES,
  ReadState,
  renderPages,
} from "./infiniteHitsState";
import { productsEntry } from "./searchState";
import { SearchController, SearchResults, SearchSnapshot } from "./types";

export type { InfiniteHit, InfiniteHitsRenderState } from "./infiniteHitsState";

export interface InfiniteHitsConnector
  extends Connector<InfiniteHitsRenderState> {
  /** Request the next page; ignored while loading, on the last page, after a failure or with a query pending. */
  showMore(): void;
  /** Request the page above the first fetched one; ignored as `showMore` is, and on the first page. */
  showPrevious(): void;
  /** Replay the page that failed. */
  retryMore(): void;
}

/** Every page fetched so far, stacked, and the actions that fetch the pages around them. */
export function connectInfiniteHits(
  controller: SearchController,
): InfiniteHitsConnector {
  const entry = productsEntry(controller);
  const raw = controller.getSnapshot().context.mode === "ai";
  const toHit = (hit: SearchProductHit): InfiniteHit => ({
    hit,
    display: raw
      ? aiHitDisplay(controller, hit)
      : productHitDisplay(controller, hit),
  });

  const queryOf = (snapshot: SearchSnapshot): string =>
    entry.read(snapshot.searchState).query.trim();
  let results: SearchResults | undefined;
  let pages = NO_PAGES;
  let nbHits: number | undefined;
  let nbPages = 0;
  let hitsPerPage = 0;
  // The page above the fetched ones that showPrevious asked for, and its query.
  let previous: { readonly page: number; readonly query: string } | undefined;
  // The query of the fetched pages; a different one in the search state is still pending.
  let answeredQuery: string | undefined;

  const reset = (): void => {
    pages = NO_PAGES;
    nbHits = undefined;
    nbPages = 0;
    previous = undefined;
  };

  const stack = (
    products: NonNullable<SearchResults["products"]>,
    fillingAbove: boolean,
  ): void => {
    const keep = products.page !== 0 || fillingAbove;
    pages = new Map(keep ? pages : NO_PAGES).set(
      products.page,
      products.hits.map(toHit),
    );
    ({ nbHits, nbPages, hitsPerPage, query: answeredQuery } = products);
    if (fillingAbove) {
      previous = undefined;
    }
  };

  const isFillingAbove = (snapshot: SearchSnapshot, requested: number) =>
    previous?.page === requested && previous.query === queryOf(snapshot);

  const accumulate = (snapshot: SearchSnapshot): void => {
    if (snapshot.results === results) {
      return;
    }
    results = snapshot.results;
    const { status, products } = results;
    const requested = entry.read(snapshot.searchState).page;
    const fillingAbove = isFillingAbove(snapshot, requested);
    // A search at page 0 starts over, unless it fills the list from above:
    // the previous pages go from its first frame.
    const startingOver =
      status === SearchStatus.LOADING && requested === 0 && !fillingAbove;
    if (status === SearchStatus.IDLE || startingOver) {
      reset();
    } else if (ANSWERED.has(status) && products !== undefined) {
      stack(products, fillingAbove);
    }
  };

  const connector = createConnector(controller, {
    read: (snapshot): ReadState => {
      accumulate(snapshot);

      return [
        pages,
        nbHits,
        nbPages,
        hitsPerPage,
        snapshot.results.status,
        queryOf(snapshot) !== answeredQuery,
        entry.read(snapshot.searchState).page,
      ];
    },
    render: renderPages,
  });
  const { getRenderState, subscribe, dispose, disposed } = connector;

  // Fetch a page next to the fetched ones: not while loading, after a failure or with a query pending.
  const canFetch = (atEdge: boolean): boolean =>
    !disposed() &&
    !atEdge &&
    ANSWERED.has(controller.getSnapshot().results.status) &&
    queryOf(controller.getSnapshot()) === answeredQuery;

  return {
    getRenderState,
    subscribe,
    dispose,

    showMore() {
      if (canFetch(getRenderState().isLastPage)) {
        entry.set({ page: Math.max(...pages.keys()) + 1 });
      }
    },

    showPrevious() {
      if (canFetch(getRenderState().isFirstPage)) {
        const page = Math.min(...pages.keys()) - 1;
        previous = { page, query: queryOf(controller.getSnapshot()) };
        entry.set({ page });
      }
    },

    retryMore() {
      if (!disposed() && getRenderState().failedMore) {
        controller.retry();
      }
    },
  };
}
