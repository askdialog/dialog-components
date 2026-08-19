import {
  SearchStatus,
  type SearchControllerState,
} from "@askdialog/dialog-sdk";
import { computed, onMounted, onUnmounted, ref, watch, type Ref } from "vue";

// Closes the floating panel on any pointer interaction outside it and outside
// the search bar (the anchor's previous sibling). The controller keeps its
// results: typing again or re-focusing the bar reopens the panel, like a
// native autocomplete.
export const useOutsideDismiss = (
  state: Readonly<Ref<SearchControllerState>>,
  anchorRef: Ref<HTMLDivElement | undefined>,
): {
  isOpen: Readonly<Ref<boolean>>;
  panelRef: Ref<HTMLDivElement | undefined>;
} => {
  const dismissed = ref(false);
  const panelRef = ref<HTMLDivElement>();
  const isOpen = computed(
    () => state.value.status !== SearchStatus.IDLE && !dismissed.value,
  );

  // Only a new committed query signals user intent — deliberately NOT every
  // state emission: a response landing after the user clicked away must not
  // reopen the panel on its own.
  watch(
    () => state.value.query,
    () => {
      dismissed.value = false;
    },
  );

  watch(
    isOpen,
    (open, _, onCleanup) => {
      if (!open) {
        return;
      }
      const handlePointerDown = (event: PointerEvent): void => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }
        const bar = anchorRef.value?.previousElementSibling;
        const isInsidePanel = panelRef.value?.contains(target) ?? false;
        const isInsideBar = bar?.contains(target) ?? false;
        if (!isInsidePanel && !isInsideBar) {
          dismissed.value = true;
        }
      };
      document.addEventListener("pointerdown", handlePointerDown);
      onCleanup(() =>
        document.removeEventListener("pointerdown", handlePointerDown),
      );
    },
    { immediate: true },
  );

  const reopen = (): void => {
    dismissed.value = false;
  };
  onMounted(() => {
    anchorRef.value?.previousElementSibling?.addEventListener(
      "focusin",
      reopen,
    );
  });
  onUnmounted(() => {
    anchorRef.value?.previousElementSibling?.removeEventListener(
      "focusin",
      reopen,
    );
  });

  return { isOpen, panelRef };
};
