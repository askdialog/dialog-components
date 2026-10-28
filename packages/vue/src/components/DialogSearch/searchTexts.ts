import {
  getSearchTexts,
  type SearchContext,
  type SearchTexts,
} from "@askdialog/dialog-sdk/search";

/** The texts of `locale` when given, else the controller's, in the shopper's language. */
export const searchTexts = (
  locale: string | undefined,
  context: SearchContext,
): SearchTexts =>
  locale === undefined ? context.texts : getSearchTexts(locale);
