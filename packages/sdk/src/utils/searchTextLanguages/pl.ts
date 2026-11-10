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
  filterFields: {
    price: "Cena",
    brand: "Marka",
    category: "Kategoria",
    productType: "Typ produktu",
    color: "Kolor",
    size: "Rozmiar",
  },
  filterComparison: (field, operator, value) =>
    ({
      "<": `${field} poniżej ${value}`,
      "<=": `${field} do ${value} włącznie`,
      "=": `${field}: ${value}`,
      "!=": `${field} inne niż ${value}`,
      ">=": `${field} od ${value}`,
      ">": `${field} powyżej ${value}`,
    })[operator],
  filterBetween: (field, min, max) => `${field} między ${min} a ${max}`,
  filterExclusion: (field, value) => `${field}: z wyjątkiem ${value}`,
  filterValueRange: (min, max) => `${min} – ${max}`,
  seeMore: (count) => `Pokaż więcej (${n(count)})`,
  seeLess: "Pokaż mniej",
  clearAll: "Wyczyść wszystko",
  clearFilters: "Wyczyść filtry",
  filteredEmptyTitle: "Brak wyników dla tych filtrów",
  filteredEmptyBody: "Usuń niektóre filtry, aby zobaczyć więcej produktów.",
  priceMin: "Min",
  priceMax: "Maks",
  priceMinAboveMax: "Cena minimalna nie może przekraczać maksymalnej.",
  removeFilter: (text) => `Usuń filtr: ${text}`,
  filtersLabel: "Filtry",
  appliedFiltersLabel: "Zastosowane filtry",
});
