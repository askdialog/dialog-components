import { type FC, type MouseEvent, useEffect, useRef } from "react";
import {
  connectHits,
  formatSearchCompareAtPrice,
  formatSearchPrice,
  splitTitleMatch,
  type HitsConnector,
  type ProductHit,
  type ProductHitDisplay,
  type SearchController,
  type SearchProductHit,
} from "@askdialog/dialog-sdk/search";
import { HighlightedTitle } from "./HighlightedTitle";
import { useConnector } from "./useConnector";
import "./DialogSearchProductCard.css";

/** The connector's display, its prices formatted in `locale` when given. */
const localizedDisplay = (
  { hit, display }: ProductHit,
  locale: string | undefined,
  query: string | undefined,
): ProductHitDisplay => ({
  ...display,
  ...(locale !== undefined && {
    price: formatSearchPrice(hit, locale),
    compareAtPrice: formatSearchCompareAtPrice(hit, locale),
  }),
  ...(query !== undefined && {
    titleParts: splitTitleMatch(display.title, query),
  }),
});

interface ProductCardViewProps {
  /** `hits[index]` of the hits connector. */
  entry: ProductHit;
  index: number;
  tracking: Pick<HitsConnector, "observe" | "select">;
  locale: string | undefined;
  /** Query emphasized inside the title; the answered query when omitted. */
  query?: string;
}

export const ProductCardView: FC<ProductCardViewProps> = ({
  entry,
  index,
  tracking,
  locale,
  query,
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

  const { href, image, titleParts, price, compareAtPrice } = localizedDisplay(
    entry,
    locale,
    query,
  );

  const content = (
    <>
      <span className="dialog-search-product-thumb" aria-hidden>
        {image !== undefined && <img src={image} alt="" loading="lazy" />}
      </span>
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

  return (
    <li ref={cardRef} className="dialog-search-card">
      {href === undefined ? (
        <div className="dialog-search-product">{content}</div>
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

interface DialogSearchProductCardProps {
  controller: SearchController;
  /** `state.results.products.hits[index]`. */
  hit: SearchProductHit;
  index: number;
  locale?: string;
  /** Query emphasized inside the title; the answered query when omitted. */
  query?: string;
}

/** A product card for custom layouts, displayed by the hits connector. */
export const DialogSearchProductCard: FC<DialogSearchProductCardProps> = ({
  controller,
  hit,
  index,
  locale,
  query,
}) => {
  const [{ hits }, connector] = useConnector(connectHits, controller);
  const entry = hits.at(index);

  // Only a hit of the shown results can be displayed and tracked.
  return entry?.hit.objectID === hit.objectID ? (
    <ProductCardView
      entry={entry}
      index={index}
      tracking={connector}
      locale={locale}
      query={query}
    />
  ) : null;
};
