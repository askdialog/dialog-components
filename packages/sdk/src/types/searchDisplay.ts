/** How the merchant shapes result images: `theme` keeps the surface's own corners. */
export type SearchImageShape = "theme" | "square" | "rounded" | "round";

/** An image to display, in the merchant's shape. */
export interface SearchDisplayImage {
  url: string;
  shape: SearchImageShape;
}

/** The server's display rules on top of a hit's raw record. */
export interface SearchHitDisplay {
  /** The image to display; absent when there is none to show, e.g. the merchant hides images. */
  image?: SearchDisplayImage;
  title: string;
  /** Absolute, or relative to the storefront's locale root, e.g. `products/creme-lift`. */
  url: string;
}

/** A line of text the merchant shows next to a product's title. */
export interface SearchDisplayLine {
  position: "above_title" | "below_title";
  text: string;
}

/** The server's display rules on top of a product hit's raw record. */
export interface SearchProductHitDisplay extends SearchHitDisplay {
  /** Formatted in the shopper's market currency. */
  price: string;
  /** Formatted like `price`; present only when higher than it. */
  compare_at_price?: string;
  lines: SearchDisplayLine[];
}
