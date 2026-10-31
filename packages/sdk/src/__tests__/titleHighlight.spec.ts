import { describe, expect, it } from "vitest";
import { highlightedTitleParts } from "../utils/titleHighlight";

const highlight = (value: string, matchLevel: "none" | "partial" | "full") => ({
  title: { value, matchLevel, matchedWords: [], fullyHighlighted: false },
});

describe("highlightedTitleParts", () => {
  it("highlights exactly the parts in <em> and unescapes the text", () => {
    expect(
      highlightedTitleParts(
        'Gants <b> & "boxe" l\'été',
        highlight(
          "<em>Gants</em> &lt;b&gt; &amp; &quot;<em>boxe</em>&quot; l&#x27;&#233;t&#xE9;",
          "partial",
        ),
      ),
    ).toEqual([
      { text: "Gants", highlighted: true },
      { text: ' <b> & "', highlighted: false },
      { text: "boxe", highlighted: true },
      { text: "\" l'été", highlighted: false },
    ]);
  });

  it("keeps the plain title without a match", () => {
    const plain = [{ text: "Gants & boxe", highlighted: false }];
    expect(highlightedTitleParts("Gants & boxe", undefined)).toEqual(plain);
    expect(
      highlightedTitleParts(
        "Gants & boxe",
        highlight("Gants &amp; boxe", "none"),
      ),
    ).toEqual(plain);
  });
});
