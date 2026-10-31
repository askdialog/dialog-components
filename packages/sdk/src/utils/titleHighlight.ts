import { SearchHighlightResult } from "../types/search";

/** A run of the title: `highlighted` when the engine matched it. */
export interface TitlePart {
  readonly text: string;
  readonly highlighted: boolean;
}

const HIGHLIGHT_TAG = /<\/?em>/;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

const unescapeHtml = (value: string): string =>
  value.replace(
    /&(?:#x([\da-f]+)|#(\d+)|([a-z]+));/gi,
    (entity, hex?: string, decimal?: string, name?: string) => {
      if (name !== undefined) {
        return NAMED_ENTITIES[name.toLowerCase()] ?? entity;
      }
      const codePoint =
        hex === undefined
          ? Number.parseInt(decimal ?? "", 10)
          : Number.parseInt(hex, 16);

      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
    },
  );

/**
 * The title split on the `<em>` the engine put around its matched parts, as text.
 * Without a match (`matchLevel: none` or no `_highlightResult`), the plain title.
 */
export const highlightedTitleParts = (
  title: string,
  highlight: SearchHighlightResult | undefined,
): TitlePart[] => {
  if (highlight === undefined || highlight.title.matchLevel === "none") {
    return [{ text: title, highlighted: false }];
  }

  // Tags alternate open/close, so odd chunks sit between `<em>` and `</em>`.
  return highlight.title.value
    .split(HIGHLIGHT_TAG)
    .map((chunk, index) => ({
      text: unescapeHtml(chunk),
      highlighted: index % 2 === 1,
    }))
    .filter(({ text }) => text !== "");
};
