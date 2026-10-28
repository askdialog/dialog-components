// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { parseCssColor, relativeLuminance } from "../utils/cssColor";
import { resolveSearchPanelVariables } from "../utils/searchTheme";

describe("parseCssColor", () => {
  it("parses hex colours, short and with alpha", () => {
    expect(parseCssColor("#fff")).toEqual([255, 255, 255]);
    expect(parseCssColor("#18182580")).toEqual([24, 24, 37]);
    expect(parseCssColor(" 00ff00 ")).toEqual([0, 255, 0]);
  });

  it("rejects invalid colours", () => {
    expect(parseCssColor("not-a-colour")).toBeUndefined();
    expect(relativeLuminance("#12")).toBeUndefined();
  });
});

describe("relativeLuminance", () => {
  it("follows WCAG's formula", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1);
  });
});

describe("resolveSearchPanelVariables", () => {
  it("defaults to the light, rounded palette with Dialog's primary", () => {
    expect(resolveSearchPanelVariables(undefined)).toEqual({
      "--dso-panel": "#ffffff",
      "--dso-side": "#fafbfc",
      "--dso-text": "#111827",
      "--dso-text-sec": "#6b7280",
      "--dso-border": "#eceef2",
      "--dso-hover": "#eef2f7",
      "--dso-thumb": "#eef1f5",
      "--dso-r-panel": "16px",
      "--dso-r-item": "10px",
      "--dso-r-thumb": "8px",
      "--dso-r-btn": "10px",
      "--dso-primary": "#181825",
      "--dso-accent": "#181825",
      "--dso-cta-text": "#ffffff",
    });
  });

  it("applies the dark palette, straight corners and the merchant's font", () => {
    const variables = resolveSearchPanelVariables({
      backgroundColor: "#101010",
      ctaBorderType: "straight",
      primaryColor: "#ffcc00",
      ctaTextColor: " #000 ",
      fontFamily: "Inter",
    });

    expect(variables).toMatchObject({
      "--dso-panel": "#15171c",
      "--dso-r-panel": "4px",
      "--dso-primary": "#ffcc00",
      "--dso-accent": "#ffcc00",
      "--dso-cta-text": "#000",
      "--dso-font": "Inter",
    });
  });

  it("falls back to the palette's text when the primary does not contrast", () => {
    const variables = resolveSearchPanelVariables({ primaryColor: "#f5f5f5" });

    expect(variables["--dso-accent"]).toBe("#111827");
    expect(variables).not.toHaveProperty("--dso-font");
  });
});
