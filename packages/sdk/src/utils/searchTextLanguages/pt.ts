import type { TextsFactory } from "./types";

export const pt: TextsFactory = (n) => ({
  searching: (query) => `A procurar «${query}»…`,
  noResults: "Nenhum produto correspondente",
  retry: "Tentar novamente",
  collectionsLabel: "Coleções",
  productsLabel: "Produtos",
  rankingLabel: (ranking) =>
    ranking === undefined
      ? "Os nossos produtos"
      : {
          best_sellers: "Mais vendidos",
          newest: "Novidades",
          price_asc: "Preços baixos",
          price_desc: "Preços altos",
        }[ranking],
  collectionsCount: (count) =>
    count === 1 ? "1 coleção" : `${n(count)} coleções`,
  resultsCount: (count) =>
    count === 1 ? "1 resultado" : `${n(count)} resultados`,
  seeAllLabel: (count) =>
    count === 1 ? "Ver o resultado" : `Ver os ${n(count)} resultados`,
  previous: "Anterior",
  next: "Seguinte",
  pageOf: (page, pages) => `Página ${n(page)} / ${n(pages)}`,
  filterFields: {
    price: "Preço",
    brand: "Marca",
    category: "Categoria",
    productType: "Tipo de produto",
    color: "Cor",
    size: "Tamanho",
  },
  filterComparison: (field, operator, value) =>
    ({
      "<": `${field} inferior a ${value}`,
      "<=": `${field} até ${value} inclusive`,
      "=": `${field}: ${value}`,
      "!=": `${field} diferente de ${value}`,
      ">=": `${field} a partir de ${value}`,
      ">": `${field} superior a ${value}`,
    })[operator],
  filterBetween: (field, min, max) => `${field} entre ${min} e ${max}`,
  filterExclusion: (field, value) => `${field}: exceto ${value}`,
  filterValueRange: (min, max) => `${min} – ${max}`,
  seeMore: (count) => `Ver mais (${n(count)})`,
  seeLess: "Ver menos",
  clearAll: "Limpar tudo",
  clearFilters: "Limpar filtros",
  filteredEmptyTitle: "Sem resultados com estes filtros",
  filteredEmptyBody: "Remova alguns filtros para ver mais produtos.",
  priceMin: "Mín",
  priceMax: "Máx",
  priceMinAboveMax: "O preço mínimo não pode ser superior ao máximo.",
  removeFilter: (text) => `Remover filtro: ${text}`,
  filtersLabel: "Filtros",
  appliedFiltersLabel: "Filtros aplicados",
  sortLabel: "Ordenar por",
  sortOptions: {
    relevance: "Relevância",
    price_asc: "Preço: menor para maior",
    price_desc: "Preço: maior para menor",
  },
});
