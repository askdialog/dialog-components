// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { SearchProductHit } from "../types/search";
import {
  hitImage,
  hitTitle,
  navigableCollections,
  safeHref,
} from "../utils/searchDisplay";

const product = (hit: Partial<SearchProductHit>): SearchProductHit => ({
  objectID: "1",
  id: 1,
  tags: [],
  options: {},
  option_names: [],
  inventory_available: true,
  _display: {},
  ...hit,
});

describe("hitImage", () => {
  it("takes `_display.image`, never the record's images", () => {
    const record = { product_image: "p.jpg", image: "v.jpg" };
    expect(hitImage(product({ ...record, _display: { image: "d.jpg" } }))).toBe(
      "d.jpg",
    );
    expect(hitImage(product({ ...record, _display: {} }))).toBeUndefined();
    expect(hitImage(product({ _display: { image: "" } }))).toBeUndefined();
  });
});

describe("safeHref", () => {
  it("keeps http and https links, relative ones included", () => {
    expect(safeHref("https://shop.test/p")).toBe("https://shop.test/p");
    expect(safeHref("http://shop.test/p")).toBe("http://shop.test/p");
    expect(safeHref("/products/p")).toBe("/products/p");
  });

  it("drops other protocols and empty links", () => {
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHref("data:text/html,x")).toBeUndefined();
    expect(safeHref("")).toBeUndefined();
    expect(safeHref(undefined)).toBeUndefined();
  });
});

describe("hitTitle", () => {
  it("falls back from the title to the handle, then the id", () => {
    const page = { objectID: "1", _display: {} };
    expect(hitTitle({ ...page, title: "Bag", handle: "bag" })).toBe("Bag");
    expect(hitTitle({ ...page, handle: "bag" })).toBe("bag");
    expect(hitTitle(page)).toBe("1");
  });
});

describe("navigableCollections", () => {
  it("keeps only collections with a safe link", () => {
    const linked = { objectID: "1", url: "/collections/bags", _display: {} };
    const unsafe = { objectID: "2", url: "javascript:void(0)", _display: {} };
    const unlinked = { objectID: "3", _display: {} };

    expect(navigableCollections([linked, unsafe, unlinked])).toEqual([
      { collection: linked, href: "/collections/bags" },
    ]);
    expect(navigableCollections(undefined)).toEqual([]);
  });
});
