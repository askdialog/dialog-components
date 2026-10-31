# @askdialog/dialog-react

## 3.3.0

### Minor Changes

- 39e3eda: Search titles bold what the engine matched (DAT-2092). Product, collection, article and page hits carry Algolia's optional `_highlightResult.title` (`SearchHighlightResult`: `value`, `matchLevel`, `matchedWords`, `fullyHighlighted`). `ProductHitDisplay.titleParts` and `SectionHitDisplay.titleParts` are now `readonly TitlePart[]`, runs of `{ text, highlighted }` split on the `<em>` of `value`, text unescaped; a hit without `_highlightResult` or with `matchLevel: none` gives one plain run. `highlightedTitleParts(title, highlightResult)` is exported.

  Removed: `splitTitleMatch` and the `TitleParts` type; `productHitDisplay(controller, hit)` no longer takes a `query` or the deprecated `locale`. `DialogSearchProductCard` and `DialogSearchCollections` show the matched parts in bold and the rest in the normal text colour (no more muted parts); `DialogSearchProductCard` loses its `query` and deprecated `locale` props. Requires a server that sends `_highlightResult` (dialog-ecom DAT-2089); without it titles show plain.

## 3.2.0

### Minor Changes

- 21dcfb6: Draw a search hit's image in the merchant's shape (DAT-2078). `_display.image` is now `SearchDisplayImage`, `{ url, shape }` with `shape: SearchImageShape` (`'theme' | 'square' | 'rounded' | 'round'`), on product, collection, article and page hits; `hitImage`, `ProductHitDisplay.image` and `SectionHitDisplay.image` carry it whole. `DialogSearchProductCard` and `DialogSearchCollections` draw `image.url` with the theme's corners for `theme`, straight corners for `square`, 8px rounded corners for `rounded` and as a circle for `round`.

  Requires a server that sends `_display.image` as `{ url, shape }` (DAT-2075): a string `_display.image` is no longer read. A custom card reads `display.image.url` instead of `display.image`.

## 3.1.0

### Minor Changes

- 3bc02ae: Search connectors draw what they display from the server's `_display` alone (DEC-3675): title, link, image, prices and display lines. `SearchHitDisplay` gains `title` and `url`; product hits carry `SearchProductHitDisplay`, which adds `price`, `compare_at_price?` (formatted in the shopper's market currency) and `lines` (`SearchDisplayLine`). `ProductHitDisplay` reads `price` and `compareAtPrice` from it and adds `lineAboveTitle` and `lineBelowTitle`; `productHitDisplay` ignores its now deprecated `locale` parameter. `connectSections` leaves out a collection, article or page whose link does not resolve, so `SectionHitDisplay.href` is always set.

  A new controller option, `storefrontRoot` (default `/`, e.g. Shopify's `window.Shopify.routes.root`), is the path a relative `_display.url` resolves under, exposed as `context.storefrontRoot`; a relative link that leaves the storefront's origin, or a non-HTTP(S) one, is dropped. `useDialogSearch` passes it through in React and Vue. `buildProductUrl` is deprecated and ignored, and so is the `locale` prop of `DialogSearchProductCard`: prices are formatted by the server.

  Upgrading from `@askdialog/dialog-sdk` 3.0.0 (`@askdialog/dialog-react` 3.0.0, `@askdialog/dialog-vue` 4.0.0):
  - Search against a server that sends `_display.title`, `url` and the product prices. A hit without `_display` makes the connectors and the display helpers (`hitTitle`, `hitImage`, `hitHref`) throw, so a custom `transport`, and any hit built by hand, must return it.
  - Pass `storefrontRoot` when the storefront runs under a path, e.g. `/fr-fr/`: relative links resolve under `/` otherwise.
  - Remove `buildProductUrl`: links are `_display.url` alone, and a product hit whose link is dropped has no `href`.
  - Remove the `locale` argument of `productHitDisplay` and the `locale` prop of `DialogSearchProductCard`: prices no longer follow them.
  - Upgrade the SDK with React or Vue: their peer `@askdialog/dialog-sdk` is now `^3.1.0`, as Vue imports `productHitDisplay` from it.
  - Check any custom CSS on the search cards: a hit with no image to display no longer renders a thumbnail slot, and its title and price take the slot's place.

### Patch Changes

- 5c21d32: Display a search hit's image from `_display` (DAT-2017). Product, collection, article and page hits carry `_display: SearchHitDisplay` (`{ image?: string }`), what to display computed by the server on top of the raw record; `hitImage` and the sections connector's `display.image` are `_display.image`, none when absent from it. `DialogSearchProductCard` and `DialogSearchCollections` render a hit with no image to display with no thumbnail slot: the title (and the price, for a product) alone.

  Requires a server that sends `_display` (DAT-2016): use this version only once the monolith sending it is in production.

## 3.0.0

### Major Changes

- 55cb0d7: Storefront search runs on the SDK's new search API (`@askdialog/dialog-sdk/search`). `DialogSearchBar`, `DialogSearchResults`, `DialogSearchPagination` and `DialogSearchProductCard` keep their props and rendering, built on the SDK's search box, hits, sections and pagination connectors; React's own copies of the search texts, display, highlight, theme and collection rules are removed.

  Breaking changes:
  - `useDialogSearch` keeps its options but returns the new controller and its snapshot: `controller.setQuery`, `submit`, `setPage` and `getState` are replaced by `setSearchState`, `search` and `getSnapshot`; `state` is `{ searchState, results, context }` (`state.results.status`, `state.results.products`, `state.context.businessRanking`) instead of the flat `{ status, query, page, response, sections, businessRanking }`.
  - Without a `locale` prop, texts and prices follow the search `language` and `country` instead of English and the browser's number format. With one, they are formatted in that locale with the SDK's helpers.
  - The peer `@askdialog/dialog-sdk` is 3.x, whose root exports the same search API.

- f0ae12f: `DialogSearchResults` no longer paginates. Without `seeAllHref`, the panel shows the first page of hits only, with no "Previous / Page x / y / Next" controls, as the Shopify theme's search overlay does; with `seeAllHref`, it still shows the "See all N results" link. `DialogSearchPagination` stays exported, for a results page of your own.

## 2.12.0

### Minor Changes

- d0ab19d: Search controllers expose `close()`, the counterpart of `open()`: it cancels the pending debounced query and the in-flight request (a late response is ignored), emits impressions already qualified as `view_search_results`, stops observing result elements and resets the state to idle with an empty query, without sending a request. Call it when the shopper dismisses search instead of `setQuery('')`, which runs the empty-query search. The next `open()` runs the empty-query search again (DAT-1938).

## 2.11.0

### Minor Changes

- 4fb36cc: feat(sdk): search opened signal (DAT-1558)

  The search controller gets `open()`, which emits a new `DialogEvents.TRACK_OPENED_SEARCH` Dialog event carrying `userId`, `surface` and `search_type`, like the other search events. Call it when the search input gets focus; it fires on every focus, deduplication happens downstream.

  New: `Dialog.trackOpenedSearch(params)`, the optional `trackOpenedSearch` callback on `SearchControllerAnalytics` (existing custom adapters keep compiling), and the `OpenedSearchParams` / `OpenedSearchEventPayload` types. The React and Vue `DialogSearchBar` and the raw JavaScript demo (`packages/search-example`) call `open()` on input focus.

- d282957: feat: title the empty-query products after the business ranking (DAT-1932)

  The SDK gets `client.getDialogConfig()`, which reads the widget dialog config; its `searchBusinessRanking` is the merchant's business ranking criterion (`best_sellers`, `newest`, `price_asc`, `price_desc`, absent when none). `useDialogSearch` in React and Vue reads it once per search bar and adds it to the state it returns, as `businessRanking` (typed `DialogSearchState`: the controller state plus that field); `DialogSearchResults` then titles the products shown before any query is typed "Best sellers", "New arrivals", "Low prices", "High prices", or "Our products" without a criterion, in every locale the bars support, with no change to the integration. Typed-query results keep the "Products" title.

### Patch Changes

- 4946a82: `createSearchController()` and `useDialogSearch` debounce keystrokes for 100 ms by default instead of 250 ms. Pass `debounceMs` to keep the previous delay.

## 2.10.2

### Patch Changes

- 038deb5: `createSearchController()` and `useDialogSearch` debounce keystrokes for 100 ms by default instead of 250 ms. Pass `debounceMs` to keep the previous delay.

## 2.10.1

### Patch Changes

- 06b954a: Article and page hits are the exported `SearchArticleHit` and `SearchPageHit`, Algolia's article and page records plus `url` (DAT-1465): `SearchControllerState.sections.articles` and `.pages` carry them. An article hit has `title`, `handle`, `tags`, `blog: { title, handle }`, `author: { name }`, `image`, `published_at`, `updated_at`, `body_html_safe` and `url`; a page hit has `title`, `handle`, `author`, `updated_at`, `body_html_safe` and `url`. Link them through `url`, as collections. `SearchHit` is deprecated: no index answers it any more.

## 2.10.0

### Minor Changes

- a28f541: Search product cards show the compare-at price (DAT-1282): `variants_compare_at_price_min`, struck through next to the price and formatted like it, when it is higher than `variants_min_price`; otherwise the price shows alone.
- 86ab252: Search takes an optional `buildProductUrl(hit)` (DAT-1332): React and Vue cards link to the hit's `url`, else to the builder's result, and have no link with neither. `controller.productUrl(hit)` gives that link, and `navigate` receives it.

### Patch Changes

- da430c9: Collection hits are the exported `SearchCollectionHit`, Algolia's collection record plus `url` (DAT-1404): `SearchControllerState.sections.collections` carries it, and the React and Vue search panels show the collection's `image` as its thumbnail again. Article and page hits keep `SearchHit`.

## 2.9.0

### Minor Changes

- a69388e: Search follows the lexical search contract (DAT-1212). Index names carry the shopper's ISO 3166-1 alpha-2 country instead of the currency (`searchIndexName('products', 'fr', 'BE')` gives `products_fr_be`), and `createSearchController` and the React/Vue `useDialogSearch` take `country` in place of `currency`. Product hits are the exported `SearchProductHit`, Algolia's Shopify record plus `url` and `currency`, with `objectID` the variant id and `id` the product id; collection, article and page hits keep `SearchHit`. View and select events send the hit's `id` as `product_id`, and impressions are deduplicated on it.

### Patch Changes

- 3dc79ef: Search product cards read the record (DAT-1215): they show the hit's `image` and its lowest variant price, `variants_min_price` formatted with `currency`, again.

## 2.8.0

### Minor Changes

- 1a4b27b: `DialogProductBlock` renders no input by default: `enableInput` defaults to `false` and is deprecated. The block shows at most 2 product questions and an "Ask something else" button (English, French or Spanish depending on the client locale) that opens the assistant with up to 5 product questions about the product. Pass `enableInput` to keep the previous input instead of the button. Requires `@askdialog/dialog-sdk` 2.15.0 or later.

## 2.7.0

### Minor Changes

- 602a6b1: `DialogInput` now tells the shopper they are talking to an AI before they type: its placeholder is the fixed text "Ask the AI a question", and an AI disclosure line sits under the input. Both are in English, French or Spanish depending on the client `locale`, English otherwise.

  The `placeholder` prop is deprecated and ignored. It stays accepted so existing code keeps compiling; remove it at your convenience.

## 2.6.0

### Minor Changes

- fba34e9: `DialogSearchResults` now shows the same layout as the Shopify search overlay: a collections column next to the products (list or 3-column `layout="grid"`), the query match emphasized in every title, a "See all results" footer button when `seeAllHref` is set (pagination otherwise), and a mobile stack below 768px. The panel is centered on the bar (at least 720px wide, clamped to the viewport) and its palette, radii and font follow the SDK theme through the new `theme` prop. Labels come in en/fr/de/es/it from `locale`.

  `useDialogSearch` accepts `sections` (e.g. `[{ index: 'collections', hitsPerPage: 5 }]`) to fill the collections column and returns the client's `theme`. `DialogSearchBar` is unchanged.

## 2.5.0

### Minor Changes

- 306f7ca: Include currency in search index names, e.g. `products_fr_usd`.

  Add required `currency` to Dialog and expose `client.currency`. The client retains its BCP-47 locale for assistant localization.

  Search controllers take `search`, `language` (ISO 639-1) and `currency` (ISO 4217). React/Vue `useDialogSearch` takes `client`, `language` and `currency`. Language and currency are required independently of the client locale. Apply them to product and additional-index queries and response matching.

  Separate request construction and result parsing from the controller. Invalidate previous responses as soon as new input arrives, including during the debounce delay.

## 2.4.0

### Minor Changes

- ce9b5c7: feat!: Algolia-shaped public search — the index name carries the locale (DAT-412)

  The public search wire now mirrors Algolia's "search multiple indices" contract on `POST /public/search/lexical`. One breaking change across the SDK and both bindings:
  - **Request**: `{ requests: [{ indexName, query, page?, hitsPerPage? }] }`. The locale travels in the index name (`products_fr`, built with the new `searchIndexName(index, locale)` export) — `locale`, `countryCode` and the `queryId` resend leave the wire. Every entry is validated strictly server-side (unknown field → 400 `Unknown parameter`; unknown index or unserved locale → 404 `Index … does not exist`).
  - **Response**: `{ results: [{ index, hits, nbHits, page, nbPages, hitsPerPage, processingTimeMS, query, queryID }] }`. Hits are flat records — `objectID` (the Shopify GID) plus the card attributes (`title`, `url`, `handle`, `imageUrl`, `priceRange` with an optional `currencyCode`); the `SearchHit.product` wrapper, `id`, `score`, `compareAtPriceRange`, `inStock` and the `SearchProduct` type are gone. `queryID` is always returned, one per entry (`clickAnalytics` gating deferred).
  - **Transport**: `searchProducts` is renamed `searchLexical` (the route is `search/lexical`, our one deliberate divergence from Algolia, keeping room for a future AI search); `dialog.search()` passes the request through untouched (the `Dialog` instance keeps `countryCode` for its own price formatting only).
  - **Search controller**: requires `locale` (React/Vue `useDialogSearch` default it to the client's), searches `products_<locale>`, and exposes the products result entry as `state.response`. Each request — pagination included — is its own query: no `queryId` resend, the analytics `query_id` comes from the result's `queryID` and the DEC-2448 envelope gains the `index` it was served from (the Algolia Insights click tuple `(index, queryID, objectID, position)`).
  - **React/Vue DialogSearch**: results and product cards read the flat hits; `useDialogSearch` drops `countryCode`.

## 2.3.1

### Patch Changes

- d2c9824: Docs: add a package README for `@askdialog/dialog-vue` (install, components, storefront search, theming) and a features table of contents to both the Vue and React READMEs. Drop the unfinished License placeholder section from the React README.

## 2.3.0

### Minor Changes

- 33c44d3: feat(search): carry the storefront market on search requests and render market pricing

  `SearchRequest` gains optional `locale` (BCP 47) and `countryCode` (ISO 3166-1 alpha-2): the backend answers with localized product titles and the Shopify Market's prices. `createSearchController` accepts the same options and stamps them on every request; `dialog.search()` defaults them from the instance's `locale`/`countryCode`. `SearchProduct` gains an optional `compareAtPriceRange` (always in `priceRange`'s currency).

  React/Vue: `DialogSearchResults` (and the product card) accept an optional `locale` prop so prices format with the storefront's conventions instead of the browser's, and render the compare-at price struck through when it beats the displayed price. `useDialogSearch` accepts `locale`/`countryCode` and forwards them to the controller.

## 2.2.1

### Patch Changes

- 89d378f: Polish the DialogSearch storefront components (DEC-2455):
  - **Panel placement.** The results panel now anchors to the search bar's real bounding box (the anchor's previous sibling) instead of the zero-height anchor, and flips above the bar when less than 200px remains below it — a bar near the viewport bottom no longer produced a zero-height panel. The panel also re-measures on viewport resize.
  - **Disposed controller.** The `useDialogSearch` facade's `dispose()` now clears its internal ref, so the next controller access creates a fresh instance instead of dispatching into the disposed one.
  - **Focus ring.** The search bar pill shows a visible focus indicator on `:focus-within`, replacing the input's suppressed native ring.
  - **Input name.** The search input carries a `name` attribute, silencing the DevTools form-field warning and making the field autofill-addressable.
  - **Outside-click dismiss.** Clicking outside the results panel (and outside the bar) closes it; typing again or re-focusing the bar reopens it with the results kept, like a native autocomplete.

## 2.2.0

### Minor Changes

- 42aea98: Add the storefront search components: `useDialogSearch` (React binding of the SDK search controller) plus `DialogSearchBar`, `DialogSearchResults`, `DialogSearchProductCard` and `DialogSearchPagination`, with DEC-2448 attribution (viewport impressions and select events) wired in.
- 9e56f79: Add RTL support to the DialogProductBlock (PDP "Ask a question" widget). The block now resolves the text direction from the client locale (Arabic, Hebrew, Persian, Urdu) and sets `dir="rtl"` on its root, and its directional styles use logical properties (`text-align: start`, `padding-inline-end`, `inset-inline-end`) so the header, suggestion chips and input mirror correctly.

  The direction helpers (`isRtlLanguageCode`, `resolveTextDirection`) live in the SDK alongside the other localization utilities and are shared by the React and Vue packages.

### Patch Changes

- 3715e6d: Fix two issues in the DialogSearch storefront components (DEC-2455):
  - **Double navigation.** When `useDialogSearch` is given a `navigate` router adapter, selecting a result card ran both the adapter's client-side transition and the anchor's native navigation, causing a duplicate transition / full-page reload. `SearchController.selectResult` now takes an optional `{ navigate }` and returns `true` when the adapter handled navigation; the React card `preventDefault()`s in that case. Modified clicks (cmd/ctrl/shift/alt) and middle-clicks pass `{ navigate: false }` so they still open a new tab natively — attribution is recorded but the in-app adapter (which can't open a tab) is skipped. Without an adapter, `selectResult` returns `false` and native `<a href>` navigation proceeds unchanged.
  - **Price formatting crash.** A malformed `currencyCode` in untrusted catalog data made `Intl.NumberFormat` throw during render, which could take down the whole search results panel instead of dropping one price. `formatSearchPrice` now degrades to an empty string (no price shown) on a formatting error.

## 2.1.0

### Minor Changes

- 5eb504d: feat: register the wrapper package in window.dialog.audit (DEC-2368)

  `DialogProductBlock` now registers its integration (`react` / `vue`) and package version on the shared audit surface `window.dialog.audit` when it mounts, alongside the SDK's own entry — so support can tell a React/Vue integration apart from direct SDK usage from the browser console.

## 2.0.2

### Patch Changes

- 8b645e1: fix: widen the `@askdialog/dialog-sdk` peer dependency to `^2.0.1`

  The peer was pinned to the exact version `2.0.0`, so installing the latest
  `@askdialog/dialog-sdk@2.0.1` alongside `dialog-react`/`dialog-vue` produced a
  peer-dependency mismatch warning (and an `ERESOLVE` error under strict peer
  resolution). The peer is now a caret range (`^2.0.1`), accepting any compatible
  `2.x` SDK release.

## 2.0.1

### Patch Changes

- fix: republish with the correct `@askdialog/dialog-sdk` peer dependency (OPS-650). The `2.0.0` `latest` artifact shipped a stale `@askdialog/dialog-sdk@1.2.0` peer; this release ships the correct `2.0.x` peer metadata.

## 2.0.0

### Patch Changes

- Updated dependencies [ba085c0]
  - @askdialog/dialog-sdk@2.0.0

## 2.0.0-beta.2

### Patch Changes

- Updated dependencies [ba085c0]
  - @askdialog/dialog-sdk@2.0.0-beta.1

## 2.0.0-beta.1

### Patch Changes

- Updated dependencies [8b8c1a9]
  - @askdialog/dialog-sdk@1.2.0-beta.0

## 1.0.1-beta.0

### Patch Changes

- 02ecd59: fix(product-block): suppress English placeholder flash during suggestions fetch (OPS-589)

  `DialogProductBlock` no longer renders English default placeholders (`"Your expert"`, `"A question about this product?"`, `"Ask anything..."`) while `getSuggestions` is in flight. Title, description, and input placeholder render empty until the localized response arrives, eliminating the visible English → target-language re-render on multi-locale storefronts. Also hardens the fetch lifecycle: resets loading state on each `productId`/`client` change, clears loading in `finally` on errors, and guards against out-of-order responses overwriting newer data.

## 1.0.0

### Patch Changes

- c4f83c7: Initial release of Dialog official React Component lib
- Updated dependencies [354db6b]
- Updated dependencies [9200579]
  - @askdialog/dialog-sdk@1.1.0

## 1.0.0-beta.1

### Patch Changes

- Updated dependencies [354db6b]
  - @askdialog/dialog-sdk@1.1.0-beta.3

## 0.1.1-beta.0

### Patch Changes

- c4f83c7: Initial release of Dialog official React Component lib

## 0.1.0

### Minor Changes

- Initial release of React component library for Dialog AI-powered product assistance
- DialogProductBlock component with suggestions and input
- DialogInput standalone component
- Theme support via CSS variables
- TypeScript support with full type definitions
- React 19 support

### Dependencies

- @askdialog/dialog-sdk@^1.0.0
