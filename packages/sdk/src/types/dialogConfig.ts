export type SearchBusinessRanking =
  | "best_sellers"
  | "newest"
  | "price_asc"
  | "price_desc";

/** The part of the widget dialog config the SDK reads. */
export interface DialogConfig {
  /** Absent when the merchant chose no business ranking. */
  searchBusinessRanking?: SearchBusinessRanking;
}
