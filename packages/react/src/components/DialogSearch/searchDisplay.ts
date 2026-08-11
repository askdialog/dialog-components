import type { SearchPriceRange } from "@askdialog/dialog-sdk";

export const formatSearchPrice = (
  priceRange: SearchPriceRange | undefined,
): string => {
  if (priceRange === undefined) {
    return "";
  }
  const { min, max } = priceRange;
  const format = ({ amount, currencyCode }: SearchPriceRange["min"]): string =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
    }).format(Number(amount));

  return min.amount === max.amount
    ? format(min)
    : `${format(min)} – ${format(max)}`;
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
