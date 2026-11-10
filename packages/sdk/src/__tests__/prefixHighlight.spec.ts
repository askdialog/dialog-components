import { describe, expect, it } from "vitest";
import { highlightedPrefixParts } from "../utils/prefixHighlight";

describe("highlightedPrefixParts", () => {
  it("keeps a combining accent with the matched letter it sits on", () => {
    const decomposed = "crème";

    expect(highlightedPrefixParts(decomposed, "cre")).toEqual([
      { text: "crè", highlighted: true },
      { text: "me", highlighted: false },
    ]);
  });

  it("matches a decomposed typed text against a composed suggestion", () => {
    expect(highlightedPrefixParts("élan", "él")).toEqual([
      { text: "él", highlighted: true },
      { text: "an", highlighted: false },
    ]);
  });

  it("highlights nothing when the text does not start with the typed one", () => {
    expect(highlightedPrefixParts("savon", "crème")).toEqual([
      { text: "savon", highlighted: false },
    ]);
    expect(highlightedPrefixParts("sa", "savon")).toEqual([
      { text: "sa", highlighted: false },
    ]);
  });
});
