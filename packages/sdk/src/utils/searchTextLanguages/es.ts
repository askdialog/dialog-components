import type { TextsFactory } from "./types";

export const es: TextsFactory = (n) => ({
  searching: (query) => `Buscando «${query}»…`,
  noResults: "No hay productos que coincidan",
  retry: "Reintentar",
  collectionsLabel: "Colecciones",
  productsLabel: "Productos",
  rankingLabel: (ranking) =>
    ranking === undefined
      ? "Nuestros productos"
      : {
          best_sellers: "Más vendidos",
          newest: "Novedades",
          price_asc: "Precios bajos",
          price_desc: "Precios altos",
        }[ranking],
  collectionsCount: (count) =>
    count === 1 ? "1 colección" : `${n(count)} colecciones`,
  resultsCount: (count) =>
    count === 1 ? "1 resultado" : `${n(count)} resultados`,
  seeAllLabel: (count) =>
    count === 1 ? "Ver el resultado" : `Ver los ${n(count)} resultados`,
  previous: "Anterior",
  next: "Siguiente",
  pageOf: (page, pages) => `Página ${n(page)} / ${n(pages)}`,
  filterFields: {
    price: "Precio",
    brand: "Marca",
    category: "Categoría",
    productType: "Tipo de producto",
    color: "Color",
    size: "Talla",
  },
  filterComparison: (field, operator, value) =>
    ({
      "<": `${field} inferior a ${value}`,
      "<=": `${field} hasta ${value} inclusive`,
      "=": `${field}: ${value}`,
      "!=": `${field} distinto de ${value}`,
      ">=": `${field} a partir de ${value}`,
      ">": `${field} superior a ${value}`,
    })[operator],
  filterBetween: (field, min, max) => `${field} entre ${min} y ${max}`,
  filterExclusion: (field, value) => `${field}: excepto ${value}`,
  filterValueRange: (min, max) => `${min} – ${max}`,
});
