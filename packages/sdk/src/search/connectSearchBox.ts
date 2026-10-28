import { SearchStatus } from "../types/searchController";
import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
import { SearchController } from "./types";

export interface SearchBoxRenderState {
  /** The input's value as typed, its pending input included. */
  readonly query: string;
  readonly status: SearchStatus;
}

export interface SearchBoxConnector extends Connector<SearchBoxRenderState> {
  /** Set the query; its search is sent after the controller's debounce. */
  refine(query: string): void;
  /** Search now, with `query` when given, else with the current one. */
  submit(query?: string): void;
  /** Empty the query and search now. */
  clear(): void;
  /** Call on the input's focus: emits the opened signal, runs the empty-query search. */
  open(): void;
  /** Cancel requests and return to idle with no query. */
  close(): void;
}

/** The search input's value and status, and the actions its events call. */
export function connectSearchBox(
  controller: SearchController,
): SearchBoxConnector {
  const entry = productsEntry(controller);
  const connector = createConnector(controller, {
    read: (snapshot) =>
      [
        entry.read(snapshot.searchState).query,
        snapshot.results.status,
      ] as const,
    render: ([query, status]) => ({ query, status }),
  });
  const { getRenderState, subscribe, dispose } = connector;

  const setQuery = (query: string): void => {
    entry.set({ query });
  };

  const run = (action: () => void): void => {
    if (!connector.disposed()) {
      action();
    }
  };

  return {
    getRenderState,
    subscribe,
    dispose,
    refine: (query) => {
      run(() => setQuery(query));
    },
    submit: (query) => {
      run(() => {
        if (query !== undefined) {
          setQuery(query);
        }
        controller.search();
      });
    },
    clear: () => {
      run(() => {
        setQuery("");
        controller.search();
      });
    },
    open: () => {
      run(() => controller.open());
    },
    close: () => {
      run(() => controller.close());
    },
  };
}
