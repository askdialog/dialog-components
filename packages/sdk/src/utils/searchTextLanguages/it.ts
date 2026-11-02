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
});
