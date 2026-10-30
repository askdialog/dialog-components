// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { SearchCollectionHit, SearchProductHit } from "../types/search";
import {
  hitHref,
  hitImage,
  hitTitle,
  navigableCollections,
  resolveDisplayUrl,
  safeHref,
} from "../utils/searchDisplay";

const product = (hit: Partial<SearchProductHit>): SearchProductHit => ({
  objectID: "1",
  id: 1,
  tags: [],
  options: {},
  option_names: [],
  inventory_available: true,
  _display: { title: "Bag", url: "products/bag", price: "", lines: [] },
  ...hit,
});

const collection = (objectID: string, url: string): SearchCollectionHit => ({
  objectID,
  _display: { title: objectID, url },
});

describe("hitImage", () => {
  it("takes `_display.image` with its shape, never the record's images", () => {
    const record = { product_image: "p.jpg", image: "v.jpg" };
    const display = product({})._display;
    expect(
      hitImage(
        product({
          ...record,
          _display: { ...display, image: { url: "d.jpg", shape: "square" } },
        }),
      ),
    ).toEqual({ url: "d.jpg", shape: "square" });
    expect(hitImage(product(record))).toBeUndefined();
    expect(
      hitImage(
        product({
          _display: { ...display, image: { url: "", shape: "theme" } },
        }),
      ),
    ).toBeUndefined();
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

describe("resolveDisplayUrl", () => {
  const { origin } = window.location;

  it("resolves a relative url under the storefront root, `/` by default", () => {
    expect(resolveDisplayUrl("products/creme-lift", "/fr-fr/")).toBe(
      `${origin}/fr-fr/products/creme-lift`,
    );
    expect(resolveDisplayUrl("blogs/conseils/guide")).toBe(
      `${origin}/blogs/conseils/guide`,
    );
  });

  it("keeps an absolute or root-relative HTTP(S) url as sent", () => {
    expect(resolveDisplayUrl("https://shop.test/p", "/fr-fr/")).toBe(
      "https://shop.test/p",
    );
    expect(resolveDisplayUrl("/pages/livraison", "/fr-fr/")).toBe(
      "/pages/livraison",
    );
  });

  it("leaves an unsafe or off-origin url without a link", () => {
    expect(resolveDisplayUrl("javascript:alert(1)")).toBeUndefined();
    expect(resolveDisplayUrl("\\\\evil.test/x")).toBeUndefined();
    expect(resolveDisplayUrl("")).toBeUndefined();
  });
});

describe("hitTitle and hitHref", () => {
  it("read `_display`, never the record", () => {
    const hit = product({ title: "Raw", url: "/raw" });
    expect(hitTitle(hit)).toBe("Bag");
    expect(hitHref(hit, "/fr-fr/")).toBe(
      `${window.location.origin}/fr-fr/products/bag`,
    );
  });
});

describe("navigableCollections", () => {
  it("keeps only collections with a safe link", () => {
    const linked = collection("1", "collections/bags");
    const unsafe = collection("2", "javascript:void(0)");

    expect(navigableCollections([linked, unsafe], "/fr-fr/")).toEqual([
      {
        collection: linked,
        href: `${window.location.origin}/fr-fr/collections/bags`,
      },
    ]);
    expect(navigableCollections(undefined)).toEqual([]);
  });
});
