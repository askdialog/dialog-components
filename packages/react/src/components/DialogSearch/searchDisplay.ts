import type { SearchHit, SearchProductHit } from "@askdialog/dialog-sdk";

// Hide a missing or invalid amount; show a bare amount when currency is absent.
const formatAmount = (
  amount: number | undefined,
  currency: string | undefined,
  locale?: string,
): string => {
  if (amount === undefined || !Number.isFinite(amount)) {
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

/** The lowest variant price only, as on the Shopify storefront search. */
export const formatSearchPrice = (
  { variants_min_price: amount, currency }: SearchProductHit,
  locale?: string,
): string => formatAmount(amount, currency, locale);

/**
 * The lowest compare-at price, struck next to the price, only when it is
 * higher than a shown price; it may belong to another variant.
 */
export const formatSearchCompareAtPrice = (
  {
    variants_min_price: price,
    variants_compare_at_price_min: compareAt,
    currency,
  }: SearchProductHit,
  locale?: string,
): string => {
  if (
    price === undefined ||
    compareAt === undefined ||
    !(compareAt > price) ||
    formatAmount(price, currency, locale) === ""
  ) {
    return "";
  }

  return formatAmount(compareAt, currency, locale);
};

/** The product's image, as Algolia's cards in distinct mode; else the variant's. */
export const hitImage = (hit: SearchProductHit): string | undefined =>
  hit.product_image || hit.image || undefined;

// Allow only HTTP(S) links.
export const safeHref = (url: string): string | undefined => {
  try {
    const { protocol } = new URL(url, window.location.href);

    return protocol === "http:" || protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
};

export const hitHref = (hit: SearchHit): string | undefined =>
  hit.url === undefined || hit.url === "" ? undefined : safeHref(hit.url);

export const hitTitle = (hit: SearchHit): string =>
  hit.title ?? hit.handle ?? hit.objectID;
