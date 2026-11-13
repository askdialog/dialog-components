import { TitlePart } from "./titleHighlight";

const COMBINING_MARK = /\p{M}/u;

const fold = (text: string): string =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** The length of `text`'s leading run that folds to `typed`, else 0. */
const matchedPrefixLength = (text: string, typed: string): number => {
  // Per character on both sides: a whole-string fold differs (Greek final sigma).
  const target = [...typed].map(fold).join("");
  if (target === "") {
    return 0;
  }
  const chars = [...text];
  let folded = "";
  let count = 0;
  while (count < chars.length && folded.length < target.length) {
    folded += fold(chars[count]);
    count += 1;
  }
  if (folded !== target) {
    return 0;
  }
  // Marks combining with the last matched letter stay with it.
  while (count < chars.length && COMBINING_MARK.test(chars[count])) {
    count += 1;
  }

  return chars.slice(0, count).join("").length;
};

/**
 * `text` in runs, its leading part matching `typed` highlighted, ignoring case
 * and accents. Without a match, or with nothing typed, the plain text.
 */
export const highlightedPrefixParts = (
  text: string,
  typed: string,
): TitlePart[] => {
  const length = matchedPrefixLength(text, typed);
  if (length === 0) {
    return [{ text, highlighted: false }];
  }

  return [
    { text: text.slice(0, length), highlighted: true },
    { text: text.slice(length), highlighted: false },
  ].filter((part) => part.text !== "");
};
