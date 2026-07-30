# @askdialog/search-example

Raw JavaScript reference page for `dialog.search()` (DEC-2452): a framework-free
storefront search demonstrating input, loading, errors, empty results, product
cards and pagination.

Debounce, cancellation, stale-response protection, state and pagination are
deliberately owned by this demo (`src/searchController.js`) — that module is the
extraction source for the reusable frontend search behavior (DEC-2459).

## Run

```bash
pnpm install
pnpm dev          # http://localhost:5175, SDK resolved from ../sdk sources
```

`pnpm dev:test-dist` resolves `@askdialog/dialog-sdk` from its built `dist/`
instead of the sources.

## Analytics

The demo is the reference wiring for the search analytics events (DEC-2448),
snake_case end to end:

- `view_search_results` — viewport impressions via the SDK's
  `createSearchImpressionTracker` (≥50% visible for ≥500ms, deduplicated by
  `(query_id, product_id)`, batched). A rendered no-results state is the same
  event with `items: []` and `total_hits: 0`.
- `select_search_result` — result clicks, including `auxclick`/cmd+click; a
  click forces the item's impression first.

`query_id` stays stable across pagination but rotates on every new submission —
even of the same text (the controller's `trigger` tells the two apart).
`page` is 1-based, positions are absolute.
No raw query text is emitted — only `query_length`. To observe the raw SDK
events locally, listen for the `enableDialogAssistantEvent` CustomEvent on
`window`.

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

`POST /public/search` requires an ECS runtime (or the local monolith + python
stack) — the dev Lambda answers 503 `STOREFRONT_SEARCH_UNAVAILABLE` by design.
