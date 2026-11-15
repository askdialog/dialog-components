import type { TextsFactory } from "./types";

export const it: TextsFactory = (n) => ({
  searching: (query) => `Ricerca di “${query}”…`,
  noResults: "Nessun prodotto corrispondente",
  retry: "Riprova",
  collectionsLabel: "Collezioni",
  productsLabel: "Prodotti",
  rankingLabel: (ranking) =>
    ranking === undefined
      ? "I nostri prodotti"
      : {
          best_sellers: "Più venduti",
          newest: "Novità",
          price_asc: "Prezzi bassi",
          price_desc: "Prezzi alti",
        }[ranking],
  collectionsCount: (count) =>
    count === 1 ? "1 collezione" : `${n(count)} collezioni`,
  resultsCount: (count) =>
    count === 1 ? "1 risultato" : `${n(count)} risultati`,
  seeAllLabel: (count) =>
    count === 1 ? "Vedi il risultato" : `Vedi tutti i ${n(count)} risultati`,
  previous: "Precedente",
  next: "Successivo",
  pageOf: (page, pages) => `Pagina ${n(page)} / ${n(pages)}`,
  filterFields: {
    price: "Prezzo",
    brand: "Marca",
    category: "Categoria",
    productType: "Tipo di prodotto",
    color: "Colore",
    size: "Taglia",
  },
  filterComparison: (field, operator, value) =>
    ({
      "<": `${field} inferiore a ${value}`,
      "<=": `${field} fino a ${value} incluso`,
      "=": `${field}: ${value}`,
      "!=": `${field} diverso da ${value}`,
      ">=": `${field} a partire da ${value}`,
      ">": `${field} superiore a ${value}`,
    })[operator],
  filterBetween: (field, min, max) => `${field} tra ${min} e ${max}`,
  filterExclusion: (field, value) => `${field}: escluso ${value}`,
  filterValueRange: (min, max) => `${min} – ${max}`,
  seeMore: (count) => `Mostra altri (${n(count)})`,
  seeLess: "Mostra meno",
  clearAll: "Cancella tutto",
  clearFilters: "Cancella filtri",
  filteredEmptyTitle: "Nessun risultato con questi filtri",
  filteredEmptyBody: "Rimuovi alcuni filtri per vedere più prodotti.",
  priceMin: "Min",
  priceMax: "Max",
  priceMinAboveMax: "Il prezzo minimo non deve superare il massimo.",
  removeFilter: (text) => `Rimuovi filtro: ${text}`,
  filtersLabel: "Filtri",
  appliedFiltersLabel: "Filtri applicati",
  sortLabel: "Ordina per",
  sortOptions: {
    relevance: "Rilevanza",
    price_asc: "Prezzo crescente",
    price_desc: "Prezzo decrescente",
  },
});
