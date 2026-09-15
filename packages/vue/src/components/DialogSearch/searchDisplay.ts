import type { SearchHit, SearchPriceRange } from "@askdialog/dialog-sdk";

// Hide invalid prices; show a bare amount when currency is absent.
const formatMoney = (
  { amount, currencyCode }: SearchPriceRange["min"],
  locale: string | undefined,
): string =>
  currencyCode === undefined
    ? new Intl.NumberFormat(locale).format(Number(amount))
    : new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
      }).format(Number(amount));

/** The lowest price only, as on the Shopify storefront search. */
export const formatSearchPrice = (
  priceRange: SearchPriceRange | undefined,
  locale?: string,
): string => {
  if (priceRange === undefined) {
    return "";
  }
  try {
    return formatMoney(priceRange.min, locale);
  } catch {
    return "";
  }
};

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
  hit.url === undefined ? undefined : safeHref(hit.url);

export const hitTitle = (hit: SearchHit): string =>
  hit.title ?? hit.handle ?? hit.objectID;
