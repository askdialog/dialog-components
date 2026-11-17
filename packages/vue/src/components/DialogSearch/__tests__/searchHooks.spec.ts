// @vitest-environment jsdom
import { createSearchController } from "@askdialog/dialog-sdk";
import { createApp, defineComponent, h } from "vue";
import { expect, it } from "vitest";
import { useRefinementList, useSearchBox } from "../searchHooks";

it("follows connector state, binds drafts and stops on unmount", () => {
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
  const app = createApp(
    defineComponent({
      setup() {
        colors = useRefinementList(draft, { attribute: "color" });
        box = useSearchBox(controller);
        return () => h("span");
      },
    }),
  );
  app.mount(document.createElement("div"));
  colors[1].refine("Blue");
  expect(colors[0].value.items[0].isRefined).toBe(true);
  expect(
    controller.getSnapshot().searchState.products_en_us.refinementList,
  ).toBeUndefined();
  draft.commit();
  expect(
    controller.getSnapshot().searchState.products_en_us.refinementList,
  ).toEqual({ color: ["Blue"] });
  box[1].refine("shoes");
  expect(box[0].value.query).toBe("shoes");
  app.unmount();
  const snapshot = controller.getSnapshot();
  box[1].refine("after unmount");
  expect(controller.getSnapshot()).toBe(snapshot);
  controller.dispose();
});
