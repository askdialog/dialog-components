import { describe, expect, it } from "vitest";
import { splitTitleMatch } from "../utils/titleHighlight";

describe("splitTitleMatch", () => {
  it("matches regardless of case and diacritics, keeping the title's characters", () => {
    expect(splitTitleMatch("Crème brûlée", "creme")).toEqual({
      before: "",
      match: "Crème",
      after: " brûlée",
    });
    expect(splitTitleMatch("Sac BRÛLÉ", " brule ")).toEqual({
      before: "Sac ",
      match: "BRÛLÉ",
      after: "",
    });
  });

  it("maps characters whose folded form is longer", () => {
    expect(splitTitleMatch("Große Tasche", "grosse")).toEqual({
      before: "",
      match: "Große",
      after: " Tasche",
    });
    expect(splitTitleMatch("ΟΔΟΣ", "οδος")).toEqual({
      before: "",
      match: "ΟΔΟΣ",
      after: "",
    });
  });

  it("highlights nothing on an empty or unmatched query", () => {
    const whole = { before: "", match: "Bag", after: "" };
    expect(splitTitleMatch("Bag", "  ")).toEqual(whole);
    expect(splitTitleMatch("Bag", "shoe")).toEqual(whole);
  });
});
