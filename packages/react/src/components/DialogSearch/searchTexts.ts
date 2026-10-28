import {
  getSearchTexts,
  type SearchContext,
  type SearchTexts,
} from "@askdialog/dialog-sdk/search";

/** The texts of `locale` when given, else the controller's, in the search language. */
export const resolveSearchTexts = (
  context: SearchContext,
  locale: string | undefined,
): SearchTexts =>
  locale === undefined ? context.texts : getSearchTexts(locale);
