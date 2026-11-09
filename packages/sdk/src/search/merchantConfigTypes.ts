import { SearchBusinessRanking } from "../types/dialogConfig";
import { SearchAppearance } from "../types/searchAppearance";

/** An attribute the shopper can filter products on, from the search config. */
export interface FilterableAttribute {
  readonly key: string;
  readonly label: string;
  readonly type: "keyword" | "number" | "boolean" | "date";
  readonly values: readonly string[];
  /** False when the merchant hides it from the search page; absent means shown. */
  readonly showInSearch?: boolean;
}

/** The part of the storefront search config the SDK reads. */
export interface SearchConfig {
  readonly filterableAttributes: readonly FilterableAttribute[];
  /** The merchant's search appearance; absent reads as `{}`. */
  readonly appearance?: SearchAppearance;
}

/** The merchant's configuration, passed in or loaded once per page. */
export interface MerchantConfig {
  /** Absent when the merchant chose none or its loading failed. */
  readonly businessRanking?: SearchBusinessRanking;
  readonly searchConfig?: SearchConfig;
}
