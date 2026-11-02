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
});
