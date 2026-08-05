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
  /**
   * Adds `data-ot-ignore` on the injected assistant script so OneTrust
   * auto-blocking does not neutralize it for visitors who declined cookies.
   * The assistant gates analytics on consent internally, so loading it is
   * safe — but exempting a script from the CMP is the merchant's compliance
   * call, hence opt-in. No effect outside OneTrust auto-blocking setups.
   */
  ignoreOneTrustAutoBlock?: boolean;
}
