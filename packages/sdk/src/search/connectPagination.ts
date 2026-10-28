import { searchIndexName } from "../services/search";
import { SearchStatus } from "../types/searchController";
import { readIndexState } from "./searchState";
import { SearchController, SearchSnapshot } from "./types";

/** Pages shown on each side of the current one. */
const PADDING = 2;

/** One entry of the numbered pages: a zero-based page, or a gap between two. */
export type PaginationItem =
  | { readonly type: "page"; readonly page: number }
  | { readonly type: "ellipsis" };

export interface PaginationRenderState {
  /** False while loading, with no result or with a single page. */
  readonly visible: boolean;
  /** Zero-based page of the shown results. */
  readonly currentPage: number;
  readonly nbPages: number;
  readonly isFirstPage: boolean;
  readonly isLastPage: boolean;
  /** First and last always, the current one ±2, an ellipsis for each gap. */
  readonly pages: readonly PaginationItem[];
}

export interface PaginationConnector {
  /** The same object until the next change. */
  getRenderState(): PaginationRenderState;
  /** Request a zero-based page; ignored while hidden, out of range or with a query pending. */
  refine(page: number): void;
  subscribe(listener: (renderState: PaginationRenderState) => void): () => void;
  /** Stop following the controller and remove subscribers. */
  dispose(): void;
}

/** Numbered pages around the current one, as the theme extension shows them. */
export const paginationItems = (
  currentPage: number,
  nbPages: number,
): PaginationItem[] => {
  const pages = new Set([0, nbPages - 1]);
  for (
    let page = currentPage - PADDING;
    page <= currentPage + PADDING;
    page++
  ) {
    if (page >= 0 && page < nbPages) {
      pages.add(page);
    }
  }
  const items: PaginationItem[] = [];
  let previous: number | undefined;
  for (const page of [...pages].sort((a, b) => a - b)) {
    if (previous !== undefined && page - previous > 1) {
      items.push({ type: "ellipsis" });
    }
    items.push({ type: "page", page });
    previous = page;
  }

  return items;
};

/** Pages of the products results, and the action that requests one. */
export function connectPagination(
  controller: SearchController,
): PaginationConnector {
  const { language, country } = controller.getSnapshot().context;
  const indexName = searchIndexName("products", language, country);
  const listeners = new Set<(renderState: PaginationRenderState) => void>();

  // Trimmed query the shown results answer; a different one in the search state is still pending.
  const queryOf = (snapshot: SearchSnapshot): string =>
    readIndexState(snapshot.searchState, indexName).query.trim();
  let answeredQuery: string | undefined;
  const answered = (snapshot: SearchSnapshot): void => {
    if (snapshot.results.status !== SearchStatus.LOADING) {
      answeredQuery = queryOf(snapshot);
    }
  };
  const pending = (snapshot: SearchSnapshot): boolean =>
    queryOf(snapshot) !== answeredQuery;

  // Hidden while loading or pending: a page of the shown results would apply to the next query.
  const read = (snapshot: SearchSnapshot): PaginationRenderState => {
    const { status, products } = snapshot.results;
    const currentPage = products?.page ?? 0;
    const nbPages = products?.nbPages ?? 0;
    const visible =
      status !== SearchStatus.LOADING && !pending(snapshot) && nbPages > 1;

    return {
      visible,
      currentPage,
      nbPages,
      isFirstPage: currentPage === 0,
      isLastPage: currentPage >= nbPages - 1,
      pages: visible ? paginationItems(currentPage, nbPages) : [],
    };
  };

  let snapshot = controller.getSnapshot();
  // Connected after a search: the results echo the query they answer.
  answeredQuery = snapshot.results.products?.query;
  let renderState = read(snapshot);

  // A request aborts on each query change, so results arrive for the query in the search state.
  const unsubscribe = controller.subscribe((next) => {
    if (next.results !== snapshot.results) {
      answered(next);
    }
    snapshot = next;
    renderState = read(next);
    for (const listener of listeners) {
      listener(renderState);
    }
  });

  return {
    getRenderState: () => renderState,

    refine(page) {
      const { visible, nbPages } = renderState;
      if (!visible || !Number.isInteger(page) || page < 0 || page >= nbPages) {
        return;
      }
      controller.setSearchState((searchState) => ({
        ...searchState,
        [indexName]: { ...readIndexState(searchState, indexName), page },
      }));
    },

    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    dispose() {
      unsubscribe();
      listeners.clear();
    },
  };
}
