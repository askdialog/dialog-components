export type Rgb = [number, number, number];

// Alpha (#rgba, #rrggbbaa, rgba()) is dropped: only the opaque channels weigh
// in the luminance, the CSS variables keep the merchant's value as is.
const parseHexColor = (color: string): Rgb | undefined => {
  const hex = color.trim().replace(/^#/, "");
  if (!/^(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) {
    return undefined;
  }
  const expanded =
    hex.length <= 4
      ? [...hex].map((character) => character + character).join("")
      : hex;

  return [0, 2, 4].map((offset) =>
    Number.parseInt(expanded.slice(offset, offset + 2), 16),
  ) as Rgb;
};

// Only the browser's canonical computed color is parsed here: fixed ", "
// separators, so the pattern cannot backtrack on merchant input.
const parseComputedRgb = (computed: string): Rgb | undefined => {
  const match = /^rgba?\((\d+), (\d+), (\d+)(?:, [\d.]+)?\)$/.exec(computed);
  if (match === null) {
    return undefined;
  }

  return [match[1], match[2], match[3]].map(Number) as Rgb;
};

// Every non-hex value (`black`, `rgb(...)`, `hsl(...)`) is validated and
// resolved by the browser; an invalid value leaves the probe's style empty.
// Not cached: the caller memoizes per theme, and `var()` values may change.
const parseComputedColor = (color: string): Rgb | undefined => {
  if (typeof document === "undefined") {
    return undefined;
  }
  const probe = document.createElement("span");
  probe.style.color = color;
  if (probe.style.color === "") {
    return undefined;
  }
  document.body.appendChild(probe);
  const rgb = parseComputedRgb(getComputedStyle(probe).color);
  probe.remove();

  return rgb;
};

export const parseCssColor = (color: string): Rgb | undefined =>
  parseHexColor(color) ?? parseComputedColor(color);

const channelLuminance = (channel: number): number => {
  const normalized = channel / 255;

  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = (color: string): number | undefined => {
  const rgb = parseCssColor(color);
  if (rgb === undefined) {
    return undefined;
  }
  const [red, green, blue] = rgb.map(channelLuminance);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};
