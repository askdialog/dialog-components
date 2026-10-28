import type {
  SearchCollectionHit,
  SearchHitByIndex,
  SearchIndex,
  SearchProductHit,
} from "../types/search";

type SearchHit = SearchHitByIndex[SearchIndex];

const nonEmpty = (value: string | undefined): string | undefined =>
  value === "" ? undefined : value;

/** The product's image, as Algolia's cards in distinct mode; else the variant's. */
export const hitImage = (hit: SearchProductHit): string | undefined =>
  nonEmpty(hit.product_image) ?? nonEmpty(hit.image);

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

export const hitHref = (hit: SearchHit): string | undefined =>
  safeHref(hit.url);

export const hitTitle = (hit: SearchHit): string =>
  hit.title ?? hit.handle ?? hit.objectID;

/** Collections without a link cannot navigate on selection and are not rendered. */
export const navigableCollections = (
  collections: SearchCollectionHit[] | undefined,
): { collection: SearchCollectionHit; href: string }[] =>
  (collections ?? []).flatMap((collection) => {
    const href = hitHref(collection);

    return href === undefined ? [] : [{ collection, href }];
  });
