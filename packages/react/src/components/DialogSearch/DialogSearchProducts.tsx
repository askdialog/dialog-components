import type { FC } from "react";
import type { SearchController, SearchResult } from "@askdialog/dialog-sdk";
import { DialogSearchProductCard } from "./DialogSearchProductCard";
import type { SearchMessages } from "./searchMessages";

interface DialogSearchProductsProps {
  controller: SearchController;
  response: SearchResult;
  locale: string | undefined;
  messages: SearchMessages;
}

export const DialogSearchProducts: FC<DialogSearchProductsProps> = ({
  controller,
  response,
  locale,
  messages,
}) => (
  <section className="dialog-search-products">
    <div className="dialog-search-section-head">
      <p className="dialog-search-label">
        {messages.productsLabel}
        {response.nbHits > 0 && (
          <span className="dialog-search-label-count">
            {` · ${messages.resultsCount(response.nbHits)}`}
          </span>
        )}
      </p>
    </div>
    <ul className="dialog-search-results">
      {response.hits.length === 0 ? (
        <li className="dialog-search-empty" role="status">
          {messages.noResults}
        </li>
      ) : (
        response.hits.map((hit, index) => (
          <DialogSearchProductCard
            key={hit.objectID}
            controller={controller}
            hit={hit}
            index={index}
            locale={locale}
            query={response.query}
          />
        ))
      )}
    </ul>
  </section>
);
