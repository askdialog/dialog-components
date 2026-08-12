---
"@askdialog/dialog-react": patch
---

Polish the DialogSearch storefront components (DEC-2455):

- **Panel placement.** The results panel now anchors to the search bar's real bounding box (the anchor's previous sibling) instead of the zero-height anchor, and flips above the bar when less than 200px remains below it — a bar near the viewport bottom no longer produced a zero-height panel. The panel also re-measures on viewport resize.
- **Disposed controller.** The `useDialogSearch` facade's `dispose()` now clears its internal ref, so the next controller access creates a fresh instance instead of dispatching into the disposed one.
- **Focus ring.** The search bar pill shows a visible focus indicator on `:focus-within`, replacing the input's suppressed native ring.
- **Input name.** The search input carries a `name` attribute, silencing the DevTools form-field warning and making the field autofill-addressable.
- **Outside-click dismiss.** Clicking outside the results panel (and outside the bar) closes it; typing again or re-focusing the bar reopens it with the results kept, like a native autocomplete.
