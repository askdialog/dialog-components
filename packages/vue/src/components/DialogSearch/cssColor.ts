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

// Split on separators rather than matched with an ambiguous whitespace
// pattern: the value is merchant input and must not backtrack.
const parseRgbColor = (color: string): Rgb | undefined => {
  const trimmed = color.trim();
  if (!/^rgba?\(/i.test(trimmed)) {
    return undefined;
  }
  const channels = trimmed
    .slice(trimmed.indexOf("(") + 1, trimmed.lastIndexOf(")"))
    .split(/[\s,/]+/)
    .filter((value) => value !== "")
    .slice(0, 3)
    .map(Number);
  if (channels.length !== 3 || channels.some(Number.isNaN)) {
    return undefined;
  }

  return channels as Rgb;
};

// Named and functional colors (`black`, `hsl(...)`) are resolved by the
// browser; an unparseable value leaves the probe's style empty.
const computedColorCache = new Map<string, Rgb | undefined>();

const parseComputedColor = (color: string): Rgb | undefined => {
  if (typeof document === "undefined") {
    return undefined;
  }
  if (computedColorCache.has(color)) {
    return computedColorCache.get(color);
  }
  const probe = document.createElement("span");
  probe.style.color = color;
  let rgb: Rgb | undefined;
  if (probe.style.color !== "") {
    document.body.appendChild(probe);
    rgb = parseRgbColor(getComputedStyle(probe).color);
    probe.remove();
  }
  computedColorCache.set(color, rgb);

  return rgb;
};

export const parseCssColor = (color: string): Rgb | undefined =>
  parseHexColor(color) ?? parseRgbColor(color) ?? parseComputedColor(color);

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
