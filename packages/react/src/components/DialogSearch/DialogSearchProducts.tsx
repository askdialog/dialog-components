import type { FC } from "react";
import type {
  SearchController,
  SearchControllerState,
} from "@askdialog/dialog-sdk";
import { DialogSearchPagination } from "./DialogSearchPagination";
import { DialogSearchProductCard } from "./DialogSearchProductCard";
import type { SearchMessages } from "./searchMessages";

interface DialogSearchProductsProps {
  controller: SearchController;
  state: SearchControllerState;
  locale: string | undefined;
  messages: SearchMessages;
  /** The footer link replaces in-panel pagination when set. */
  hasSeeAll: boolean;
}

export const DialogSearchProducts: FC<DialogSearchProductsProps> = ({
  controller,
  state,
  locale,
  messages,
  hasSeeAll,
}) => {
  const response = state.response;
  const hits = response?.hits ?? [];

  return (
    <section className="dialog-search-products">
      <div className="dialog-search-section-head">
        <p className="dialog-search-label">
          {messages.productsLabel}
          {response !== undefined && response.nbHits > 0 && (
            <span className="dialog-search-label-count">
              {` · ${messages.resultsCount(response.nbHits)}`}
            </span>
          )}
        </p>
      </div>
      <ul className="dialog-search-results">
        {hits.length === 0 ? (
          <li className="dialog-search-empty" role="status">
            {messages.noResults}
          </li>
        ) : (
          hits.map((hit, index) => (
            <DialogSearchProductCard
              key={hit.objectID}
              controller={controller}
              hit={hit}
              index={index}
              locale={locale}
              query={state.query}
            />
          ))
        )}
      </ul>
      {!hasSeeAll && (
        <DialogSearchPagination
          controller={controller}
          state={state}
          locale={locale}
        />
      )}
    </section>
  );
};
