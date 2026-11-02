import type { TextsFactory } from "./types";

export const de: TextsFactory = (n) => ({
  searching: (query) => `Suche nach „${query}“…`,
  noResults: "Keine passenden Produkte",
  retry: "Erneut versuchen",
  collectionsLabel: "Kollektionen",
  productsLabel: "Produkte",
  rankingLabel: (ranking) =>
    ranking === undefined
      ? "Unsere Produkte"
      : {
          best_sellers: "Bestseller",
          newest: "Neuheiten",
          price_asc: "Niedrige Preise",
          price_desc: "Hohe Preise",
        }[ranking],
  collectionsCount: (count) =>
    count === 1 ? "1 Kollektion" : `${n(count)} Kollektionen`,
  resultsCount: (count) =>
    count === 1 ? "1 Ergebnis" : `${n(count)} Ergebnisse`,
  seeAllLabel: (count) =>
    count === 1
      ? "Das Ergebnis anzeigen"
      : `Alle ${n(count)} Ergebnisse anzeigen`,
  previous: "Zurück",
  next: "Weiter",
  pageOf: (page, pages) => `Seite ${n(page)} / ${n(pages)}`,
  filterFields: {
    price: "Preis",
    brand: "Marke",
    category: "Kategorie",
    productType: "Produkttyp",
    color: "Farbe",
    size: "Größe",
  },
  filterComparison: (field, operator, value) =>
    ({
      "<": `${field} unter ${value}`,
      "<=": `${field} bis einschließlich ${value}`,
      "=": `${field}: ${value}`,
      "!=": `${field} ungleich ${value}`,
      ">=": `${field} ab ${value}`,
      ">": `${field} über ${value}`,
    })[operator],
  filterBetween: (field, min, max) => `${field} zwischen ${min} und ${max}`,
  filterExclusion: (field, value) => `${field}: ohne ${value}`,
  filterValueRange: (min, max) => `${min} – ${max}`,
});
