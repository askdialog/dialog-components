export interface SearchMessages {
  searching: (query: string) => string;
  noResults: string;
  retry: string;
  collectionsLabel: string;
  productsLabel: string;
  collectionsCount: (count: number) => string;
  resultsCount: (count: number) => string;
  seeAllLabel: (count: number) => string;
  previous: string;
  next: string;
  pageOf: (page: number, pages: number) => string;
}

const formatCount = (count: number, locale: string | undefined): string => {
  try {
    return new Intl.NumberFormat(locale).format(count);
  } catch {
    return String(count);
  }
};

type MessagesFactory = (n: (count: number) => string) => SearchMessages;

const MESSAGES: Record<string, MessagesFactory> = {
  en: (n) => ({
    searching: (query) => `Searching “${query}”…`,
    noResults: "No matching products",
    retry: "Retry",
    collectionsLabel: "Collections",
    productsLabel: "Products",
    collectionsCount: (count) =>
      count === 1 ? "1 collection" : `${n(count)} collections`,
    resultsCount: (count) => (count === 1 ? "1 result" : `${n(count)} results`),
    seeAllLabel: (count) =>
      count === 1 ? "See the result" : `See all ${n(count)} results`,
    previous: "Previous",
    next: "Next",
    pageOf: (page, pages) => `Page ${n(page)} / ${n(pages)}`,
  }),
  fr: (n) => ({
    searching: (query) => `Recherche de « ${query} »…`,
    noResults: "Aucun produit correspondant",
    retry: "Réessayer",
    collectionsLabel: "Collections",
    productsLabel: "Produits",
    collectionsCount: (count) =>
      count === 1 ? "1 collection" : `${n(count)} collections`,
    resultsCount: (count) =>
      count === 1 ? "1 résultat" : `${n(count)} résultats`,
    seeAllLabel: (count) =>
      count === 1 ? "Voir le résultat" : `Voir les ${n(count)} résultats`,
    previous: "Précédent",
    next: "Suivant",
    pageOf: (page, pages) => `Page ${n(page)} / ${n(pages)}`,
  }),
  de: (n) => ({
    searching: (query) => `Suche nach „${query}“…`,
    noResults: "Keine passenden Produkte",
    retry: "Erneut versuchen",
    collectionsLabel: "Kollektionen",
    productsLabel: "Produkte",
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
  }),
  es: (n) => ({
    searching: (query) => `Buscando «${query}»…`,
    noResults: "No hay productos que coincidan",
    retry: "Reintentar",
    collectionsLabel: "Colecciones",
    productsLabel: "Productos",
    collectionsCount: (count) =>
      count === 1 ? "1 colección" : `${n(count)} colecciones`,
    resultsCount: (count) =>
      count === 1 ? "1 resultado" : `${n(count)} resultados`,
    seeAllLabel: (count) =>
      count === 1 ? "Ver el resultado" : `Ver los ${n(count)} resultados`,
    previous: "Anterior",
    next: "Siguiente",
    pageOf: (page, pages) => `Página ${n(page)} / ${n(pages)}`,
  }),
  it: (n) => ({
    searching: (query) => `Ricerca di “${query}”…`,
    noResults: "Nessun prodotto corrispondente",
    retry: "Riprova",
    collectionsLabel: "Collezioni",
    productsLabel: "Prodotti",
    collectionsCount: (count) =>
      count === 1 ? "1 collezione" : `${n(count)} collezioni`,
    resultsCount: (count) =>
      count === 1 ? "1 risultato" : `${n(count)} risultati`,
    seeAllLabel: (count) =>
      count === 1 ? "Vedi il risultato" : `Vedi tutti i ${n(count)} risultati`,
    previous: "Precedente",
    next: "Successivo",
    pageOf: (page, pages) => `Pagina ${n(page)} / ${n(pages)}`,
  }),
};

export const getSearchMessages = (
  locale: string | undefined,
): SearchMessages => {
  const language = locale?.split("-")[0]?.toLowerCase() ?? "en";
  const factory = MESSAGES[language] ?? MESSAGES.en;

  return factory((count) => formatCount(count, locale));
};
