import type { CSSProperties } from "react";
import type { AnchorRect } from "./useAnchorRect";

const PANEL_OFFSET_PX = 8;
const VIEWPORT_MARGIN_PX = 16;
// Flip above the bar when space below is limited and more is available above.
const MIN_PANEL_SPACE_PX = 200;
// Two columns (collections + products) need more room than the bar usually has:
// the panel fills the viewport up to this width, whatever the bar's own width.
const MAX_PANEL_WIDTH_PX = 1440;

export const isAnchorOnScreen = (
  rect: AnchorRect,
  viewportHeight: number,
): boolean => rect.bottom > 0 && rect.top < viewportHeight;

const horizontalPlacement = (
  rect: AnchorRect,
  viewportWidth: number,
): { left: number; width: number } => {
  const width = Math.min(
    MAX_PANEL_WIDTH_PX,
    viewportWidth - 2 * VIEWPORT_MARGIN_PX,
  );
  const centered = rect.left + rect.width / 2 - width / 2;
  const left = Math.min(
    Math.max(centered, VIEWPORT_MARGIN_PX),
    viewportWidth - VIEWPORT_MARGIN_PX - width,
  );

  return { left, width };
};

/** Centered on the bar, clamped to the viewport; flips above when short of room below. */
export const panelStyle = (
  rect: AnchorRect,
  viewportWidth: number,
  viewportHeight: number,
): CSSProperties => {
  const spaceBelow =
    viewportHeight - rect.bottom - PANEL_OFFSET_PX - VIEWPORT_MARGIN_PX;
  const spaceAbove = rect.top - PANEL_OFFSET_PX - VIEWPORT_MARGIN_PX;
  const base = horizontalPlacement(rect, viewportWidth);

  if (spaceBelow < MIN_PANEL_SPACE_PX && spaceAbove > spaceBelow) {
    return {
      ...base,
      bottom: viewportHeight - rect.top + PANEL_OFFSET_PX,
      maxHeight: Math.max(spaceAbove, 0),
    };
  }

  return {
    ...base,
    top: rect.bottom + PANEL_OFFSET_PX,
    maxHeight: Math.max(spaceBelow, 0),
  };
};
