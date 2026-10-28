import { SearchStatus } from "../types/searchController";
import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
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

export interface PaginationConnector extends Connector<PaginationRenderState> {
  /** Request a zero-based page; ignored while hidden, out of range or with a query pending. */
  refine(page: number): void;
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
  const entry = productsEntry(controller);

  // Trimmed query the shown results answer; a different one in the search state is still pending.
  const queryOf = (snapshot: SearchSnapshot): string =>
    entry.read(snapshot.searchState).query.trim();
  let results = controller.getSnapshot().results;
  // Connected after a search: the results echo the query they answer.
  let answeredQuery = results.products?.query;

  const connector = createConnector(controller, {
    read: (snapshot) => {
      // A request aborts on each query change, so results arrive for the query in the search state.
      if (snapshot.results !== results) {
        results = snapshot.results;
        if (results.status !== SearchStatus.LOADING) {
          answeredQuery = queryOf(snapshot);
        }
      }
      const { status, products } = snapshot.results;

      return [
        status,
        products?.page ?? 0,
        products?.nbPages ?? 0,
        queryOf(snapshot) !== answeredQuery,
      ] as const;
    },
    // Hidden while loading or pending: a page of the shown results would apply to the next query.
    render: ([status, currentPage, nbPages, pending]) => {
      const visible =
        status !== SearchStatus.LOADING && !pending && nbPages > 1;

      return {
        visible,
        currentPage,
        nbPages,
        isFirstPage: currentPage === 0,
        isLastPage: currentPage >= nbPages - 1,
        pages: visible ? paginationItems(currentPage, nbPages) : [],
      };
    },
  });
  const { getRenderState, subscribe, dispose } = connector;

  return {
    getRenderState,
    subscribe,
    dispose,

    refine(page) {
      const { visible, nbPages } = getRenderState();
      if (
        connector.disposed() ||
        !visible ||
        !Number.isInteger(page) ||
        page < 0 ||
        page >= nbPages
      ) {
        return;
      }
      entry.set({ page });
    },
  };
}
