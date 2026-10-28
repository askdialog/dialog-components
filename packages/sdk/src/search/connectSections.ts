import {
  SearchArticleHit,
  SearchCollectionHit,
  SearchPageHit,
  SearchResult,
  SearchSections,
} from "../types/search";
import {
  hitHref,
  hitTitle,
  navigableCollections,
  sectionHitImage,
} from "../utils/searchDisplay";
import { splitTitleMatch, TitleParts } from "../utils/titleHighlight";
import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
import { SearchController } from "./types";

/** What a surface renders for a section hit. */
export interface SectionHitDisplay {
  readonly title: string;
  /** The title split around the answered query, for highlighting. */
  readonly titleParts: TitleParts;
  /** HTTP(S) link; absent when the hit has none. */
  readonly href?: string;
  readonly image?: string;
}

export interface SectionHit<THit> {
  readonly hit: THit;
  readonly display: SectionHitDisplay;
}

export interface SectionsRenderState {
  /** Only collections with a link: one without cannot navigate. */
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

const display = (
  hit: SearchCollectionHit | SearchArticleHit | SearchPageHit,
  query: string,
  image: string | undefined,
  href = hitHref(hit),
): SectionHitDisplay => {
  const title = hitTitle(hit);

  return { title, titleParts: splitTitleMatch(title, query), href, image };
};

const withDisplay = <THit extends SearchArticleHit | SearchPageHit>(
  result: SearchResult<THit> | undefined,
  image: (hit: THit) => string | undefined,
): SectionHit<THit>[] =>
  (result?.hits ?? []).map((hit) => ({
    hit,
    display: display(hit, result?.query ?? "", image(hit)),
  }));

const renderSections = (sections: SearchSections): SectionsRenderState => {
  const { collections, articles, pages } = sections;

  return {
    collections: navigableCollections(collections?.hits).map(
      ({ collection, href }) => ({
        hit: collection,
        display: display(
          collection,
          collections?.query ?? "",
          sectionHitImage(collection),
          href,
        ),
      }),
    ),
    articles: withDisplay(articles, sectionHitImage),
    // Pages have no image.
    pages: withDisplay(pages, () => undefined),
  };
};

/** Collections with a link, articles and pages searched beside products, ready to render. */
export function connectSections(
  controller: SearchController,
): SectionsConnector {
  const entry = productsEntry(controller);
  const { getRenderState, subscribe, dispose } = createConnector(controller, {
    // The query being asked: sections answered for a previous one are not shown on the empty query.
    read: ({ results, searchState }) =>
      [results.sections, entry.read(searchState).query.trim() === ""] as const,
    render: ([sections, empty]) =>
      empty || sections === undefined ? NO_SECTIONS : renderSections(sections),
  });

  return { getRenderState, subscribe, dispose };
}
