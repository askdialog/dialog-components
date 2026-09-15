import type { SearchHit } from "@askdialog/dialog-sdk";
import { hitHref } from "./searchDisplay";

/** Collections without a link cannot navigate on selection and are not rendered. */
export const navigableCollections = (
  collections: SearchHit[] | undefined,
): { collection: SearchHit; href: string }[] =>
  (collections ?? []).flatMap((collection) => {
    const href = hitHref(collection);

    return href === undefined ? [] : [{ collection, href }];
  });
