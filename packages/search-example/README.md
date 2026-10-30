# @askdialog/search-example

Raw JavaScript reference page for `dialog.search()` (DEC-2452): a framework-free
storefront search demonstrating input, loading, errors, empty results, product
cards and pagination.

It runs on the search API of `@askdialog/dialog-sdk`: a
`createSearchController()` holds the search state, the results and the
context, and the `connectSearchBox`, `connectHits`, `connectStats` and
`connectPagination` connectors read and change them. Debounce, cancellation,
stale-response protection, display rules (title, link, image, price),
pagination and analytics attribution come from the SDK — this page binds DOM
events to connector actions and renders their render states. It is the
reference wiring for a framework-free integration.

## Run

```bash
pnpm install
pnpm dev          # http://localhost:5175, SDK resolved from ../sdk sources
```

`pnpm dev:test-dist` resolves `@askdialog/dialog-sdk` from its built `dist/`
instead of the sources.

## Product hits

The page searches in French for a shopper in France (`language: "fr"`,
`country: "FR"`, index `products_fr_fr`); the country picks the market whose
prices the hits carry. Each product hit is Algolia's Shopify record
(`SearchProductHit`); `connectHits` gives it a ready-to-render `display`, read
from the server's `_display`: the card shows its `image`, its `title`, its
`price` (formatted in the market currency by the server) and links to its
`href` (`_display.url`, a relative one resolved under the controller's
`storefrontRoot`, http(s) only). The status line shows
`connectStats`' count in the shopper's language.

## Analytics

The search analytics events (DEC-2448, snake_case end to end) are owned by the
controller — the page only declares `analytics.surface` and forwards the
track methods of the `Dialog` instance:

- `opened_search` — `searchBox.open()` on every focus of the search input
  (`TRACK_OPENED_SEARCH`, logged as `[search] opened` in the console). It
  carries `userId`, `surface` and `search_type`; deduplication happens
  downstream.

- `view_search_results` — viewport impressions (≥50% visible for ≥500ms,
  deduplicated by `(query_id, product_id)`, batched) via
  `hits.observe(card, index)` after rendering each card. A
  rendered no-results state is emitted by the controller with `items: []`.
- `select_search_result` — `hits.select(index)` on result clicks,
  including `auxclick`/cmd+click; the click forces the item's impression first.

`query_id` is the response's `queryID`: every request — pagination included —
is its own query with a fresh id.
`page` is 1-based, positions are absolute. No raw query text is emitted —
only `query_length`. To observe the
raw SDK events locally, listen for the `enableDialogAssistantEvent`
CustomEvent on `window`.

## API key

The key is never committed. Either:

- create a gitignored `.env.local` with `VITE_DIALOG_API_KEY=<key>`, or
- paste the key in the field shown on the page (kept in memory only).

## Backend flavor

In `pnpm dev` the SDK is aliased to its sources, so the backends come from
`../sdk/src/config/index.ts`. Pick a flavor before starting:

```bash
pnpm --dir ../sdk set-config development   # staging backends
pnpm --dir ../sdk set-config local         # per-developer config.local.ts (gitignored)
pnpm --dir ../sdk set-config production    # restore the committed default
```

Bootstrap your `config.local.ts` from the committed template
`../sdk/src/config/config.local.example.ts`.

`POST /public/search/lexical` requires an ECS runtime (or the local monolith +
python stack) — the dev Lambda answers 503 `STOREFRONT_SEARCH_UNAVAILABLE` by
design.
The full local E2E recipe (SDK → monolith → python → OpenSearch) lives in the
`dialog-ecom` repo: `backend/monolith/docs/howtos/test-storefront-search-locally.md`.
