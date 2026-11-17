import {
  formatSearchPrice,
  resolveSearchPanelVariables,
  safeHref,
  type InfiniteHit,
  type SearchController,
  type Theme,
} from "@askdialog/dialog-sdk";
import type { ReactNode } from "react";
import { useInfiniteHits, useSearchBox } from "./searchHooks";
import "./DialogSearchControls.css";

export const DialogSearchInfiniteHits = ({
  controller,
  theme,
  renderHit,
  errorLabel = "Search could not be loaded.",
}: {
  controller: SearchController;
  theme?: Theme;
  errorLabel?: string;
  renderHit?: (entry: InfiniteHit, index: number) => ReactNode;
}) => {
  const [state, connector] = useInfiniteHits(controller);
  const [box] = useSearchBox(controller);
  const { texts, language } = controller.getSnapshot().context;
  return (
    <section
      className="dialog-search-controls"
      style={resolveSearchPanelVariables(theme)}
      aria-label={texts.productsLabel}
      aria-busy={box.status === "loading"}
    >
      <ul className="dialog-search-infinite-list">
        {state.hits.map((entry, index) => {
          const { hit, display } = entry;
          const href = display === undefined ? safeHref(hit.url) : display.href;
          const title = display?.title ?? hit.title ?? "";
          const image =
            display?.image?.url ??
            (display === undefined
              ? safeHref(hit.product_image ?? hit.image)
              : undefined);
          const body = (
            <>
              {image && <img src={image} alt="" loading="lazy" />}
              <span>{title}</span>
              <span>{display?.price ?? formatSearchPrice(hit, language)}</span>
            </>
          );
          return (
            <li key={`${hit.objectID}-${index}`}>
              {renderHit ? (
                renderHit(entry, index)
              ) : href ? (
                <a href={href}>{body}</a>
              ) : (
                <span>{body}</span>
              )}
            </li>
          );
        })}
      </ul>
      {box.status === "loading" && (
        <p role="status">{texts.searching(box.query)}</p>
      )}
      {box.status === "empty" && <p role="status">{texts.noResults}</p>}
      {box.status === "error" ? (
        <div>
          <p role="alert">{errorLabel}</p>
          <button
            type="button"
            onClick={() =>
              state.failedMore ? connector.retryMore() : controller.retry()
            }
          >
            {texts.retry}
          </button>
        </div>
      ) : (
        !state.isLastPage && (
          <button
            type="button"
            disabled={state.loadingMore}
            onClick={() => connector.showMore()}
          >
            {texts.seeMore(
              Math.max(0, (state.nbHits ?? 0) - state.hits.length),
            )}
          </button>
        )
      )}
    </section>
  );
};
