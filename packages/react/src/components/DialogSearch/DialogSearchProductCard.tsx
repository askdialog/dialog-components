import { type FC, type MouseEvent, useEffect, useRef } from "react";
import type { SearchController, SearchHit } from "@askdialog/dialog-sdk";
import { HighlightedTitle } from "./HighlightedTitle";
import { formatSearchPrice, hitHref, hitTitle } from "./searchDisplay";
import "./DialogSearchProductCard.css";

interface DialogSearchProductCardProps {
  controller: SearchController;
  hit: SearchHit;
  index: number;
  locale?: string;
  /** Committed query, emphasized inside the title. */
  query?: string;
}

export const DialogSearchProductCard: FC<DialogSearchProductCardProps> = ({
  controller,
  hit,
  index,
  locale,
  query = "",
}) => {
  const cardRef = useRef<HTMLLIElement>(null);

  // Reobserve each response even when the framework reuses the DOM node.
  useEffect(() => {
    if (cardRef.current !== null) {
      controller.observeResult(cardRef.current, index);
    }
  }, [controller, hit, index]);

  // Preserve native modified clicks. Prevent default navigation only when the
  // adapter handles the click; record selection in both cases.
  const handleClick = (event: MouseEvent): void => {
    const opensNatively =
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (controller.selectResult(index, { navigate: !opensNatively })) {
      event.preventDefault();
    }
  };

  // Track middle-clicks without the navigation adapter; ignore right-clicks.
  const handleAuxClick = (event: MouseEvent): void => {
    if (event.button === 1) {
      controller.selectResult(index, { navigate: false });
    }
  };

  const price = formatSearchPrice(hit.priceRange, locale);
  const href = hitHref(hit);

  const content = (
    <>
      <span className="dialog-search-product-thumb" aria-hidden>
        {hit.imageUrl !== undefined && hit.imageUrl !== "" && (
          <img src={hit.imageUrl} alt="" loading="lazy" />
        )}
      </span>
      <span className="dialog-search-product-title">
        <HighlightedTitle title={hitTitle(hit)} query={query} />
      </span>
      {price !== "" && (
        <span className="dialog-search-product-price">{price}</span>
      )}
    </>
  );

  return (
    <li ref={cardRef} className="dialog-search-card">
      {href === undefined ? (
        <div
          className="dialog-search-product"
          onClick={handleClick}
          onAuxClick={handleAuxClick}
        >
          {content}
        </div>
      ) : (
        <a
          className="dialog-search-product"
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
