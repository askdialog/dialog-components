import { SearchProductHit } from "../types/search";
import { SearchStatus } from "../types/searchController";
import { ProductHitDisplay } from "./connectHits";

export interface InfiniteHit {
  readonly hit: SearchProductHit;
  /**
   * The hit's display. AI hits carry no `_display`: theirs is built from the raw
   * record (title, image, price range, `url` or `products/<handle>` link).
   */
  readonly display?: ProductHitDisplay;
}

export interface InfiniteHitsRenderState {
  /** The hits of every page fetched so far, in page order. */
  readonly hits: readonly InfiniteHit[];
  /** The engine's total, kept while the next page loads; absent until a page answers. */
  readonly nbHits?: number;
  /** True with no page fetched or once the last one is. */
  readonly isLastPage: boolean;
  /**
   * True with no page fetched or once the first one is. False when the list
   * starts on a later page, e.g. restored from a URL's `page`: `showPrevious`
   * then loads the pages above.
   */
  readonly isFirstPage: boolean;
  /** The hits on the pages below the last fetched one; absent until a page answers. */
  readonly nbHitsAfter?: number;
  /** The hits on the pages above the first fetched one. */
  readonly nbHitsBefore: number;
  /** A next page is loading below the fetched ones. */
  readonly loadingMore: boolean;
  /** A previous page is loading above the fetched ones. */
  readonly loadingPrevious: boolean;
  /** The next page failed; the fetched ones stay. */
  readonly failedMore: boolean;
}

export type Pages = ReadonlyMap<number, readonly InfiniteHit[]>;

export const NO_PAGES: Pages = new Map();

export const ANSWERED = new Set<SearchStatus>([
  SearchStatus.SUCCESS,
  SearchStatus.EMPTY,
]);

export type ReadState = readonly [
  pages: Pages,
  nbHits: number | undefined,
  nbPages: number,
  hitsPerPage: number,
  status: SearchStatus,
  pending: boolean,
  page: number,
];

const pageBounds = (sorted: readonly (readonly [number, unknown])[]) => ({
  first: sorted.at(0)?.[0] ?? 0,
  last: sorted.at(-1)?.[0] ?? -1,
});

const hitCounts = (
  { first, last }: ReturnType<typeof pageBounds>,
  total: number | undefined,
  perPage: number,
) => ({
  nbHitsAfter:
    total === undefined ? undefined : Math.max(0, total - (last + 1) * perPage),
  nbHitsBefore: first * perPage,
});

export const renderPages = ([
  fetched,
  total,
  pageCount,
  perPage,
  status,
  pending,
  page,
]: ReadState): InfiniteHitsRenderState => {
  const sorted = [...fetched.entries()].sort(([a], [b]) => a - b);
  const bounds = pageBounds(sorted);
  // A pending query cancelled the page request; its status stays until the next search starts.
  const more = fetched.size > 0 && !pending;
  const loading = status === SearchStatus.LOADING && more;

  return {
    hits: sorted.flatMap(([, hits]) => hits),
    nbHits: total,
    isLastPage: bounds.last + 1 >= pageCount,
    isFirstPage: bounds.first === 0,
    ...hitCounts(bounds, total, perPage),
    loadingMore: loading && page > bounds.last,
    loadingPrevious: loading && page < bounds.first,
    failedMore: status === SearchStatus.ERROR && more,
  };
};
