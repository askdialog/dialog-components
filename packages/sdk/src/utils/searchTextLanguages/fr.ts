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
  filterFields: {
    price: "Prix",
    brand: "Marque",
    category: "Catégorie",
    productType: "Type de produit",
    color: "Couleur",
    size: "Taille",
  },
  filterComparison: (field, operator, value) =>
    ({
      "<": `${field} inférieur à ${value}`,
      "<=": `${field} jusqu’à ${value} inclus`,
      "=": `${field} : ${value}`,
      "!=": `${field} différent de ${value}`,
      ">=": `${field} à partir de ${value}`,
      ">": `${field} supérieur à ${value}`,
    })[operator],
  filterBetween: (field, min, max) => `${field} entre ${min} et ${max}`,
  filterExclusion: (field, value) => `${field} : sauf ${value}`,
  filterValueRange: (min, max) => `${min} – ${max}`,
  seeMore: (count) => `Voir plus (${n(count)})`,
  seeLess: "Voir moins",
  clearAll: "Tout effacer",
  clearFilters: "Effacer les filtres",
  filteredEmptyTitle: "Aucun résultat avec ces filtres",
  filteredEmptyBody: "Retirez des filtres pour voir plus de produits.",
  priceMin: "Min",
  priceMax: "Max",
  priceMinAboveMax: "Le prix minimum ne doit pas dépasser le maximum.",
  removeFilter: (text) => `Retirer le filtre : ${text}`,
  filtersLabel: "Filtres",
  appliedFiltersLabel: "Filtres appliqués",
});
