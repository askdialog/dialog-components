// @vitest-environment jsdom
import { createSearchController } from "@askdialog/dialog-sdk";
import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { useRefinementList, useSearchBox, useAiOverview } from "./searchHooks";

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

it("does not restart AI overview requests when an inline transport changes on render", async () => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  const transport = vi.fn<import("@askdialog/dialog-sdk").AiOverviewTransport>(
    async () => ({ text: "Matches", suggestions: [], attributeLabels: {} }),
  );
  const controller = createSearchController({
    language: "en",
    country: "US",
    mode: "ai",
    config: {},
    analytics: {
      surface: "ai_bar",
      trackViewSearchResults() {},
      trackSelectSearchResult() {},
    },
    transport: async () => ({
      results: [
        {
          index: "products_en_us",
          query: "shoes",
          page: 0,
          hits: [],
          nbHits: 0,
          nbPages: 0,
          hitsPerPage: 12,
          processingTimeMS: 1,
          queryID: "q",
        },
      ],
    }),
    initialSearchState: { products_en_us: { query: "shoes" } },
  });
  const Probe = () => {
    const [state] = useAiOverview(controller, {
      transport: (request, options) => transport(request, options),
    });
    return <span>{state.text}</span>;
  };
  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () => {
    root.render(<Probe />);
  });
  await act(async () => {
    controller.search();
  });
  expect(container.textContent).toBe("Matches");
  expect(transport).toHaveBeenCalledTimes(1);
  await act(async () => {
    root.render(<Probe />);
  });
  expect(transport).toHaveBeenCalledTimes(1);
  act(() => root.unmount());
  controller.dispose();
  vi.unstubAllGlobals();
});
