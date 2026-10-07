import type { SearchProductHit } from "../types/search";

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
  hit: SearchProductHit,
  locale?: string,
): string => {
  const {
    variants_min_price: price,
    variants_compare_at_price_min: compareAt,
  } = hit;
  if (
    price === undefined ||
    compareAt === undefined ||
    !(compareAt > price) ||
    formatSearchPrice(hit, locale) === ""
  ) {
    return "";
  }

  return formatAmount(compareAt, hit.currency, locale);
};
