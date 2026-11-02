import type { TextsFactory } from "./types";

export const pl: TextsFactory = (n, plural) => ({
  searching: (query) => `Wyszukiwanie „${query}”…`,
  noResults: "Brak pasujących produktów",
  retry: "Spróbuj ponownie",
  collectionsLabel: "Kolekcje",
  productsLabel: "Produkty",
  rankingLabel: (ranking) =>
    ranking === undefined
      ? "Nasze produkty"
      : {
          best_sellers: "Bestsellery",
          newest: "Nowości",
          price_asc: "Niskie ceny",
          price_desc: "Wysokie ceny",
        }[ranking],
  collectionsCount: (count) =>
    plural(count, {
      one: `${n(count)} kolekcja`,
      few: `${n(count)} kolekcje`,
      other: `${n(count)} kolekcji`,
    }),
  resultsCount: (count) =>
    plural(count, {
      one: `${n(count)} wynik`,
      few: `${n(count)} wyniki`,
      many: `${n(count)} wyników`,
      other: `${n(count)} wyniku`,
    }),
  seeAllLabel: (count) =>
    plural(count, {
      one: "Zobacz wynik",
      few: `Zobacz wszystkie ${n(count)} wyniki`,
      many: `Zobacz wszystkie ${n(count)} wyników`,
      other: `Zobacz wszystkie ${n(count)} wyniku`,
    }),
  previous: "Poprzednia",
  next: "Następna",
  pageOf: (page, pages) => `Strona ${n(page)} / ${n(pages)}`,
});
