import { describe, expect, it } from "vitest";
import {
  filterGroupText,
  filterGroupValue,
  FilterWriting,
  SearchFilter,
} from "../utils/searchFilterLabels";
import { getSearchTexts } from "../utils/searchTexts";

const fr: FilterWriting = {
  texts: getSearchTexts("fr-FR"),
  locale: "fr-FR",
  currency: "EUR",
  labels: {},
};
const text = (group: SearchFilter[], writing = fr): string =>
  filterGroupText(group, writing);
const value = (group: SearchFilter[], writing = fr): string =>
  filterGroupValue(group, writing);
const euros = (amount: number): string =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    amount,
  );

describe("filterGroupText", () => {
  it.each([
    ["<", "inférieur à"],
    [">", "supérieur à"],
    [">=", "à partir de"],
    ["!=", "différent de"],
  ] as const)("explains the %s price operator", (operator, words) => {
    expect(text([{ attribute: "price", operator, value: 30 }])).toBe(
      `Prix ${words} ${euros(30)}`,
    );
  });

  it("keeps inclusive limits and decimal ranges", () => {
    expect(text([{ attribute: "price", operator: "<=", value: 30 }])).toBe(
      `Prix jusqu’à ${euros(30)} inclus`,
    );
    expect(text([{ attribute: "price", from: 10.5, to: 20 }])).toBe(
      `Prix entre ${euros(10.5)} et ${euros(20)}`,
    );
    expect(text([{ attribute: "price", operator: "=", value: 30 }])).toBe(
      `Prix : ${euros(30)}`,
    );
  });

  it("presents the items of a group as alternatives", () => {
    expect(
      text([
        { attribute: "brand", value: "Avène" },
        { attribute: "brand", value: "Kiehl’s" },
      ]),
    ).toBe("Marque : Avène ou Marque : Kiehl’s");
  });

  it("tells an exclusion from a value starting with a minus sign", () => {
    expect(text([{ attribute: "color", value: "red", negated: true }])).toBe(
      "Couleur : sauf red",
    );
    expect(text([{ attribute: "brand", value: "-limited" }])).toBe(
      "Marque : -limited",
    );
  });

  it("names an attribute by its published label, else its default label, else its key in words", () => {
    const writing = { ...fr, labels: { brand: "Créateur" } };

    expect(text([{ attribute: "brand", value: "Avène" }], writing)).toBe(
      "Créateur : Avène",
    );
    expect(text([{ attribute: "vendor", value: "Avène" }], writing)).toBe(
      "Marque : Avène",
    );
    expect(text([{ attribute: "skinType", value: "dry" }])).toBe(
      "skin Type : dry",
    );
    expect(text([{ attribute: "constructor", value: "x" }])).toBe(
      "constructor : x",
    );
  });

  it("writes only prices in the currency", () => {
    expect(text([{ attribute: "weight", operator: ">=", value: 2 }])).toBe(
      "weight à partir de 2",
    );
    expect(
      text([{ attribute: "price", operator: ">=", value: 2 }], {
        ...fr,
        currency: undefined,
      }),
    ).toBe("Prix à partir de 2");
  });

  it("writes the texts of the language", () => {
    const en: FilterWriting = {
      texts: getSearchTexts("en-US"),
      locale: "en-US",
      currency: "USD",
      labels: {},
    };

    expect(text([{ attribute: "price", from: 10, to: 20 }], en)).toBe(
      "Price between $10.00 and $20.00",
    );
    expect(
      text(
        [
          { attribute: "color", value: "red" },
          { attribute: "color", value: "blue" },
        ],
        en,
      ),
    ).toBe("Color : red or Color : blue");
  });
});

describe("filterGroupValue", () => {
  it("writes the values alone, for a field already named", () => {
    expect(value([{ attribute: "price", from: 10, to: 20 }])).toBe(
      `${euros(10)} – ${euros(20)}`,
    );
    expect(value([{ attribute: "price", operator: "<=", value: 30 }])).toBe(
      `≤ ${euros(30)}`,
    );
    expect(value([{ attribute: "color", value: "red", negated: true }])).toBe(
      "≠ red",
    );
    expect(
      value([
        { attribute: "brand", value: "Avène" },
        { attribute: "brand", value: "Kiehl’s" },
      ]),
    ).toBe("Avène ou Kiehl’s");
  });

  it("names an item of another attribute than the first", () => {
    expect(
      value([
        { attribute: "brand", value: "Avène" },
        { attribute: "color", value: "red" },
      ]),
    ).toBe("Avène ou Couleur : red");
  });
});
