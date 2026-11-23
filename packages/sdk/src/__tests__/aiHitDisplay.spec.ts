// @vitest-environment jsdom
import { expect, it } from "vitest";
import { aiHitDisplay } from "../search/aiHitDisplay";
import { SearchController } from "../search/types";

const controller = {
  getSnapshot: () => ({ context: { language: "fr", storefrontRoot: "/" } }),
} as unknown as SearchController;

it("shows the one bound of a price range missing the other", () => {
  const display = aiHitDisplay(controller, {
    objectID: "1",
    priceRange: { max: { amount: "249", currencyCode: "EUR" } },
  });

  expect(display.price).toMatch(/^249,00\s€$/u);
});

it("falls back on the handle when the url is empty", () => {
  const display = aiHitDisplay(controller, {
    objectID: "1",
    url: "",
    handle: "selle-sr2",
  });

  expect(display.href).toBe(`${window.location.origin}/products/selle-sr2`);
});
