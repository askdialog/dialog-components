import { useLayoutEffect, useRef, useState, type RefObject } from "react";

export interface AnchorRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

// Tracks the viewport position of the element the panel is anchored to — the
// anchor's previous sibling (the search bar in the documented composition),
// falling back to the zero-height anchor itself — so a fixed element can
// follow it; the capture-phase scroll listener also catches scrolling
// ancestors. The viewport height is separate state (not an AnchorRect field)
// so consumers recompute available space when the window resizes without the
// bar moving.
export const useAnchorRect = (
  active: boolean,
): {
  anchorRef: RefObject<HTMLDivElement | null>;
  rect: AnchorRect | undefined;
  viewportHeight: number;
} => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<AnchorRect | undefined>(undefined);
  const [viewportHeight, setViewportHeight] = useState(0);

  useLayoutEffect(() => {
    if (!active) {
      return;
    }
    const update = (): void => {
      const anchor = anchorRef.current;
      if (anchor === null) {
        return;
      }
      const target = anchor.previousElementSibling ?? anchor;
      const { top, bottom, left, width } = target.getBoundingClientRect();
      setViewportHeight(window.innerHeight);
      setRect((previous) =>
        previous !== undefined &&
        previous.top === top &&
        previous.bottom === bottom &&
        previous.left === left &&
        previous.width === width
          ? previous
          : { top, bottom, left, width },
      );
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [active]);

  return { anchorRef, rect, viewportHeight };
};
