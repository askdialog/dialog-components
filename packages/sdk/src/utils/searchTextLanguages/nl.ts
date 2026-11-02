import type { TextsFactory } from "./types";

export const nl: TextsFactory = (n) => ({
  searching: (query) => `Zoeken naar “${query}”…`,
  noResults: "Geen overeenkomende producten",
  retry: "Opnieuw proberen",
  collectionsLabel: "Collecties",
  productsLabel: "Producten",
  rankingLabel: (ranking) =>
    ranking === undefined
      ? "Onze producten"
      : {
          best_sellers: "Bestsellers",
          newest: "Nieuw binnen",
          price_asc: "Lage prijzen",
          price_desc: "Hoge prijzen",
        }[ranking],
  collectionsCount: (count) =>
    count === 1 ? "1 collectie" : `${n(count)} collecties`,
  resultsCount: (count) =>
    count === 1 ? "1 resultaat" : `${n(count)} resultaten`,
  seeAllLabel: (count) =>
    count === 1 ? "Bekijk het resultaat" : `Bekijk alle ${n(count)} resultaten`,
  previous: "Vorige",
  next: "Volgende",
  pageOf: (page, pages) => `Pagina ${n(page)} / ${n(pages)}`,
});
