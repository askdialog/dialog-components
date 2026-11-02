import { FilterableAttribute, IndexSearchState } from "../search/types";
import { SearchQuery } from "../types/search";
import { SearchFacetFilter, SearchNumericFilter } from "../types/searchFilters";

/** The products request's own part: its query, page and filters. */
export type ProductsQuery = Pick<
  SearchQuery,
  "query" | "facetFilters" | "numericFilters"
> & { page: number };

export type RangeBounds = NonNullable<IndexSearchState["range"]>[string];

const FACET_TYPES: readonly FilterableAttribute["type"][] = [
  "keyword",
  "boolean",
];

const bound = (text: string | undefined): number | undefined =>
  text === undefined || text === "" || !Number.isFinite(Number(text))
    ? undefined
    : Number(text);

// A floor above the ceiling matches nothing, as two groups the route accepts.
export const rangeGroups = (
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

export type AttributeTypes = ReadonlyMap<string, FilterableAttribute["type"]>;

export const attributeTypes = (
  filterableAttributes: readonly FilterableAttribute[],
): AttributeTypes => new Map(filterableAttributes.map((a) => [a.key, a.type]));

/** The `refinementList` attributes a request sends: declared `keyword` or `boolean`, with values. */
export const sentRefinementList = (
  entry: IndexSearchState,
  typeOf: AttributeTypes,
): [string, readonly string[]][] =>
  Object.entries(entry.refinementList ?? {}).filter(
    ([attribute, values]) =>
      FACET_TYPES.some((type) => typeOf.get(attribute) === type) &&
      values.length > 0,
  );

/** The `range` attributes a request sends: declared `number`. */
export const sentRanges = (
  entry: IndexSearchState,
  typeOf: AttributeTypes,
): [string, RangeBounds][] =>
  Object.entries(entry.range ?? {}).filter(
    ([attribute]) => typeOf.get(attribute) === "number",
  );

const facetFiltersOf = (
  entry: IndexSearchState,
  typeOf: AttributeTypes,
): SearchFacetFilter[][] => [
  ...(entry.filters?.facetFilters ?? []),
  ...sentRefinementList(entry, typeOf).map(([attribute, values]) =>
    values.map((value) => ({ attribute, value })),
  ),
];

const numericFiltersOf = (
  entry: IndexSearchState,
  typeOf: AttributeTypes,
): SearchNumericFilter[][] => [
  ...(entry.filters?.numericFilters ?? []),
  ...sentRanges(entry, typeOf).flatMap(([attribute, bounds]) =>
    rangeGroups(attribute, bounds),
  ),
];

/**
 * The products entry as its request: `filters` as they are, then a group per
 * refined attribute the search config declares with the right type.
 */
export const productsQuery = (
  entry: IndexSearchState & { page: number },
  filterableAttributes: readonly FilterableAttribute[],
): ProductsQuery => {
  const typeOf = attributeTypes(filterableAttributes);
  const facetFilters = facetFiltersOf(entry, typeOf);
  const numericFilters = numericFiltersOf(entry, typeOf);

  return {
    query: entry.query,
    page: entry.page,
    ...(facetFilters.length > 0 ? { facetFilters } : {}),
    ...(numericFilters.length > 0 ? { numericFilters } : {}),
  };
};
