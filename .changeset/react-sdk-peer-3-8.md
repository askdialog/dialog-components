---
"@askdialog/dialog-react": patch
---

React's peer `@askdialog/dialog-sdk` is now `^3.8.0`. React 3.5.0 imports `@askdialog/dialog-sdk/events` (added in SDK 3.8.0) and `@askdialog/dialog-sdk/impressions` (3.7.0) at runtime, but accepted SDK 3.4 to 3.7, where those imports fail to resolve. Upgrading to React 3.5.0 or later: install SDK 3.8.0 or later with it. `verify:peers` now also checks that the oldest SDK a package's peer accepts exports every SDK subpath its build imports.
