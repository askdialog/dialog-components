import { useEffect, useRef, useState, type RefObject } from "react";
import { SearchStatus } from "@askdialog/dialog-sdk/search";

// Dismiss outside the panel and search bar while retaining search results.
export const useOutsideDismiss = (
  status: SearchStatus,
  /** The query asked; a change reopens the panel. */
  query: string,
  anchorRef: RefObject<HTMLDivElement | null>,
): { isOpen: boolean; panelRef: RefObject<HTMLDivElement | null> } => {
  const [dismissed, setDismissed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = status !== SearchStatus.IDLE && !dismissed;

  // Reopen on query changes, not on responses arriving after dismissal.
  useEffect(() => {
    setDismissed(false);
  }, [query]);

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
