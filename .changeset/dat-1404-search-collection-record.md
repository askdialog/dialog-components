---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": patch
"@askdialog/dialog-vue": patch
---

Collection hits are the exported `SearchCollectionHit`, Algolia's collection record plus `url` (DAT-1404): `SearchControllerState.sections.collections` carries it, and the React and Vue search panels show the collection's `image` as its thumbnail again. Article and page hits keep `SearchHit`.
