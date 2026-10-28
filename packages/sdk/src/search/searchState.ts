import { IndexSearchState, SearchState, SearchStateUpdater } from "./types";

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
  const result: SearchState = {};
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
