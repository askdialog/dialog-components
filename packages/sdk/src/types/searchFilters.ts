/** A value of a `keyword` or `boolean` attribute; `negated` excludes it. */
export interface SearchFacetFilter {
  attribute: string;
  value: string;
  negated?: boolean;
}

/** A comparison, or an inclusive range, on a `number` attribute. */
export type SearchNumericFilter =
  | {
      attribute: string;
      operator: "<" | "<=" | "=" | "!=" | ">=" | ">";
      value: number;
    }
  | { attribute: string; from: number; to: number };

/**
 * Filters on a products entry: groups combine with AND, the items of a group
 * with OR. Other entries take none.
 */
export interface SearchFilters {
  facetFilters: SearchFacetFilter[][];
  numericFilters: SearchNumericFilter[][];
}
