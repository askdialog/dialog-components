import { useEffect, useRef, useState, type RefObject } from "react";
import {
  SearchStatus,
  type SearchControllerState,
} from "@askdialog/dialog-sdk";

// Closes the floating panel on any pointer interaction outside it and outside
// the search bar (the anchor's previous sibling). The controller keeps its
// results: typing again or re-focusing the bar reopens the panel, like a
// native autocomplete.
export const useOutsideDismiss = (
  state: SearchControllerState,
  anchorRef: RefObject<HTMLDivElement | null>,
): { isOpen: boolean; panelRef: RefObject<HTMLDivElement | null> } => {
  const [dismissed, setDismissed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = state.status !== SearchStatus.IDLE && !dismissed;

  // Only a new committed query signals user intent — deliberately NOT every
  // state emission: a response landing after the user clicked away must not
  // reopen the panel on its own.
  useEffect(() => {
    setDismissed(false);
  }, [state.query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handlePointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      const bar = anchorRef.current?.previousElementSibling;
      const isInsidePanel = panelRef.current?.contains(target) ?? false;
      const isInsideBar = bar?.contains(target) ?? false;
      if (!isInsidePanel && !isInsideBar) {
        setDismissed(true);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, anchorRef]);

  useEffect(() => {
    const bar = anchorRef.current?.previousElementSibling;
    if (bar === null || bar === undefined) {
      return;
    }
    const reopen = (): void => setDismissed(false);
    bar.addEventListener("focusin", reopen);

    return () => bar.removeEventListener("focusin", reopen);
  }, [anchorRef]);

  return { isOpen, panelRef };
};
