import type {
  SearchArticleHit,
  SearchCollectionHit,
  SearchHitByIndex,
  SearchIndex,
  SearchPageHit,
  SearchProductHit,
} from "../types/search";

type SearchHit = SearchHitByIndex[SearchIndex];

const nonEmpty = (value: string | undefined): string | undefined =>
  value === "" ? undefined : value;

/** The product's image to display, as the server's `_display` says. */
export const hitImage = (hit: SearchProductHit): string | undefined =>
  nonEmpty(hit._display.image);

/** A section hit's image to display, as the server's `_display` says. */
export const sectionHitImage = (
  hit: SearchCollectionHit | SearchArticleHit | SearchPageHit,
): string | undefined => nonEmpty(hit._display.image);

// Allow only HTTP(S) links.
export const safeHref = (url: string | undefined): string | undefined => {
  if (url === undefined || url === "") {
    return undefined;
  }

  try {
    const { protocol } = new URL(url, window.location.href);

    return protocol === "http:" || protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
};

const ABSOLUTE_OR_ROOT_RELATIVE = /^([a-z][a-z\d+.-]*:|\/)/i;

/**
 * A `_display.url` as a link: an absolute or root-relative one when HTTP(S),
 * a relative one resolved under `root` when it stays on the storefront's origin.
 */
export const resolveDisplayUrl = (
  url: string | undefined,
  root = "/",
): string | undefined => {
  if (url === undefined || url === "") {
    return undefined;
  }
  if (ABSOLUTE_OR_ROOT_RELATIVE.test(url)) {
    return safeHref(url);
  }

  try {
    const { origin } = window.location;
    const resolved = new URL(root + url, origin);

    return resolved.origin === origin ? resolved.href : undefined;
  } catch {
    return undefined;
  }
};

/** The hit's link, its `_display.url` resolved under the storefront's `root`. */
export const hitHref = (hit: SearchHit, root?: string): string | undefined =>
  resolveDisplayUrl(hit._display.url, root);

export const hitTitle = (hit: SearchHit): string => hit._display.title;

/** Collections without a link cannot navigate on selection and are not rendered. */
export const navigableCollections = (
  collections: SearchCollectionHit[] | undefined,
  root?: string,
): { collection: SearchCollectionHit; href: string }[] =>
  (collections ?? []).flatMap((collection) => {
    const href = hitHref(collection, root);

    return href === undefined ? [] : [{ collection, href }];
  });
