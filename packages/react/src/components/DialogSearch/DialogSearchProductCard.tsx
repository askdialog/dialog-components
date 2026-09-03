import { type FC, type MouseEvent, useEffect, useRef } from "react";
import type { SearchController, SearchHit } from "@askdialog/dialog-sdk";
import {
  formatSearchCompareAtPrice,
  formatSearchPrice,
  safeProductHref,
} from "./searchDisplay";
import "./DialogSearchProductCard.css";

interface DialogSearchProductCardProps {
  controller: SearchController;
  hit: SearchHit;
  index: number;
  locale?: string;
}

export const DialogSearchProductCard: FC<DialogSearchProductCardProps> = ({
  controller,
  hit,
  index,
  locale,
}) => {
  const cardRef = useRef<HTMLLIElement>(null);

  // Depends on `hit` (fresh object per response) so a new response
  // re-observes the element even when React reuses the DOM node.
  useEffect(() => {
    if (cardRef.current !== null) {
      controller.observeResult(cardRef.current, index);
    }
  }, [controller, hit, index]);

  // A modified click (cmd/ctrl/shift/alt) means "open in a new tab/window":
  // the SPA adapter can't do that, so record the selection but let the browser
  // navigate natively. For a plain click, when the adapter handles the
  // in-app transition, suppress the anchor's native navigation so the click
  // doesn't also trigger a full-page load. Without an adapter, selectResult
  // returns false and the native same-tab navigation proceeds (attribution is
  // designed to survive it).
  const handleClick = (event: MouseEvent): void => {
    const opensNatively =
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (controller.selectResult(index, { navigate: !opensNatively })) {
      event.preventDefault();
    }
  };

  // auxclick also fires on right-click; only the middle button opens a tab.
  // It always opens natively (new tab), so record attribution without running
  // the in-app adapter.
  const handleAuxClick = (event: MouseEvent): void => {
    if (event.button === 1) {
      controller.selectResult(index, { navigate: false });
    }
  };

  const title = hit.title ?? hit.objectID;
  const price = formatSearchPrice(hit.priceRange, locale);
  const compareAtPrice = formatSearchCompareAtPrice(hit, locale);
  const href = hit.url === undefined ? undefined : safeProductHref(hit.url);

  const content = (
    <>
      <div className="dialog-search-card-image">
        {hit.imageUrl !== undefined && (
          <img src={hit.imageUrl} alt={title} loading="lazy" />
        )}
      </div>
      <div className="dialog-search-card-info">
        <p className="dialog-search-card-title">{title}</p>
        {price !== "" && (
          <p className="dialog-search-card-price">
            {price}
            {compareAtPrice !== "" && (
              <s className="dialog-search-card-compare-at"> {compareAtPrice}</s>
            )}
          </p>
        )}
      </div>
    </>
  );

  return (
    <li ref={cardRef} className="dialog-search-card">
      {href === undefined ? (
        <div className="dialog-search-card-body">{content}</div>
      ) : (
        <a
          className="dialog-search-card-body"
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
