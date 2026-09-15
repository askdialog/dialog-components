import type { Theme } from "@askdialog/dialog-sdk";
import { relativeLuminance } from "./cssColor";

type PanelMode = "light" | "dark";
type PanelShape = "rectangle" | "rectangle-rounded";

const DEFAULT_PRIMARY_COLOR = "#181825";
const DEFAULT_CTA_TEXT_COLOR = "#ffffff";
const STRAIGHT_BORDER_TYPE = "straight";
// Relative luminance of the theme background below which the dark palette applies.
const DARK_LUMINANCE_THRESHOLD = 0.5;

const PALETTES: Record<PanelMode, Record<string, string>> = {
  light: {
    panel: "#ffffff",
    side: "#fafbfc",
    text: "#111827",
    "text-sec": "#6b7280",
    border: "#eceef2",
    hover: "#eef2f7",
    thumb: "#eef1f5",
  },
  dark: {
    panel: "#15171c",
    side: "#1b1e25",
    text: "#f3f4f6",
    "text-sec": "#9ca3af",
    border: "#2b2f38",
    hover: "#242830",
    thumb: "#2b2f38",
  },
};

const RADII: Record<PanelShape, Record<string, string>> = {
  rectangle: {
    "r-panel": "4px",
    "r-item": "4px",
    "r-thumb": "2px",
    "r-btn": "4px",
  },
  "rectangle-rounded": {
    "r-panel": "16px",
    "r-item": "10px",
    "r-thumb": "8px",
    "r-btn": "10px",
  },
};

const nonEmpty = (value: string | undefined): string | undefined =>
  value === undefined || value.trim() === "" ? undefined : value.trim();

const resolveMode = (backgroundColor: string | undefined): PanelMode => {
  const luminance =
    backgroundColor === undefined
      ? undefined
      : relativeLuminance(backgroundColor);
  if (luminance === undefined) {
    return "light";
  }

  return luminance < DARK_LUMINANCE_THRESHOLD ? "dark" : "light";
};

// A light primary reads as disabled when used as text: text-only controls
// fall back to the palette's text color unless the primary contrasts with the panel.
const resolveAccentTextColor = (
  primaryColor: string,
  mode: PanelMode,
): string => {
  const luminance = relativeLuminance(primaryColor);
  if (luminance === undefined) {
    return PALETTES[mode].text;
  }
  const contrasts =
    mode === "light"
      ? luminance < DARK_LUMINANCE_THRESHOLD
      : luminance >= DARK_LUMINANCE_THRESHOLD;

  return contrasts ? primaryColor : PALETTES[mode].text;
};

export type SearchPanelVariables = Record<`--dso-${string}`, string>;

export const resolveSearchPanelVariables = (
  theme: Theme | undefined,
): SearchPanelVariables => {
  const mode = resolveMode(nonEmpty(theme?.backgroundColor));
  const shape: PanelShape =
    theme?.ctaBorderType === STRAIGHT_BORDER_TYPE
      ? "rectangle"
      : "rectangle-rounded";
  const primary = nonEmpty(theme?.primaryColor) ?? DEFAULT_PRIMARY_COLOR;
  const fontFamily = nonEmpty(theme?.fontFamily);
  const variables: Record<string, string> = {
    ...PALETTES[mode],
    ...RADII[shape],
    primary,
    accent: resolveAccentTextColor(primary, mode),
    "cta-text": nonEmpty(theme?.ctaTextColor) ?? DEFAULT_CTA_TEXT_COLOR,
    ...(fontFamily === undefined ? {} : { font: fontFamily }),
  };

  return Object.fromEntries(
    Object.entries(variables).map(([name, value]) => [`--dso-${name}`, value]),
  ) as SearchPanelVariables;
};
