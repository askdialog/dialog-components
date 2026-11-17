import {
  resolveSearchPanelVariables,
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
  ...params
}: AiOverviewParams & {
  controller: SearchController;
  theme?: Theme;
  label?: string;
}) => {
  const [state, connector] = useAiOverview(controller, params);
  const [box] = useSearchBox(controller);
  const texts = controller.getSnapshot().context.texts;
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
        <button type="button" onClick={() => controller.search()}>
          {texts.retry}
        </button>
      )}
      {state.status === "success" && (
        <>
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
