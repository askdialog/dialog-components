import type {
  SearchAppearance,
  SearchAppearanceFiltersStyle,
  SearchAppearanceImageRatio,
} from "../types/searchAppearance";
import type { Theme } from "../types/theme";
import { isRecord } from "./isRecord";

const COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const MAX_RADIUS_PX = 999;
const IMAGE_RATIOS: Record<SearchAppearanceImageRatio, string> = {
  square: "1 / 1",
  portrait: "3 / 4",
};
const FILTERS_STYLES: readonly SearchAppearanceFiltersStyle[] = [
  "list",
  "pills",
];

type IsValid = (value: unknown) => boolean;

const isColor: IsValid = (value) =>
  typeof value === "string" && COLOR_PATTERN.test(value);
const isRadius: IsValid = (value) =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= MAX_RADIUS_PX;
const isBoolean: IsValid = (value) => typeof value === "boolean";
const isOneOf =
  (values: readonly string[]): IsValid =>
  (value) =>
    typeof value === "string" && values.includes(value);

// A key's check, or the shape of the group it holds.
interface Shape {
  readonly [key: string]: IsValid | Shape;
}

const SHAPE: Record<keyof SearchAppearance, Shape> = {
  colors: {
    text: isColor,
    mutedText: isColor,
    accent: isColor,
    buttonText: isColor,
    surface: isColor,
    border: isColor,
  },
  radii: { card: isRadius, button: isRadius, input: isRadius },
  card: {
    imageRatio: isOneOf(Object.keys(IMAGE_RATIOS)),
    showVendor: isBoolean,
    showAddToCart: isBoolean,
  },
  filters: { style: isOneOf(FILTERS_STYLES) },
  badges: {
    discount: { background: isColor, text: isColor, radius: isRadius },
  },
};

// The group's well-formed keys, undefined when none is.
const readGroup = (
  value: unknown,
  shape: Shape,
): Record<string, unknown> | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }
  const group = Object.fromEntries(
    Object.entries(shape).flatMap(([key, check]) => {
      if (typeof check !== "function") {
        const nested = readGroup(value[key], check);

        return nested === undefined ? [] : [[key, nested]];
      }

      return check(value[key]) ? [[key, value[key]]] : [];
    }),
  );

  return Object.keys(group).length === 0 ? undefined : group;
};

/** The appearance's well-formed keys; a malformed one is dropped on its own. */
export const readSearchAppearance = (value: unknown): SearchAppearance =>
  (readGroup(value, SHAPE) ?? {}) as SearchAppearance;

export type SearchAppearanceVariables = Record<
  `--dialog-search-${string}`,
  string
>;

const nonEmpty = (value: string | undefined): string | undefined =>
  value === undefined || value.trim() === "" ? undefined : value.trim();

const px = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : `${value}px`;

const display = (shown: boolean | undefined): string | undefined => {
  if (shown === undefined) {
    return undefined;
  }

  return shown ? "block" : "none";
};

type Resolve = (
  appearance: SearchAppearance,
  theme: Theme | undefined,
) => string | undefined;

// An accent or button text colour the merchant left out takes the assistant's:
// its other colours style its own panel and need not suit the page.
const VARIABLES: Record<string, Resolve> = {
  "text-color": ({ colors }) => colors?.text,
  "muted-text-color": ({ colors }) => colors?.mutedText,
  "accent-color": ({ colors }, theme) =>
    colors?.accent ?? nonEmpty(theme?.primaryColor),
  "button-text-color": ({ colors }, theme) =>
    colors?.buttonText ?? nonEmpty(theme?.ctaTextColor),
  "surface-color": ({ colors }) => colors?.surface,
  "border-color": ({ colors }) => colors?.border,
  "card-radius": ({ radii }) => px(radii?.card),
  "button-radius": ({ radii }) => px(radii?.button),
  "input-radius": ({ radii }) => px(radii?.input),
  "card-image-ratio": ({ card }) =>
    card?.imageRatio === undefined ? undefined : IMAGE_RATIOS[card.imageRatio],
  "card-vendor-display": ({ card }) => display(card?.showVendor),
  "card-button-display": ({ card }) => display(card?.showAddToCart),
  "filters-style": ({ filters }) => filters?.style,
};

/**
 * The `--dialog-search-*` variables of the appearance's keys, one per key set.
 * An absent accent or button text colour takes the assistant theme's primary
 * or CTA text colour when `theme` is given; any other absent key writes
 * nothing, so the surface's default applies.
 */
export const resolveSearchAppearanceVariables = (
  appearance: SearchAppearance,
  theme?: Theme,
): SearchAppearanceVariables => {
  const checked = readSearchAppearance(appearance);

  return Object.fromEntries(
    Object.entries(VARIABLES).flatMap(([name, resolve]) => {
      const value = resolve(checked, theme);

      return value === undefined ? [] : [[`--dialog-search-${name}`, value]];
    }),
  ) as SearchAppearanceVariables;
};
