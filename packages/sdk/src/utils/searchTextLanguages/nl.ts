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
  filterFields: {
    price: "Prijs",
    brand: "Merk",
    category: "Categorie",
    productType: "Producttype",
    color: "Kleur",
    size: "Maat",
  },
  filterComparison: (field, operator, value) =>
    ({
      "<": `${field} onder ${value}`,
      "<=": `${field} tot en met ${value}`,
      "=": `${field}: ${value}`,
      "!=": `${field} anders dan ${value}`,
      ">=": `${field} vanaf ${value}`,
      ">": `${field} boven ${value}`,
    })[operator],
  filterBetween: (field, min, max) => `${field} tussen ${min} en ${max}`,
  filterExclusion: (field, value) => `${field}: behalve ${value}`,
  filterValueRange: (min, max) => `${min} – ${max}`,
  seeMore: (count) => `Meer tonen (${n(count)})`,
  seeLess: "Minder tonen",
  clearAll: "Alles wissen",
  clearFilters: "Filters wissen",
  filteredEmptyTitle: "Geen resultaten met deze filters",
  filteredEmptyBody: "Verwijder enkele filters om meer producten te zien.",
  priceMin: "Min",
  priceMax: "Max",
  priceMinAboveMax: "De minimumprijs mag niet hoger zijn dan de maximumprijs.",
  removeFilter: (text) => `Filter verwijderen: ${text}`,
  filtersLabel: "Filters",
  appliedFiltersLabel: "Toegepaste filters",
});
