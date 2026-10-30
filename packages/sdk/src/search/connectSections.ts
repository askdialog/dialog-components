import {
  SearchArticleHit,
  SearchCollectionHit,
  SearchPageHit,
  SearchResult,
  SearchSections,
} from "../types/search";
import { hitHref, hitTitle, sectionHitImage } from "../utils/searchDisplay";
import { splitTitleMatch, TitleParts } from "../utils/titleHighlight";
import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
import { SearchController } from "./types";

/** What a surface renders for a section hit, all from the server's `_display`. */
export interface SectionHitDisplay {
  readonly title: string;
  /** The title split around the answered query, for highlighting. */
  readonly titleParts: TitleParts;
  /** HTTP(S) link on the storefront or beyond. */
  readonly href: string;
  readonly image?: string;
}

export interface SectionHit<THit> {
  readonly hit: THit;
  readonly display: SectionHitDisplay;
}

/** Only hits with a link: one without cannot navigate. */
export interface SectionsRenderState {
  readonly collections: readonly SectionHit<SearchCollectionHit>[];
  readonly articles: readonly SectionHit<SearchArticleHit>[];
  readonly pages: readonly SectionHit<SearchPageHit>[];
}

export type SectionsConnector = Connector<SectionsRenderState>;

const NO_SECTIONS: SectionsRenderState = {
  collections: [],
  articles: [],
  pages: [],
};

type SectionSearchHit = SearchCollectionHit | SearchArticleHit | SearchPageHit;

const withDisplay = <THit extends SectionSearchHit>(
  result: SearchResult<THit> | undefined,
  root: string,
): SectionHit<THit>[] =>
  (result?.hits ?? []).flatMap((hit) => {
    const href = hitHref(hit, root);
    if (href === undefined) {
      return [];
    }
    const title = hitTitle(hit);
    const titleParts = splitTitleMatch(title, result?.query ?? "");

    return [
      {
        hit,
        display: { title, titleParts, href, image: sectionHitImage(hit) },
      },
    ];
  });

const renderSections = (
  { collections, articles, pages }: SearchSections,
  root: string,
): SectionsRenderState => ({
  collections: withDisplay(collections, root),
  articles: withDisplay(articles, root),
  pages: withDisplay(pages, root),
});

/** Collections, articles and pages with a link searched beside products, ready to render. */
export function connectSections(
  controller: SearchController,
): SectionsConnector {
  const entry = productsEntry(controller);
  const { getRenderState, subscribe, dispose } = createConnector(controller, {
    // The query being asked: sections answered for a previous one are not shown on the empty query.
    read: ({ results, searchState, context }) =>
      [
        results.sections,
        entry.read(searchState).query.trim() === "",
        context.storefrontRoot,
      ] as const,
    render: ([sections, empty, root]) =>
      empty || sections === undefined
        ? NO_SECTIONS
        : renderSections(sections, root),
  });

  return { getRenderState, subscribe, dispose };
}
