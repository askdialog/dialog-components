import { SearchQuerySuggestionHit } from "../types/search";
import { highlightedPrefixParts } from "../utils/prefixHighlight";
import { TitlePart } from "../utils/titleHighlight";
import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
import { SearchController } from "./types";

export interface QuerySuggestion {
  readonly hit: SearchQuerySuggestionHit;
  /** The suggested query in runs, its leading part matching the typed text `highlighted`. */
  readonly parts: readonly TitlePart[];
}

export interface QuerySuggestionsRenderState {
  /** In the order the search returned them, most popular first. */
  readonly suggestions: readonly QuerySuggestion[];
}

export interface QuerySuggestionsConnector
  extends Connector<QuerySuggestionsRenderState> {
  /** Set the query and search it at once, without the debounce. */
  applySuggestion(query: string): void;
}

/**
 * The query suggestions searched beside products, ready to render: request them
 * with the `query_suggestions` section. Before typing, those the search returned
 * for the empty query, none highlighted.
 */
export function connectQuerySuggestions(
  controller: SearchController,
): QuerySuggestionsConnector {
  const entry = productsEntry(controller);
  const connector = createConnector(controller, {
    read: ({ results, searchState }) =>
      [
        results.sections?.query_suggestions,
        entry.read(searchState).query.trim(),
      ] as const,
    render: ([result, typed]) => ({
      suggestions: (result?.hits ?? []).map((hit) => ({
        hit,
        parts: highlightedPrefixParts(hit.query, typed),
      })),
    }),
  });
  const { getRenderState, subscribe, dispose } = connector;

  return {
    getRenderState,
    subscribe,
    dispose,
    applySuggestion: (query) => {
      if (connector.disposed()) {
        return;
      }
      entry.set({ query });
      controller.search();
    },
  };
}
