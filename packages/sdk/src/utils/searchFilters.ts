import { FilterableAttribute, IndexSearchState } from "../search/types";
import { SearchQuery } from "../types/search";
import { SearchFacetFilter, SearchNumericFilter } from "../types/searchFilters";

/** The products request's own part: its query, page and filters. */
export type ProductsQuery = Pick<
  SearchQuery,
  "query" | "facetFilters" | "numericFilters"
> & { page: number };

type RangeBounds = NonNullable<IndexSearchState["range"]>[string];

const FACET_TYPES: readonly FilterableAttribute["type"][] = [
  "keyword",
  "boolean",
];

const bound = (text: string | undefined): number | undefined =>
  text === undefined || text === "" || !Number.isFinite(Number(text))
    ? undefined
    : Number(text);

// A floor above the ceiling matches nothing, as two groups the route accepts.
const rangeGroups = (
  attribute: string,
  bounds: RangeBounds,
): SearchNumericFilter[][] => {
  const [min, max] = bounds.split(":").map(bound);
  if (min !== undefined && max !== undefined && min <= max) {
    return [[{ attribute, from: min, to: max }]];
  }
  const groups: SearchNumericFilter[][] = [];
  if (min !== undefined) {
    groups.push([{ attribute, operator: ">=", value: min }]);
  }
  if (max !== undefined) {
    groups.push([{ attribute, operator: "<=", value: max }]);
  }

  return groups;
};

type AttributeTypes = ReadonlyMap<string, FilterableAttribute["type"]>;

const facetFiltersOf = (
  entry: IndexSearchState,
  typeOf: AttributeTypes,
): SearchFacetFilter[][] => [
  ...(entry.filters?.facetFilters ?? []),
  ...Object.entries(entry.refinementList ?? {})
    .filter(
      ([attribute, values]) =>
        FACET_TYPES.some((type) => typeOf.get(attribute) === type) &&
        values.length > 0,
    )
    .map(([attribute, values]) =>
      values.map((value) => ({ attribute, value })),
    ),
];

const numericFiltersOf = (
  entry: IndexSearchState,
  typeOf: AttributeTypes,
): SearchNumericFilter[][] => [
  ...(entry.filters?.numericFilters ?? []),
  ...Object.entries(entry.range ?? {})
    .filter(([attribute]) => typeOf.get(attribute) === "number")
    .flatMap(([attribute, bounds]) => rangeGroups(attribute, bounds)),
];

/**
 * The products entry as its request: `filters` as they are, then a group per
 * refined attribute the search config declares with the right type.
 */
export const productsQuery = (
  entry: IndexSearchState & { page: number },
  filterableAttributes: readonly FilterableAttribute[],
): ProductsQuery => {
  const typeOf = new Map(filterableAttributes.map((a) => [a.key, a.type]));
  const facetFilters = facetFiltersOf(entry, typeOf);
  const numericFilters = numericFiltersOf(entry, typeOf);

  return {
    query: entry.query,
    page: entry.page,
    ...(facetFilters.length > 0 ? { facetFilters } : {}),
    ...(numericFilters.length > 0 ? { numericFilters } : {}),
  };
};
