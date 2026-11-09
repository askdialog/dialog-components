import { describe, expect, it } from "vitest";
import { createSearchURL, parseSearchURL } from "../search/routeUrl";

const at = (url: string): Location =>
  new URL(url, "https://shop.test") as unknown as Location;

const parse = (url: string): ReturnType<typeof parseSearchURL> =>
  parseSearchURL({ location: at(url) });

describe("parseSearchURL", () => {
  it("reads the query, the 1-indexed page, each filter value and the price", () => {
    expect(
      parse(
        "/search?q=+chemise+&page=3&f.color=Rouge&f.color=Bleu&f.color=Rouge&f.size=M&price=10.5:50",
      ),
    ).toEqual({
      query: "chemise",
      page: 2,
      refinementList: { color: ["Rouge", "Bleu"], size: ["M"] },
      range: { price: "10.5:50" },
    });
  });

  it("starts on the first page without a query or a valid page", () => {
    for (const page of ["", "1", "0", "-2", "2.5", "two"]) {
      expect(parse(`/search?page=${page}`)).toMatchObject({
        query: "",
        page: 0,
      });
    }
  });

  it("keeps an open price bound", () => {
    expect(parse("/search?price=:40").range).toEqual({ price: ":40" });
    expect(parse("/search?price=10:").range).toEqual({ price: "10:" });
  });

  it("ignores a malformed price, empty filter values and empty attributes", () => {
    for (const price of ["abc", "10", ":", "50:10", "-5:10", "10:20:30"]) {
      expect(parse(`/search?price=${price}`).range).toBeUndefined();
    }
    expect(parse("/search?f.color=&f.=Rouge").refinementList).toBeUndefined();
  });
});

describe("createSearchURL", () => {
  const location = at(
    "/search?type=product&q=old&page=4&f.color=Vert&price=1:2#grid",
  );

  it("writes the state over its own params, keeping the others and the hash", () => {
    expect(
      createSearchURL({
        routeState: {
          query: "chemise bleue",
          page: 1,
          refinementList: { color: ["Rouge", "Bleu"], size: [] },
          range: { price: "10:" },
        },
        location,
      }),
    ).toBe(
      "/search?type=product&q=chemise+bleue&page=2&f.color=Rouge&f.color=Bleu&price=10%3A#grid",
    );
  });

  it("drops the page on the first page, an empty query and absent refinements", () => {
    expect(
      createSearchURL({ routeState: { query: "", page: 0 }, location }),
    ).toBe("/search?type=product#grid");
  });

  it("reads back what it writes", () => {
    const routeState = {
      query: "a&b=c",
      page: 3,
      refinementList: { "f.x": ["1 & 2"] },
      range: { price: "5:15" as const },
    };
    const url = createSearchURL({ routeState, location: at("/search") });

    expect(parse(url)).toEqual(routeState);
  });
});
