import type { TextsFactory } from "./types";

export const en: TextsFactory = (n) => ({
  searching: (query) => `Searching “${query}”…`,
  noResults: "No matching products",
  retry: "Retry",
  collectionsLabel: "Collections",
  productsLabel: "Products",
  rankingLabel: (ranking) =>
    ranking === undefined
      ? "Our products"
      : {
          best_sellers: "Best sellers",
          newest: "New arrivals",
          price_asc: "Low prices",
          price_desc: "High prices",
        }[ranking],
  collectionsCount: (count) =>
    count === 1 ? "1 collection" : `${n(count)} collections`,
  resultsCount: (count) => (count === 1 ? "1 result" : `${n(count)} results`),
  seeAllLabel: (count) =>
    count === 1 ? "See the result" : `See all ${n(count)} results`,
  previous: "Previous",
  next: "Next",
  pageOf: (page, pages) => `Page ${n(page)} / ${n(pages)}`,
  filterFields: {
    price: "Price",
    brand: "Brand",
    category: "Category",
    productType: "Product type",
    color: "Color",
    size: "Size",
  },
  filterComparison: (field, operator, value) =>
    ({
      "<": `${field} below ${value}`,
      "<=": `${field} up to ${value}`,
      "=": `${field}: ${value}`,
      "!=": `${field} other than ${value}`,
      ">=": `${field} at least ${value}`,
      ">": `${field} above ${value}`,
    })[operator],
  filterBetween: (field, min, max) => `${field} between ${min} and ${max}`,
  filterExclusion: (field, value) => `${field}: excluding ${value}`,
  filterValueRange: (min, max) => `${min} – ${max}`,
});
