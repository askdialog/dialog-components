import { ref, watch, type Ref } from "vue";

export interface AnchorRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

interface Viewport {
  width: number;
  height: number;
}

// Position the panel from the previous sibling (search bar), falling back to the anchor.
// Capture ancestor scrolls and track the viewport separately for available space.
export const useAnchorRect = (
  active: Ref<boolean>,
): {
  anchorRef: Ref<HTMLDivElement | undefined>;
  rect: Ref<AnchorRect | undefined>;
  viewport: Ref<Viewport>;
} => {
  const anchorRef = ref<HTMLDivElement>();
  const rect = ref<AnchorRect | undefined>(undefined);
  const viewport = ref<Viewport>({ width: 0, height: 0 });

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
        if (
          viewport.value.width !== window.innerWidth ||
          viewport.value.height !== window.innerHeight
        ) {
          viewport.value = {
            width: window.innerWidth,
            height: window.innerHeight,
          };
        }
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

  return { anchorRef, rect, viewport };
};
