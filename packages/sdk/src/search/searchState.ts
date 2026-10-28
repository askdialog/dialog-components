import { searchIndexName } from "../services/search";
import {
  IndexSearchState,
  SearchController,
  SearchState,
  SearchStateUpdater,
} from "./types";

/** How the products entry changed, which decides when its request is sent. */
export type SearchStateChange = "none" | "query" | "other";

const entryOf = (
  searchState: SearchState,
  indexName: string,
): IndexSearchState | undefined =>
  searchState[indexName] as IndexSearchState | undefined;

const withoutPage = (entry: IndexSearchState | undefined): string =>
  JSON.stringify({ ...entry, page: undefined });

/** An index entry, with an empty query and page 0 when absent. */
export const readIndexState = (
  searchState: SearchState,
  indexName: string,
): Required<IndexSearchState> => {
  const entry = entryOf(searchState, indexName);

  return { query: entry?.query ?? "", page: entry?.page ?? 0 };
};

/** Apply an update; each entry changed elsewhere than its page goes back to page 0. */
export const applySearchState = (
  previous: SearchState,
  updater: SearchStateUpdater,
): SearchState => {
  const next = typeof updater === "function" ? updater(previous) : updater;
  const result: Record<string, IndexSearchState> = {};
  for (const [indexName, entry] of Object.entries(next)) {
    const changed =
      withoutPage(entryOf(previous, indexName)) !== withoutPage(entry);
    result[indexName] = changed ? { ...entry, page: 0 } : entry;
  }

  return result;
};

/** A query change is debounced; any other change is sent at once. */
export const searchStateChange = (
  previous: SearchState,
  next: SearchState,
  indexName: string,
): SearchStateChange => {
  const before = readIndexState(previous, indexName);
  const after = readIndexState(next, indexName);
  if (before.query !== after.query) {
    return "query";
  }
  const unchanged =
    before.page === after.page &&
    withoutPage(entryOf(previous, indexName)) ===
      withoutPage(entryOf(next, indexName));

  return unchanged ? "none" : "other";
};

/** The products entry of a controller's search state. */
export interface ProductsEntry {
  /** The entry, with an empty query and page 0 when absent. */
  read(searchState: SearchState): Required<IndexSearchState>;
  /** Change the entry's query or page; any change but the page resets it to 0. */
  set(change: Partial<IndexSearchState>): void;
}

/** Read and change the products entry the controller searches. */
export const productsEntry = (controller: SearchController): ProductsEntry => {
  const { language, country } = controller.getSnapshot().context;
  const indexName = searchIndexName("products", language, country);

  return {
    read: (searchState) => readIndexState(searchState, indexName),
    set(change) {
      controller.setSearchState((searchState) => ({
        ...searchState,
        [indexName]: { ...readIndexState(searchState, indexName), ...change },
      }));
    },
  };
};
