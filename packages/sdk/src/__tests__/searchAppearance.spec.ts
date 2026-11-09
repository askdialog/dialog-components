import { describe, expect, it } from "vitest";
import { readSearchConfig } from "../services/searchConfig";
import { SearchAppearance } from "../types/searchAppearance";
import { resolveSearchAppearanceVariables } from "../utils/searchAppearance";

const ATTRIBUTE = {
  key: "color",
  label: "Couleur",
  type: "keyword",
  values: ["Rouge"],
};

describe("readSearchConfig", () => {
  it("drops a malformed attribute or appearance key on its own", () => {
    expect(
      readSearchConfig({
        filterableAttributes: [ATTRIBUTE, { key: "size" }],
        appearance: {
          colors: { accent: "#1a2b3c", text: "red; display: none" },
          radii: { card: 0, input: 1.5, button: "8px" },
          card: { imageRatio: "constructor", showVendor: true },
          filters: { style: "grid" },
          unknown: { key: "value" },
        },
      }),
    ).toEqual({
      filterableAttributes: [ATTRIBUTE],
      appearance: {
        colors: { accent: "#1a2b3c" },
        radii: { card: 0 },
        card: { showVendor: true },
      },
    });
  });

  it("reads an absent or malformed appearance as empty", () => {
    expect(readSearchConfig({ filterableAttributes: [ATTRIBUTE] })).toEqual({
      filterableAttributes: [ATTRIBUTE],
      appearance: {},
    });
    expect(readSearchConfig({ appearance: "pills" })).toEqual({
      filterableAttributes: [],
      appearance: {},
    });
  });
});

describe("resolveSearchAppearanceVariables", () => {
  it("writes one variable per key the merchant set", () => {
    expect(
      resolveSearchAppearanceVariables({
        colors: {
          text: "#111",
          mutedText: "#666666",
          accent: "#1a2b3c",
          buttonText: "#fff",
          surface: "#f8f8fa",
          border: "#ddd",
        },
        radii: { card: 0, button: 4, input: 999 },
        card: {
          imageRatio: "portrait",
          showVendor: true,
          showAddToCart: false,
        },
        filters: { style: "pills" },
      }),
    ).toEqual({
      "--dialog-search-text-color": "#111",
      "--dialog-search-muted-text-color": "#666666",
      "--dialog-search-accent-color": "#1a2b3c",
      "--dialog-search-button-text-color": "#fff",
      "--dialog-search-surface-color": "#f8f8fa",
      "--dialog-search-border-color": "#ddd",
      "--dialog-search-card-radius": "0px",
      "--dialog-search-button-radius": "4px",
      "--dialog-search-input-radius": "999px",
      "--dialog-search-card-image-ratio": "3 / 4",
      "--dialog-search-card-vendor-display": "block",
      "--dialog-search-card-button-display": "none",
      "--dialog-search-filters-style": "pills",
    });
  });

  it("writes nothing for an absent key, so the surface's default applies", () => {
    expect(resolveSearchAppearanceVariables({})).toEqual({});
  });

  it("takes the assistant theme's accent and button text colours when absent", () => {
    const theme = {
      primaryColor: "#ff0000",
      ctaTextColor: " #000000 ",
      backgroundColor: "#000000",
    };

    expect(resolveSearchAppearanceVariables({}, theme)).toEqual({
      "--dialog-search-accent-color": "#ff0000",
      "--dialog-search-button-text-color": "#000000",
    });
    expect(
      resolveSearchAppearanceVariables(
        { colors: { accent: "#00ff00" } },
        { primaryColor: "#ff0000", ctaTextColor: "" },
      ),
    ).toEqual({ "--dialog-search-accent-color": "#00ff00" });
  });

  it("skips a malformed key an untyped caller passes", () => {
    const appearance = {
      colors: { accent: "red; display: none" },
      radii: { card: -1 },
    } as unknown as SearchAppearance;

    expect(resolveSearchAppearanceVariables(appearance)).toEqual({});
  });
});
