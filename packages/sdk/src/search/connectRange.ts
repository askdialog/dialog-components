import { SearchFacetStats } from "../types/search";
import { RangeBounds, rangeSides } from "../utils/searchFilters";
import { withKey } from "../utils/searchStateFilters";
import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
import { SearchController, SearchState } from "./types";

export interface RangeRenderState {
  readonly attribute: string;
  /** The floor as the visitor typed it, else as in the search state; empty for none. */
  readonly min: string;
  /** The ceiling, the same way. */
  readonly max: string;
  /** Both fields are numbers and the floor is above the ceiling. */
  readonly minAboveMax: boolean;
  /**
   * The lowest and highest value among the results, e.g. as the fields'
   * placeholders: `price` only, with the controller's `facets` option, once
   * the last search's counts answer them; their own range is set aside.
   */
  readonly bounds?: SearchFacetStats;
}

export interface RangeConnector extends Connector<RangeRenderState> {
  /**
   * Set the fields as typed and write their bounds to `range`; an empty field
   * removes its bound. A floor above the ceiling only shows the error.
   */
  refine(min: string, max: string): void;
}

interface TypedFields {
  readonly min: string;
  readonly max: string;
  /** The bounds the search state held once these fields were refined. */
  readonly bounds: RangeBounds | undefined;
  /** The search state they were refined in, set at the next read. */
  searchState?: SearchState;
}

/** A field's number, a comma read as the decimal separator; none when empty or not a number. */
export const parseRangeField = (text: string): number | undefined => {
  const trimmed = text.trim().replace(",", ".");
  const value = Number(trimmed);

  return trimmed === "" || !Number.isFinite(value) ? undefined : value;
};

const fieldsOf = (bounds: RangeBounds | undefined): [string, string] =>
  bounds === undefined ? ["", ""] : rangeSides(bounds);

const isMinAboveMax = (min: string, max: string): boolean => {
  const floor = parseRangeField(min);
  const ceiling = parseRangeField(max);

  return floor !== undefined && ceiling !== undefined && floor > ceiling;
};

/** A numeric attribute's floor and ceiling as two free fields, and the action that applies them. */
export function connectRange(
  controller: SearchController,
  { attribute }: { attribute: string },
): RangeConnector {
  const entry = productsEntry(controller);
  const boundsOf = (searchState = controller.getSnapshot().searchState) =>
    entry.read(searchState).range?.[attribute];
  // What the visitor typed, until the search state's bounds change elsewhere;
  // fields without bounds to compare go at any search state change.
  let typed: TypedFields | undefined;

  const connector = createConnector(controller, {
    read: ({ searchState, results }) => {
      const bounds = boundsOf(searchState);
      if (typed !== undefined) {
        typed.searchState ??= searchState;
        const stale =
          typed.bounds !== bounds ||
          (bounds === undefined && typed.searchState !== searchState);
        if (stale) {
          typed = undefined;
        }
      }

      return [bounds, typed, results.facetsStats?.[attribute]] as const;
    },
    render: ([bounds, fields, stats]) => {
      const [min, max] =
        fields === undefined ? fieldsOf(bounds) : [fields.min, fields.max];

      return {
        attribute,
        min,
        max,
        minAboveMax: isMinAboveMax(min, max),
        ...(stats === undefined ? {} : { bounds: stats }),
      };
    },
  });
  const { getRenderState, subscribe, dispose } = connector;

  const writeBounds = (bounds: RangeBounds | undefined): void => {
    const { range } = entry.read(controller.getSnapshot().searchState);
    entry.set({ range: withKey(range, attribute, bounds) });
  };

  return {
    getRenderState,
    subscribe,
    dispose,

    refine(min, max) {
      if (connector.disposed()) {
        return;
      }
      const current = boundsOf();
      const floor = parseRangeField(min);
      const ceiling = parseRangeField(max);
      let bounds: RangeBounds | undefined;
      if (isMinAboveMax(min, max)) {
        bounds = current;
      } else if (floor !== undefined || ceiling !== undefined) {
        bounds = `${floor ?? ""}:${ceiling ?? ""}`;
      }
      typed = { min, max, bounds };
      if (bounds === current) {
        connector.refresh();
      } else {
        writeBounds(bounds);
      }
    },
  };
}
