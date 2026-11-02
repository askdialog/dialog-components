import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
import { IndexSearchState, SearchController, SearchState } from "./types";

type RangeBounds = NonNullable<IndexSearchState["range"]>[string];

export interface RangeRenderState {
  readonly attribute: string;
  /** The floor as the visitor typed it, else as in the search state; empty for none. */
  readonly min: string;
  /** The ceiling, the same way. */
  readonly max: string;
  /** Both fields are numbers and the floor is above the ceiling. */
  readonly minAboveMax: boolean;
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

const fieldsOf = (bounds: RangeBounds | undefined): [string, string] => {
  const [min = "", max = ""] = bounds?.split(":") ?? [];

  return [min, max];
};

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
    read: ({ searchState }) => {
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

      return [bounds, typed] as const;
    },
    render: ([bounds, fields]) => {
      const [min, max] =
        fields === undefined ? fieldsOf(bounds) : [fields.min, fields.max];

      return { attribute, min, max, minAboveMax: isMinAboveMax(min, max) };
    },
  });
  const { getRenderState, subscribe, dispose } = connector;

  const writeBounds = (bounds: RangeBounds | undefined): void => {
    const { range = {} } = entry.read(controller.getSnapshot().searchState);
    const next = Object.fromEntries([
      ...Object.entries(range).filter(([key]) => key !== attribute),
      ...(bounds === undefined ? [] : [[attribute, bounds] as const]),
    ]);
    entry.set({ range: Object.keys(next).length > 0 ? next : undefined });
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
