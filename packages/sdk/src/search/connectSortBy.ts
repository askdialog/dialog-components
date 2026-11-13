import { SEARCH_SORTS, SearchSort } from "../types/search";
import { getSearchTexts } from "../utils/searchTexts";
import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
import { SearchController } from "./types";

export interface SortByItem {
  readonly value: SearchSort;
  /** In the shopper's language. */
  readonly label: string;
  readonly isRefined: boolean;
}

export interface SortByRenderState {
  /** Relevance, then price ascending and descending. */
  readonly items: readonly SortByItem[];
  readonly currentRefinement: SearchSort;
  /** The control's label in the shopper's language, e.g. "Sort by". */
  readonly label: string;
}

export interface SortByConnector extends Connector<SortByRenderState> {
  /** Order the products; back to page 1, the query and filters kept. An unknown value does nothing. */
  refine(value: SearchSort): void;
}

/** The products' order the shopper picks, as InstantSearch's `connectSortBy`; lexical mode only. */
export function connectSortBy(controller: SearchController): SortByConnector {
  const entry = productsEntry(controller);
  const connector = createConnector(controller, {
    read: ({ searchState, context }) =>
      [
        entry.read(searchState).sort ?? "relevance",
        context.language,
        context.country,
      ] as const,
    render: ([current, language, country]) => {
      const texts = getSearchTexts(`${language}-${country}`);

      return {
        items: SEARCH_SORTS.map((value) => ({
          value,
          label: texts.sortOptions[value],
          isRefined: value === current,
        })),
        currentRefinement: current,
        label: texts.sortLabel,
      };
    },
  });
  const { getRenderState, subscribe, dispose } = connector;

  return {
    getRenderState,
    subscribe,
    dispose,

    refine(value) {
      if (
        connector.disposed() ||
        !SEARCH_SORTS.includes(value) ||
        value === getRenderState().currentRefinement
      ) {
        return;
      }
      entry.set({ sort: value });
    },
  };
}
