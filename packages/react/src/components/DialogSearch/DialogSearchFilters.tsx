import {
  resolveSearchPanelVariables,
  type SearchController,
  type Theme,
} from "@askdialog/dialog-sdk";
import {
  useRefinementList,
  useRange,
  useCurrentRefinements,
  useClearRefinements,
} from "./searchHooks";
import "./DialogSearchControls.css";

interface FilterProps {
  controller: SearchController;
  theme?: Theme;
}

export const DialogSearchRefinementList = ({
  controller,
  attribute,
  limit,
  theme,
}: FilterProps & { attribute: string; limit?: number }) => {
  const [state, connector] = useRefinementList(controller, {
    attribute,
    limit,
  });
  const texts = controller.getSnapshot().context.texts;
  return (
    <fieldset
      className="dialog-search-controls"
      style={resolveSearchPanelVariables(theme)}
    >
      <legend>{state.label}</legend>
      <ul>
        {state.items.map((item) => (
          <li key={item.value}>
            <label>
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => connector.refine(item.value)}
              />
              {item.value}
              {item.count === undefined ? "" : ` (${item.count})`}
            </label>
          </li>
        ))}
      </ul>
      {state.canToggleShowMore && (
        <button type="button" onClick={() => connector.toggleShowMore()}>
          {state.isShowingMore
            ? texts.seeLess
            : texts.seeMore(state.foldedCount)}
        </button>
      )}
    </fieldset>
  );
};

export const DialogSearchRange = ({
  controller,
  attribute = "price",
  theme,
  label,
}: FilterProps & { attribute?: string; label?: string }) => {
  const [state, connector] = useRange(controller, { attribute });
  const texts = controller.getSnapshot().context.texts;
  return (
    <fieldset
      className="dialog-search-controls"
      style={resolveSearchPanelVariables(theme)}
    >
      <legend>
        {label ??
          (attribute === "price" ? texts.filterFields.price : attribute)}
      </legend>
      <div className="dialog-search-range-fields">
        <label>
          {texts.priceMin}
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={state.min}
            placeholder={state.bounds?.min.toString()}
            aria-invalid={state.minAboveMax}
            onChange={(event) =>
              connector.refine(event.target.value, state.max)
            }
          />
        </label>
        <label>
          {texts.priceMax}
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={state.max}
            placeholder={state.bounds?.max.toString()}
            aria-invalid={state.minAboveMax}
            onChange={(event) =>
              connector.refine(state.min, event.target.value)
            }
          />
        </label>
      </div>
      {state.minAboveMax && <p role="alert">{texts.priceMinAboveMax}</p>}
    </fieldset>
  );
};

export const DialogSearchCurrentRefinements = ({
  controller,
  theme,
}: FilterProps) => {
  const [state, connector] = useCurrentRefinements(controller);
  const [clear, clearConnector] = useClearRefinements(controller);
  if (state.items.length === 0 && !clear.canRefine) return null;
  const texts = controller.getSnapshot().context.texts;
  return (
    <section
      className="dialog-search-controls"
      style={resolveSearchPanelVariables(theme)}
      aria-label={texts.appliedFiltersLabel}
    >
      <ul>
        {state.items.map((item, index) => (
          <li key={index}>
            {item.removable ? (
              <button
                type="button"
                aria-label={texts.removeFilter(item.text)}
                onClick={() => connector.remove(item)}
              >
                {item.text} ×
              </button>
            ) : (
              <span>{item.text}</span>
            )}
          </li>
        ))}
      </ul>
      {clear.canRefine && (
        <button type="button" onClick={() => clearConnector.refine()}>
          {texts.clearAll}
        </button>
      )}
    </section>
  );
};
