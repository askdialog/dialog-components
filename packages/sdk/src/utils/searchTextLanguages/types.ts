import type { SearchTexts } from "../searchTexts";

/** The forms of a count by plural category, `other` for any category left out. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

/** A language's texts, from its number formatter and plural form selector. */
export type TextsFactory = (
  n: (count: number) => string,
  plural: (count: number, forms: PluralForms) => string,
) => SearchTexts;
