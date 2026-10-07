import type { SearchHit, SearchProductHit } from "@askdialog/dialog-sdk";

/** The product's image, as Algolia's cards in distinct mode; else the variant's. */
export const hitImage = (hit: SearchProductHit): string | undefined =>
  hit.product_image || hit.image || undefined;

// Allow only HTTP(S) links.
export const safeHref = (url: string): string | undefined => {
  try {
    const { protocol } = new URL(url, window.location.href);

    return protocol === "http:" || protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
};

export const hitHref = (hit: SearchHit): string | undefined =>
  hit.url === undefined || hit.url === "" ? undefined : safeHref(hit.url);

export const hitTitle = (hit: SearchHit): string =>
  hit.title ?? hit.handle ?? hit.objectID;
