import { describe, expect, it } from "vitest";
import { getSearchTexts } from "../utils/searchTexts";

describe("getSearchTexts", () => {
  it.each([
    [
      "en",
      [
        "Our products",
        "Best sellers",
        "New arrivals",
        "Low prices",
        "High prices",
      ],
    ],
    [
      "fr-BE",
      [
        "Nos produits",
        "Meilleures ventes",
        "Nouveautés",
        "Petits prix",
        "Prix décroissants",
      ],
    ],
    [
      "de",
      [
        "Unsere Produkte",
        "Bestseller",
        "Neuheiten",
        "Niedrige Preise",
        "Hohe Preise",
      ],
    ],
    [
      "es",
      [
        "Nuestros productos",
        "Más vendidos",
        "Novedades",
        "Precios bajos",
        "Precios altos",
      ],
    ],
    [
      "it",
      [
        "I nostri prodotti",
        "Più venduti",
        "Novità",
        "Prezzi bassi",
        "Prezzi alti",
      ],
    ],
  ])("titles the empty-query products in %s", (locale, titles) => {
    const { rankingLabel } = getSearchTexts(locale);

    expect([
      rankingLabel(undefined),
      rankingLabel("best_sellers"),
      rankingLabel("newest"),
      rankingLabel("price_asc"),
      rankingLabel("price_desc"),
    ]).toEqual(titles);
  });

  it("falls back to English for an unknown or missing language", () => {
    expect(getSearchTexts("ja-JP").noResults).toBe("No matching products");
    expect(getSearchTexts(undefined).noResults).toBe("No matching products");
  });

  it("formats counts in the locale", () => {
    expect(getSearchTexts("de-DE").resultsCount(1234)).toBe("1.234 Ergebnisse");
  });

  it("replaces only the keys an override names", () => {
    const texts = getSearchTexts("fr", { noResults: "Rien trouvé" });

    expect(texts.noResults).toBe("Rien trouvé");
    expect(texts.retry).toBe("Réessayer");
    expect(texts.productsLabel).toBe("Produits");
  });
});
