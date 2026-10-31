import { type FC, type MouseEvent, useEffect, useRef } from "react";
import {
  connectHits,
  type HitsConnector,
  type ProductHit,
  type SearchController,
  type SearchProductHit,
} from "@askdialog/dialog-sdk";
import { HighlightedTitle } from "./HighlightedTitle";
import { useConnector } from "./useConnector";
import "./DialogSearchProductCard.css";

interface ProductCardViewProps {
  /** `hits[index]` of the hits connector. */
  entry: ProductHit;
  index: number;
  tracking: Pick<HitsConnector, "observe" | "select">;
}

export const ProductCardView: FC<ProductCardViewProps> = ({
  entry,
  index,
  tracking,
}) => {
  const cardRef = useRef<HTMLLIElement>(null);

  // Reobserve each response even when the framework reuses the DOM node.
  useEffect(() => {
    if (cardRef.current !== null) {
      tracking.observe(cardRef.current, index);
    }
  }, [tracking, entry, index]);

  // Preserve native modified clicks. Prevent default navigation only when the
  // adapter handles the click; record selection in both cases.
  const handleClick = (event: MouseEvent): void => {
    const opensNatively =
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (tracking.select(index, { navigate: !opensNatively })) {
      event.preventDefault();
    }
  };

  // Track middle-clicks without the navigation adapter; ignore right-clicks.
  const handleAuxClick = (event: MouseEvent): void => {
    if (event.button === 1) {
      tracking.select(index, { navigate: false });
    }
  };

  const { href, image, titleParts, price, compareAtPrice } = entry.display;

  const content = (
    <>
      {image !== undefined && (
        <span
          className={`dialog-search-product-thumb dialog-search-thumb--${image.shape}`}
          aria-hidden
        >
          <img src={image.url} alt="" loading="lazy" />
        </span>
      )}
      <span className="dialog-search-product-title">
        <HighlightedTitle parts={titleParts} />
      </span>
      {price !== "" && (
        <span className="dialog-search-product-price">
          {compareAtPrice !== "" && (
            <s className="dialog-search-product-compare-at">{compareAtPrice}</s>
          )}
          {price}
        </span>
      )}
    </>
  );

  // Without an image, the title takes the thumbnail's column.
  const className = `dialog-search-product${image === undefined ? " dialog-search-product--no-image" : ""}`;

  return (
    <li ref={cardRef} className="dialog-search-card">
      {href === undefined ? (
        <div className={className}>{content}</div>
      ) : (
        <a
          className={className}
          href={href}
          onClick={handleClick}
          onAuxClick={handleAuxClick}
        >
          {content}
        </a>
      )}
    </li>
  );
};

interface DialogSearchProductCardProps {
  controller: SearchController;
  /** `state.results.products.hits[index]`. */
  hit: SearchProductHit;
  index: number;
}

/** A product card for custom layouts, displayed by the hits connector. */
export const DialogSearchProductCard: FC<DialogSearchProductCardProps> = ({
  controller,
  hit,
  index,
}) => {
  const [{ hits }, connector] = useConnector(connectHits, controller);
  const entry = hits.at(index);

  // Only a hit of the shown results can be displayed and tracked.
  return entry?.hit.objectID === hit.objectID ? (
    <ProductCardView entry={entry} index={index} tracking={connector} />
  ) : null;
};
