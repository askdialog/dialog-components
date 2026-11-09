import { attributeTypes } from "../utils/searchFilters";
import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
import { SearchController } from "./types";
import { visitorGroups } from "./visitorRefinements";

export interface ClearRefinementsRenderState {
  /** The products request sends a value or a bound the visitor picked. */
  readonly canRefine: boolean;
}

export interface ClearRefinementsConnector
  extends Connector<ClearRefinementsRenderState> {
  /** Remove every refinement list and range in one change, keeping the query. */
  refine(): void;
}

/** Whether the visitor has refined the products, and the action that clears every refinement. */
export function connectClearRefinements(
  controller: SearchController,
): ClearRefinementsConnector {
  const entry = productsEntry(controller);
  const connector = createConnector(controller, {
    read: ({ searchState, context }) => {
      const { refinementList, range } = entry.read(searchState);

      return [refinementList, range, context.filterableAttributes] as const;
    },
    render: ([refinementList, range, attributes]) => ({
      canRefine:
        visitorGroups(
          { query: "", refinementList, range },
          attributeTypes(attributes),
        ).length > 0,
    }),
  });
  const { getRenderState, subscribe, dispose } = connector;

  return {
    getRenderState,
    subscribe,
    dispose,

    refine() {
      if (connector.disposed()) {
        return;
      }
      entry.set({ refinementList: undefined, range: undefined });
    },
  };
}
