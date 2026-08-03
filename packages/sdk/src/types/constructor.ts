import { AddToCartInput } from "./events";
import { SimplifiedProduct } from "./product";
import { Theme } from "./theme";

export interface DialogCallbacks {
  addToCart: (input: AddToCartInput) => Promise<void>;
  getProduct: (
    productId: string,
    variantId?: string,
  ) => Promise<SimplifiedProduct>;
}

export interface DialogConstructor {
  apiKey: string;
  locale: string;
  /**
   * Optional ISO 3166 country code used to format prices (e.g. 'FR', 'US').
   * When provided it takes precedence over the country derived from `locale`.
   * Omit it to keep deriving the country from the locale (backward compatible).
   */
  countryCode?: string;
  /**
   * Commerce callbacks. Optional: a search-only integration can omit them —
   * the assistant runtime still loads, and only `getProduct()` / `addToCart()`
   * throw a configuration error when their callback is absent.
   */
  callbacks?: DialogCallbacks;
  theme?: Partial<Theme>;
  userId?: string;
}
