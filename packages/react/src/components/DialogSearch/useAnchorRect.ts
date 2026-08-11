import { useLayoutEffect, useRef, useState, type RefObject } from "react";

export interface AnchorRect {
  top: number;
  left: number;
  width: number;
}

// Tracks the viewport position of the in-flow anchor so a fixed element can
// follow it; the capture-phase scroll listener also catches scrolling ancestors.
export const useAnchorRect = (
  active: boolean,
): {
  anchorRef: RefObject<HTMLDivElement | null>;
  rect: AnchorRect | undefined;
} => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<AnchorRect | undefined>(undefined);

  useLayoutEffect(() => {
    if (!active) {
      return;
    }
    const update = (): void => {
      const anchor = anchorRef.current;
      if (anchor === null) {
        return;
      }
      const { top, left, width } = anchor.getBoundingClientRect();
      setRect((previous) =>
        previous !== undefined &&
        previous.top === top &&
        previous.left === left &&
        previous.width === width
          ? previous
          : { top, left, width },
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

  return { anchorRef, rect };
};
