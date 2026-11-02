---
"@askdialog/dialog-sdk": minor
---

Search texts answer in the widget's languages (DEC-3793): `getSearchTexts` and the controller's `context.texts` add Arabic, Japanese, Korean, Dutch, Polish and Portuguese to English, French, German, Spanish and Italian, so `DialogSearchResults` and `DialogSearchPagination` in React and Vue speak them too. Counts follow each language's plural forms (Arabic and Polish included). Any other language still falls back to English, and `texts` overrides still replace only the keys they name.
