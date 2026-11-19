import { useEffect, useState } from "react";
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

const isInvalidNumber = (value: string) =>
  value.trim() !== "" &&
  !Number.isFinite(Number(value.trim().replace(",", ".")));

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
  invalidLabel = "Enter a valid number.",
}: FilterProps & {
  attribute?: string;
  label?: string;
  invalidLabel?: string;
}) => {
  const [state, connector] = useRange(controller, { attribute });
  const [fields, setFields] = useState({ min: state.min, max: state.max });
  useEffect(() => {
    let searchState = controller.getSnapshot().searchState;
    const syncFields = () => {
      const { min, max } = connector.getRenderState();
      setFields({ min, max });
    };
    syncFields();
    return controller.subscribe(() => {
      const current = controller.getSnapshot().searchState;
      if (current === searchState) return;
      searchState = current;
      syncFields();
    });
  }, [controller, connector]);
  const refine = (min: string, max: string) => {
    setFields({ min, max });
    if (!isInvalidNumber(min) && !isInvalidNumber(max))
      connector.refine(min, max);
  };
  const invalidMin = isInvalidNumber(fields.min);
  const invalidMax = isInvalidNumber(fields.max);
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
            inputMode="decimal"
            value={fields.min}
            placeholder={state.bounds?.min.toString()}
            aria-invalid={state.minAboveMax || invalidMin}
            onChange={(event) => refine(event.target.value, fields.max)}
          />
        </label>
        <label>
          {texts.priceMax}
          <input
            inputMode="decimal"
            value={fields.max}
            placeholder={state.bounds?.max.toString()}
            aria-invalid={state.minAboveMax || invalidMax}
            onChange={(event) => refine(fields.min, event.target.value)}
          />
        </label>
      </div>
      {(invalidMin || invalidMax || state.minAboveMax) && (
        <p role="alert">
          {invalidMin || invalidMax ? invalidLabel : texts.priceMinAboveMax}
        </p>
      )}
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
