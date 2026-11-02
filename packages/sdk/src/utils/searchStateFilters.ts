import { FilterableAttribute, IndexSearchState } from "../search/types";
import {
  SearchFacetFilter,
  SearchFilters,
  SearchNumericFilter,
} from "../types/searchFilters";
import { SearchFilter } from "./searchFilterLabels";
import { attributeTypes, isFacetType, RangeBounds } from "./searchFilters";

export type SearchStateFilters = Pick<
  IndexSearchState,
  "refinementList" | "range" | "filters"
>;

interface Bounds {
  attribute: string;
  min?: number;
  max?: number;
}

/** The record, or undefined when it is empty. */
const nonEmpty = <T extends object>(record: T): T | undefined =>
  Object.keys(record).length > 0 ? record : undefined;

/** The record with `key` set to `value`, or taken off when undefined; undefined once empty. */
export const withKey = <T>(
  record: Readonly<Record<string, T>> | undefined,
  key: string,
  value: T | undefined,
): Record<string, T> | undefined =>
  nonEmpty(
    Object.fromEntries([
      ...Object.entries(record ?? {}).filter(([other]) => other !== key),
      ...(value === undefined ? [] : [[key, value] as const]),
    ]),
  );

const isExclusion = (filter: SearchFilter): boolean =>
  ("negated" in filter && filter.negated === true) ||
  ("operator" in filter && filter.operator === "!=");

/** The attribute of a group picking values of one attribute, none excluded. */
export const pickedAttribute = (
  group: readonly SearchFilter[],
): string | undefined => {
  const attribute = group[0]?.attribute;

  return group.length > 0 &&
    group.every(
      (filter) => filter.attribute === attribute && !isExclusion(filter),
    )
    ? attribute
    : undefined;
};

/** The inclusive bounds a group of one comparison sets. */
const boundsOf = (group: SearchNumericFilter[]): Bounds | undefined => {
  if (group.length !== 1) {
    return undefined;
  }
  const [filter] = group;
  const { attribute } = filter;
  if ("from" in filter) {
    return { attribute, min: filter.from, max: filter.to };
  }
  if (filter.operator === ">=") {
    return { attribute, min: filter.value };
  }

  return filter.operator === "<="
    ? { attribute, max: filter.value }
    : undefined;
};

/** Bounds added to the attribute's known ones, unless they set a side twice. */
const merged = (
  known: Bounds | undefined,
  added: Bounds,
): Bounds | undefined => {
  const collides =
    (added.min !== undefined && known?.min !== undefined) ||
    (added.max !== undefined && known?.max !== undefined);

  return collides ? undefined : { ...known, ...added };
};

const facetPart = (
  groups: SearchFacetFilter[][],
  isFacet: (attribute: string) => boolean,
): { refinementList: Record<string, string[]>; raw: SearchFacetFilter[][] } => {
  const picked = groups.map(pickedAttribute);
  const refinementList: Record<string, string[]> = {};
  const raw: SearchFacetFilter[][] = [];
  groups.forEach((group, index) => {
    const attribute = picked[index];
    // Two groups on one attribute AND their values, which a list cannot say.
    const alone = picked.filter((other) => other === attribute).length === 1;
    if (attribute !== undefined && alone && isFacet(attribute)) {
      refinementList[attribute] = group.map((filter) => filter.value);
    } else {
      raw.push(group);
    }
  });

  return { refinementList, raw };
};

const numericPart = (
  groups: SearchNumericFilter[][],
  isNumber: (attribute: string) => boolean,
): { range: Record<string, RangeBounds>; raw: SearchNumericFilter[][] } => {
  const bounds = new Map<string, Bounds>();
  const raw: SearchNumericFilter[][] = [];
  for (const group of groups) {
    const added = boundsOf(group);
    const next =
      added !== undefined && isNumber(added.attribute)
        ? merged(bounds.get(added.attribute), added)
        : undefined;
    if (next === undefined) {
      raw.push(group);
    } else {
      bounds.set(next.attribute, next);
    }
  }
  const range: Record<string, RangeBounds> = {};
  for (const { attribute, min, max } of bounds.values()) {
    range[attribute] = `${min ?? ""}:${max ?? ""}`;
  }

  return { range, raw };
};

/**
 * Filters as a products entry's refinements: a group picking values of one
 * attribute becomes its `refinementList`, inclusive bounds its `range`, when
 * the search config declares the attribute with that type; the rest stays in
 * `filters`. The entry's request then sends the same filters.
 */
export const searchStateFilters = (
  filters: SearchFilters,
  filterableAttributes: readonly FilterableAttribute[],
): SearchStateFilters => {
  const types = attributeTypes(filterableAttributes);
  const facets = facetPart(filters.facetFilters, (attribute) =>
    isFacetType(types.get(attribute)),
  );
  const numerics = numericPart(
    filters.numericFilters,
    (attribute) => types.get(attribute) === "number",
  );
  const rawCount = facets.raw.length + numerics.raw.length;

  return {
    refinementList: nonEmpty(facets.refinementList),
    range: nonEmpty(numerics.range),
    filters:
      rawCount > 0
        ? { facetFilters: facets.raw, numericFilters: numerics.raw }
        : undefined,
  };
};
