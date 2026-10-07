import type { SearchHit, SearchProductHit } from "@askdialog/dialog-sdk";

/**
 * The lowest variant price only, as on the Shopify storefront search.
 * Hide a missing or invalid price; show a bare amount when currency is absent.
 */
export const formatSearchPrice = (
  { variants_min_price: amount, currency }: SearchProductHit,
  locale?: string,
): string => {
  if (amount === undefined) {
    return "";
  }
  try {
    return currency === undefined
      ? new Intl.NumberFormat(locale).format(amount)
      : new Intl.NumberFormat(locale, { style: "currency", currency }).format(
          amount,
        );
  } catch {
    return "";
  }
};

/** The product's image, as Algolia's cards in distinct mode; else the variant's. */
export const hitImage = (hit: SearchProductHit): string | undefined =>
  [hit.product_image, hit.image].find((url) => url !== undefined && url !== "");

// Allow only HTTP(S) links.
export const safeHref = (url: string): string | undefined => {
  try {
    const { protocol } = new URL(url, window.location.href);

    return protocol === "http:" || protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
};

export const hitHref = (
  hit: SearchHit | SearchProductHit,
): string | undefined =>
  hit.url === undefined || hit.url === "" ? undefined : safeHref(hit.url);

export const hitTitle = (hit: SearchHit | SearchProductHit): string =>
  hit.title ?? hit.handle ?? hit.objectID;
