---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": patch
"@askdialog/dialog-vue": patch
---

Article and page hits are the exported `SearchArticleHit` and `SearchPageHit`, Algolia's article and page records plus `url` (DAT-1465): `SearchControllerState.sections.articles` and `.pages` carry them. An article hit has `title`, `handle`, `tags`, `blog: { title, handle }`, `author: { name }`, `image`, `published_at`, `updated_at`, `body_html_safe` and `url`; a page hit has `title`, `handle`, `author`, `updated_at`, `body_html_safe` and `url`. Link them through `url`, as collections. `SearchHit` is deprecated: no index answers it any more.
