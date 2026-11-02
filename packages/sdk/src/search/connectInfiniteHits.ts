import { SearchProductHit } from "../types/search";
import { SearchStatus } from "../types/searchController";
import { ProductHitDisplay, productHitDisplay } from "./connectHits";
import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
import { SearchController, SearchResults, SearchSnapshot } from "./types";

export interface InfiniteHit {
  readonly hit: SearchProductHit;
  /** Absent on the AI mode, whose hits carry no `_display`: render from `hit`. */
  readonly display?: ProductHitDisplay;
}

export interface InfiniteHitsRenderState {
  /** The hits of every page fetched so far, in page order. */
  readonly hits: readonly InfiniteHit[];
  /** The engine's total, kept while the next page loads; absent until a page answers. */
  readonly nbHits?: number;
  /** True with no page fetched or once the last one is. */
  readonly isLastPage: boolean;
  /** A next page is loading below the fetched ones. */
  readonly loadingMore: boolean;
  /** The next page failed; the fetched ones stay. */
  readonly failedMore: boolean;
}

export interface InfiniteHitsConnector
  extends Connector<InfiniteHitsRenderState> {
  /** Request the next page; ignored while loading, on the last page, after a failure or with a query pending. */
  showMore(): void;
  /** Replay the page that failed. */
  retryMore(): void;
}

type Pages = ReadonlyMap<number, readonly InfiniteHit[]>;

const NO_PAGES: Pages = new Map();

const ANSWERED = new Set<SearchStatus>([
  SearchStatus.SUCCESS,
  SearchStatus.EMPTY,
]);

/** Every page fetched so far, stacked, and the actions that fetch the next one. */
export function connectInfiniteHits(
  controller: SearchController,
): InfiniteHitsConnector {
  const entry = productsEntry(controller);
  const raw = controller.getSnapshot().context.mode === "ai";
  const toHit = (hit: SearchProductHit): InfiniteHit =>
    raw ? { hit } : { hit, display: productHitDisplay(controller, hit) };

  const queryOf = (snapshot: SearchSnapshot): string =>
    entry.read(snapshot.searchState).query.trim();
  let results: SearchResults | undefined;
  let pages = NO_PAGES;
  let nbHits: number | undefined;
  let nbPages = 0;
  // The query of the fetched pages; a different one in the search state is still pending.
  let answeredQuery: string | undefined;

  const accumulate = (snapshot: SearchSnapshot): void => {
    if (snapshot.results === results) {
      return;
    }
    results = snapshot.results;
    const { status, products } = results;
    // A search at page 0 starts over: the previous pages go from its first frame.
    const startingOver =
      status === SearchStatus.LOADING &&
      entry.read(snapshot.searchState).page === 0;
    if (status === SearchStatus.IDLE || startingOver) {
      pages = NO_PAGES;
      nbHits = undefined;
      nbPages = 0;
    } else if (ANSWERED.has(status) && products !== undefined) {
      pages = new Map(products.page === 0 ? NO_PAGES : pages).set(
        products.page,
        products.hits.map(toHit),
      );
      nbHits = products.nbHits;
      nbPages = products.nbPages;
      answeredQuery = queryOf(snapshot);
    }
  };

  const connector = createConnector(controller, {
    read: (snapshot) => {
      accumulate(snapshot);

      return [
        pages,
        nbHits,
        nbPages,
        snapshot.results.status,
        queryOf(snapshot) !== answeredQuery,
      ] as const;
    },
    render: ([fetched, total, pageCount, status, pending]) => {
      const sorted = [...fetched.entries()].sort(([a], [b]) => a - b);
      const lastPage = sorted.at(-1)?.[0] ?? -1;
      // A pending query cancelled the page request; its status stays until the next search starts.
      const more = fetched.size > 0 && !pending;

      return {
        hits: sorted.flatMap(([, hits]) => hits),
        nbHits: total,
        isLastPage: lastPage + 1 >= pageCount,
        loadingMore: status === SearchStatus.LOADING && more,
        failedMore: status === SearchStatus.ERROR && more,
      };
    },
  });
  const { getRenderState, subscribe, dispose, disposed } = connector;

  return {
    getRenderState,
    subscribe,
    dispose,

    showMore() {
      const { status } = controller.getSnapshot().results;
      if (
        disposed() ||
        !ANSWERED.has(status) ||
        getRenderState().isLastPage ||
        queryOf(controller.getSnapshot()) !== answeredQuery
      ) {
        return;
      }
      entry.set({ page: Math.max(...pages.keys()) + 1 });
    },

    retryMore() {
      if (!disposed() && getRenderState().failedMore) {
        controller.retry();
      }
    },
  };
}
