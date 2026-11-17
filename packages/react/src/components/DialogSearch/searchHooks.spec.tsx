// @vitest-environment jsdom
import { createSearchController } from "@askdialog/dialog-sdk";
import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { useRefinementList, useSearchBox } from "./searchHooks";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

it("keeps actions live in StrictMode, switches attributes, and binds drafts", async () => {
  const controller = createSearchController({
    language: "en",
    country: "US",
    config: {
      searchConfig: {
        filterableAttributes: [
          { key: "color", label: "Color", type: "keyword", values: ["Blue"] },
          { key: "size", label: "Size", type: "keyword", values: ["M"] },
        ],
      },
    },
    transport: () => new Promise(() => {}),
    analytics: {
      surface: "search_page",
      trackViewSearchResults() {},
      trackSelectSearchResult() {},
    },
  });
  const draft = controller.createDraft();
  let colors!: ReturnType<typeof useRefinementList>;
  let box!: ReturnType<typeof useSearchBox>;
  const Probe = ({ attribute }: { attribute: string }) => {
    colors = useRefinementList(draft, { attribute });
    box = useSearchBox(controller);
    return (
      <span>
        {colors[0].label}:{box[0].query}
      </span>
    );
  };
  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () =>
    root.render(
      <StrictMode>
        <Probe attribute="color" />
      </StrictMode>,
    ),
  );
  act(() => colors[1].refine("Blue"));
  expect(colors[0].items[0].isRefined).toBe(true);
  expect(
    controller.getSnapshot().searchState.products_en_us.refinementList,
  ).toBeUndefined();
  act(() => box[1].refine("shoes"));
  expect(container.textContent).toBe("Color:shoes");
  await act(async () =>
    root.render(
      <StrictMode>
        <Probe attribute="size" />
      </StrictMode>,
    ),
  );
  expect(colors[0].attribute).toBe("size");
  act(() => colors[1].refine("M"));
  expect(colors[0].items[0].isRefined).toBe(true);
  act(() => draft.commit());
  expect(
    controller.getSnapshot().searchState.products_en_us.refinementList,
  ).toEqual({ color: ["Blue"], size: ["M"] });
  act(() => root.unmount());
  const snapshot = controller.getSnapshot();
  box[1].refine("after unmount");
  expect(controller.getSnapshot()).toBe(snapshot);
  controller.dispose();
});
