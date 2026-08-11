import { type FC, type MouseEvent, useEffect, useRef } from "react";
import type { SearchController, SearchHit } from "@askdialog/dialog-sdk";
import { formatSearchPrice, safeProductHref } from "./searchDisplay";
import "./DialogSearchProductCard.css";

interface DialogSearchProductCardProps {
  controller: SearchController;
  hit: SearchHit;
  index: number;
}

export const DialogSearchProductCard: FC<DialogSearchProductCardProps> = ({
  controller,
  hit,
  index,
}) => {
  const cardRef = useRef<HTMLLIElement>(null);

  // Depends on `hit` (fresh object per response) so a new response
  // re-observes the element even when React reuses the DOM node.
  useEffect(() => {
    if (cardRef.current !== null) {
      controller.observeResult(cardRef.current, index);
    }
  }, [controller, hit, index]);

  // No preventDefault: attribution is recorded first and the events are
  // designed to survive the same-tab navigation.
  const handleClick = (): void => {
    controller.selectResult(index);
  };

  // auxclick also fires on right-click; only the middle button navigates.
  const handleAuxClick = (event: MouseEvent): void => {
    if (event.button === 1) {
      controller.selectResult(index);
    }
  };

  const { product } = hit;
  const title = product.title ?? product.id;
  const price = formatSearchPrice(product.priceRange);
  const href =
    product.url === undefined ? undefined : safeProductHref(product.url);

  const content = (
    <>
      <div className="dialog-search-card-image">
        {product.imageUrl !== undefined && (
          <img src={product.imageUrl} alt={title} loading="lazy" />
        )}
      </div>
      <div className="dialog-search-card-info">
        <p className="dialog-search-card-title">{title}</p>
        {price !== "" && <p className="dialog-search-card-price">{price}</p>}
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
