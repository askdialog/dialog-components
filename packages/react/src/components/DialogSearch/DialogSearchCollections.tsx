import type { FC } from "react";
import type {
  SearchCollectionHit,
  SearchTexts,
  SectionHit,
} from "@askdialog/dialog-sdk";
import { CaretRightIcon } from "../../icons/CaretRightIcon";
import { HighlightedTitle } from "./HighlightedTitle";
import "./DialogSearchCollections.css";

interface DialogSearchCollectionsProps {
  /** Collections with a link, from the sections connector. */
  collections: readonly SectionHit<SearchCollectionHit>[];
  texts: SearchTexts;
}

export const DialogSearchCollections: FC<DialogSearchCollectionsProps> = ({
  collections,
  texts,
}) => {
  if (collections.length === 0) {
    return null;
  }

  return (
    <aside className="dialog-search-collections">
      <div className="dialog-search-section-head">
        <p className="dialog-search-label">{texts.collectionsLabel}</p>
        <span className="dialog-search-count">
          {texts.collectionsCount(collections.length)}
        </span>
      </div>
      <ul className="dialog-search-collection-list">
        {collections.map(({ hit, display }) => (
          <li key={hit.objectID}>
            <a className="dialog-search-collection" href={display.href}>
              <span className="dialog-search-collection-thumb" aria-hidden>
                {display.image !== undefined && (
                  <img src={display.image} alt="" loading="lazy" />
                )}
              </span>
              <span className="dialog-search-collection-title">
                <HighlightedTitle parts={display.titleParts} />
              </span>
              <span className="dialog-search-caret">
                <CaretRightIcon />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
};
