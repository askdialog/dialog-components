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
});
