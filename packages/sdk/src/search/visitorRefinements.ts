import { SearchFilters, SearchNumericFilter } from "../types/searchFilters";
import { SearchFilter } from "../utils/searchFilterLabels";
import {
  AttributeTypes,
  RangeBounds,
  rangeGroups,
  rangeSides,
  sentRanges,
  sentRefinementList,
} from "../utils/searchFilters";
import { withKey } from "../utils/searchStateFilters";
import { IndexSearchState } from "./types";

/** The change of the products entry that takes a group off. */
export type EntryChange = (
  entry: IndexSearchState,
) => Partial<IndexSearchState>;

/** A group the products request sends from the visitor's search state. */
export interface VisitorGroup {
  readonly group: readonly SearchFilter[];
  readonly without: EntryChange;
}

type FilterKind = keyof SearchFilters;

const withoutFilter =
  (kind: FilterKind, index: number): EntryChange =>
  (entry) => {
    const current: SearchFilters = {
      facetFilters: [],
      numericFilters: [],
      ...entry.filters,
    };
    const filters = {
      ...current,
      [kind]: current[kind].filter((_, i) => i !== index),
    };
    const empty =
      filters.facetFilters.length === 0 && filters.numericFilters.length === 0;

    return { filters: empty ? undefined : filters };
  };

// A floor above its ceiling is sent as two groups: taking one off keeps the other.
const boundsWithout = (
  bounds: RangeBounds,
  filter: SearchNumericFilter,
): RangeBounds | undefined => {
  if ("from" in filter) {
    return undefined;
  }
  const [min, max] = rangeSides(bounds);
  const kept = filter.operator === ">=" ? `:${max}` : `${min}:`;

  return kept === ":" ? undefined : (kept as RangeBounds);
};

const withoutRange =
  (attribute: string, filter: SearchNumericFilter): EntryChange =>
  (entry) => {
    const bounds = entry.range?.[attribute];
    const kept =
      bounds === undefined ? undefined : boundsWithout(bounds, filter);

    return { range: withKey(entry.range, attribute, kept) };
  };

/**
 * The groups the products request sends from the search state, in its order:
 * `filters`' facets, `refinementList`, `filters`' numerics, `range`.
 */
export const visitorGroups = (
  entry: IndexSearchState,
  typeOf: AttributeTypes,
): VisitorGroup[] => [
  ...(entry.filters?.facetFilters ?? []).map((group, index) => ({
    group,
    without: withoutFilter("facetFilters", index),
  })),
  ...sentRefinementList(entry, typeOf).map(([attribute, values]) => ({
    group: values.map((value) => ({ attribute, value })),
    without: (current: IndexSearchState) => ({
      refinementList: withKey(current.refinementList, attribute, undefined),
    }),
  })),
  ...(entry.filters?.numericFilters ?? []).map((group, index) => ({
    group,
    without: withoutFilter("numericFilters", index),
  })),
  ...sentRanges(entry, typeOf).flatMap(([attribute, bounds]) =>
    rangeGroups(attribute, bounds).map((group) => ({
      group,
      without: withoutRange(attribute, group[0]),
    })),
  ),
];
