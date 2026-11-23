import {
  resolveSearchPanelVariables,
  searchIndexName,
  type AiOverviewParams,
  type SearchController,
  type Theme,
} from "@askdialog/dialog-sdk";
import { useAiOverview, useSearchBox } from "./searchHooks";
import "./DialogSearchControls.css";

export const DialogSearchAiOverview = ({
  controller,
  theme,
  label = "AI overview",
  errorLabel = "AI overview could not be loaded.",
  ...params
}: AiOverviewParams & {
  controller: SearchController;
  theme?: Theme;
  label?: string;
  errorLabel?: string;
}) => {
  const [state, connector] = useAiOverview(controller, params);
  const [box] = useSearchBox(controller);
  const texts = controller.getSnapshot().context.texts;
  const retry = () => {
    const { searchState, context } = controller.getSnapshot();
    const index = searchIndexName(
      "products",
      context.language,
      context.country,
    );
    if ((searchState[index].page ?? 0) === 0) controller.search();
    else
      controller.setSearchState({
        ...searchState,
        [index]: { ...searchState[index], page: 0 },
      });
  };
  if (state.status === "idle") return null;
  return (
    <section
      className="dialog-search-controls"
      style={resolveSearchPanelVariables(theme)}
      aria-label={label}
      aria-busy={state.status === "loading"}
    >
      {state.status === "loading" && (
        <p role="status">{texts.searching(box.query)}</p>
      )}
      {state.status === "error" && (
        <div>
          <p role="alert">{errorLabel}</p>
          <button type="button" onClick={retry}>
            {texts.retry}
          </button>
        </div>
      )}
      {state.status === "success" && (
        <>
          {box.status === "empty" && <p role="status">{texts.noResults}</p>}
          <p>{state.text}</p>
          <ul>
            {state.suggestions.map((item, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => connector.applySuggestion(item)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
};
