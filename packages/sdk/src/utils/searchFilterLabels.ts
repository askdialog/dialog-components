import {
  SearchFacetFilter,
  SearchNumericFilter,
  SearchNumericOperator,
} from "../types/searchFilters";
import { formatAmount } from "./searchPrice";
import { SearchFilterField, SearchTexts } from "./searchTexts";

export type SearchFilter = SearchFacetFilter | SearchNumericFilter;

/** What filters are written with. */
export interface FilterWriting {
  readonly texts: SearchTexts;
  /** The shopper's locale, e.g. `fr-BE`. */
  readonly locale: string;
  /** Prices are written in it; bare amounts without it. */
  readonly currency?: string;
  /** The published label of each attribute. */
  readonly labels: Readonly<Record<string, string>>;
}

const PRICE = "price";

const FIELDS: Readonly<Record<string, SearchFilterField>> = {
  price: "price",
  brand: "brand",
  vendor: "brand",
  category: "category",
  product_type: "productType",
  productType: "productType",
  color: "color",
  size: "size",
};

const OPERATOR_SYMBOLS: Readonly<Record<SearchNumericOperator, string>> = {
  "<": "<",
  "<=": "≤",
  ">": ">",
  ">=": "≥",
  "=": "=",
  "!=": "≠",
};

/** The published label, else the texts' label of a common attribute, else the key in words. */
export const filterFieldLabel = (
  attribute: string,
  { texts, labels }: FilterWriting,
): string => {
  if (Object.hasOwn(labels, attribute)) {
    return labels[attribute];
  }

  return Object.hasOwn(FIELDS, attribute)
    ? texts.filterFields[FIELDS[attribute]]
    : attribute.replace(/[_.]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
};

const amountOf =
  (attribute: string, { currency, locale }: FilterWriting) =>
  (value: number): string =>
    formatAmount(value, attribute === PRICE ? currency : undefined, locale);

const disjunction = (items: string[], locale: string): string => {
  try {
    return new Intl.ListFormat(locale, { type: "disjunction" }).format(items);
  } catch {
    return items.join(", ");
  }
};

const filterText = (filter: SearchFilter, writing: FilterWriting): string => {
  const { texts } = writing;
  const field = filterFieldLabel(filter.attribute, writing);
  const amount = amountOf(filter.attribute, writing);
  if ("from" in filter) {
    return texts.filterBetween(field, amount(filter.from), amount(filter.to));
  }
  if ("operator" in filter) {
    return texts.filterComparison(field, filter.operator, amount(filter.value));
  }

  return filter.negated === true
    ? texts.filterExclusion(field, filter.value)
    : `${field} : ${filter.value}`;
};

const filterValue = (filter: SearchFilter, writing: FilterWriting): string => {
  const amount = amountOf(filter.attribute, writing);
  if ("from" in filter) {
    return writing.texts.filterValueRange(
      amount(filter.from),
      amount(filter.to),
    );
  }
  if ("operator" in filter) {
    return `${OPERATOR_SYMBOLS[filter.operator]} ${amount(filter.value)}`;
  }

  return filter.negated === true ? `≠ ${filter.value}` : filter.value;
};

/** A group in words, its items alternatives of each other: "Brand : Nike or Brand : Puma". */
export const filterGroupText = (
  group: readonly SearchFilter[],
  writing: FilterWriting,
): string =>
  disjunction(
    group.map((filter) => filterText(filter, writing)),
    writing.locale,
  );

/**
 * The group's values alone, for a field already named by its first attribute;
 * an item of another attribute keeps its own name.
 */
export const filterGroupValue = (
  group: readonly SearchFilter[],
  writing: FilterWriting,
): string => {
  const lead = group[0]?.attribute;

  return disjunction(
    group.map((filter) => {
      const value = filterValue(filter, writing);

      return filter.attribute === lead
        ? value
        : `${filterFieldLabel(filter.attribute, writing)} : ${value}`;
    }),
    writing.locale,
  );
};
