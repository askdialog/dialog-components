import type { FC } from "react";
import type { SearchHit } from "@askdialog/dialog-sdk";
import { CaretRightIcon } from "../../icons/CaretRightIcon";
import { HighlightedTitle } from "./HighlightedTitle";
import { navigableCollections } from "./searchCollections";
import { hitTitle } from "./searchDisplay";
import type { SearchMessages } from "./searchMessages";
import "./DialogSearchCollections.css";

interface DialogSearchCollectionsProps {
  collections: SearchHit[];
  query: string;
  messages: SearchMessages;
}

export const DialogSearchCollections: FC<DialogSearchCollectionsProps> = ({
  collections,
  query,
  messages,
}) => {
  const entries = navigableCollections(collections);
  if (entries.length === 0) {
    return null;
  }

  return (
    <aside className="dialog-search-collections">
      <div className="dialog-search-section-head">
        <p className="dialog-search-label">{messages.collectionsLabel}</p>
        <span className="dialog-search-count">
          {messages.collectionsCount(entries.length)}
        </span>
      </div>
      <ul className="dialog-search-collection-list">
        {entries.map(({ collection, href }) => (
          <li key={collection.objectID}>
            <a className="dialog-search-collection" href={href}>
              <span className="dialog-search-collection-thumb" aria-hidden>
                {collection.imageUrl !== undefined &&
                  collection.imageUrl !== "" && (
                    <img src={collection.imageUrl} alt="" loading="lazy" />
                  )}
              </span>
              <span className="dialog-search-collection-title">
                <HighlightedTitle title={hitTitle(collection)} query={query} />
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
