export type SearchAppearanceImageRatio = "square" | "portrait";
export type SearchAppearanceFiltersStyle = "list" | "pills";

/**
 * The merchant's search appearance, from the storefront search config. Every
 * key is optional: an absent one takes the surface's default, except the
 * accent and button text colours, which take the assistant theme's first.
 */
export interface SearchAppearance {
  /** Hex colours: `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa`. */
  readonly colors?: {
    readonly text?: string;
    readonly mutedText?: string;
    readonly accent?: string;
    readonly buttonText?: string;
    readonly surface?: string;
    readonly border?: string;
  };
  /** Whole pixels, 0 to 999. */
  readonly radii?: {
    readonly card?: number;
    readonly button?: number;
    readonly input?: number;
  };
  readonly card?: {
    readonly imageRatio?: SearchAppearanceImageRatio;
    readonly showVendor?: boolean;
    readonly showAddToCart?: boolean;
  };
  readonly filters?: {
    readonly style?: SearchAppearanceFiltersStyle;
  };
  readonly badges?: {
    /** The discount badge of a lexical search result. */
    readonly discount?: {
      /** Hex colours, as in `colors`. */
      readonly background?: string;
      readonly text?: string;
      /** Whole pixels, 0 to 999. */
      readonly radius?: number;
    };
  };
}
