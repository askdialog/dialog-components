import type { TextsFactory } from "./types";

export const fr: TextsFactory = (n) => ({
  searching: (query) => `Recherche de « ${query} »…`,
  noResults: "Aucun produit correspondant",
  retry: "Réessayer",
  collectionsLabel: "Collections",
  productsLabel: "Produits",
  rankingLabel: (ranking) =>
    ranking === undefined
      ? "Nos produits"
      : {
          best_sellers: "Meilleures ventes",
          newest: "Nouveautés",
          price_asc: "Petits prix",
          price_desc: "Prix décroissants",
        }[ranking],
  collectionsCount: (count) =>
    count === 1 ? "1 collection" : `${n(count)} collections`,
  resultsCount: (count) =>
    count === 1 ? "1 résultat" : `${n(count)} résultats`,
  seeAllLabel: (count) =>
    count === 1 ? "Voir le résultat" : `Voir les ${n(count)} résultats`,
  previous: "Précédent",
  next: "Suivant",
  pageOf: (page, pages) => `Page ${n(page)} / ${n(pages)}`,
});
