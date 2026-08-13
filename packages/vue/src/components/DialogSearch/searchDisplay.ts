import type { SearchPriceRange, SearchProduct } from "@askdialog/dialog-sdk";

// Catalog data is untrusted: a malformed `currencyCode` makes
// `Intl.NumberFormat` throw. Degrade to no price rather than taking the whole
// results panel down mid-render.
const formatMoney = (
  { amount, currencyCode }: SearchPriceRange["min"],
  locale: string | undefined,
): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount));

const formatRange = (
  { min, max }: SearchPriceRange,
  locale: string | undefined,
): string =>
  min.amount === max.amount
    ? formatMoney(min, locale)
    : `${formatMoney(min, locale)} – ${formatMoney(max, locale)}`;

export const formatSearchPrice = (
  priceRange: SearchPriceRange | undefined,
  locale?: string,
): string => {
  if (priceRange === undefined) {
    return "";
  }
  try {
    return formatRange(priceRange, locale);
  } catch {
    return "";
  }
};

export const formatSearchCompareAtPrice = (
  product: SearchProduct,
  locale?: string,
): string => {
  const priceRange = product.priceRange;
  const compareAtRange = product.compareAtPriceRange;
  if (priceRange === undefined || compareAtRange === undefined) {
    return "";
  }
  if (Number(compareAtRange.min.amount) <= Number(priceRange.min.amount)) {
    return "";
  }
  try {
    return formatRange(compareAtRange, locale);
  } catch {
    return "";
  }
};

// Catalog data is untrusted: only http(s) links, so a `javascript:` URL cannot execute script.
export const safeProductHref = (url: string): string | undefined => {
  try {
    const { protocol } = new URL(url, window.location.href);

    return protocol === "http:" || protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
};
