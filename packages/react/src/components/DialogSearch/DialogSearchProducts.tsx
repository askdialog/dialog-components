import type { FC } from "react";
import {
  connectHits,
  type SearchController,
  type SearchContext,
  type SearchTexts,
} from "@askdialog/dialog-sdk";
import { ProductCardView } from "./DialogSearchProductCard";
import { useConnector } from "./useConnector";

interface DialogSearchProductsProps {
  controller: SearchController;
  context: SearchContext;
  /** Hits of the shown products result. */
  nbHits: number;
  locale: string | undefined;
  texts: SearchTexts;
}

export const DialogSearchProducts: FC<DialogSearchProductsProps> = ({
  controller,
  context,
  nbHits,
  locale,
  texts,
}) => {
  const [{ hits, query, title }, connector] = useConnector(
    connectHits,
    controller,
  );
  // The connector's title is in the search language; a locale has its own.
  const localizedTitle =
    locale === undefined
      ? title
      : query === ""
        ? texts.rankingLabel(context.businessRanking)
        : texts.productsLabel;

  return (
    <section className="dialog-search-products">
      <div className="dialog-search-section-head">
        <p className="dialog-search-label">
          {localizedTitle}
          {nbHits > 0 && (
            <span className="dialog-search-label-count">
              {` · ${texts.resultsCount(nbHits)}`}
            </span>
          )}
        </p>
      </div>
      <ul className="dialog-search-results">
        {hits.length === 0 ? (
          <li className="dialog-search-empty" role="status">
            {texts.noResults}
          </li>
        ) : (
          hits.map((entry, index) => (
            <ProductCardView
              key={entry.hit.objectID}
              entry={entry}
              index={index}
              tracking={connector}
              locale={locale}
            />
          ))
        )}
      </ul>
    </section>
  );
};
