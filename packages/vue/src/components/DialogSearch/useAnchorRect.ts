import { ref, watch, type Ref } from "vue";

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
  active: Ref<boolean>,
): {
  anchorRef: Ref<HTMLDivElement | undefined>;
  rect: Ref<AnchorRect | undefined>;
  viewportHeight: Ref<number>;
} => {
  const anchorRef = ref<HTMLDivElement>();
  const rect = ref<AnchorRect | undefined>(undefined);
  const viewportHeight = ref(0);

  watch(
    active,
    (isActive, _, onCleanup) => {
      if (!isActive) {
        return;
      }
      const update = (): void => {
        const anchor = anchorRef.value;
        if (anchor === undefined) {
          return;
        }
        const target = anchor.previousElementSibling ?? anchor;
        const { top, bottom, left, width } = target.getBoundingClientRect();
        viewportHeight.value = window.innerHeight;
        const previous = rect.value;
        if (
          previous === undefined ||
          previous.top !== top ||
          previous.bottom !== bottom ||
          previous.left !== left ||
          previous.width !== width
        ) {
          rect.value = { top, bottom, left, width };
        }
      };
      update();
      window.addEventListener("scroll", update, true);
      window.addEventListener("resize", update);
      onCleanup(() => {
        window.removeEventListener("scroll", update, true);
        window.removeEventListener("resize", update);
      });
    },
    { immediate: true, flush: "post" },
  );

  return { anchorRef, rect, viewportHeight };
};
