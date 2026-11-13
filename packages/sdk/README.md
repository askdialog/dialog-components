# Dialog SDK

## Dialog

Dialog is an AI assistant designed to boost e-commerce sales by providing intelligent product recommendations and seamless customer interactions.

Visit our website: [Dialog AI Assistant](https://www.askdialog.com/)

## Description

Dialog SDK is a powerful TypeScript library that seamlessly integrates the Dialog AI assistant into your applications. It provides a comprehensive set of tools for managing assistant interactions, handling e-commerce operations like product fetching and cart management, and customizing the assistant's appearance to match your brand.

## Get started

### Prerequisites

Before using the Dialog SDK, you need:

- An active API Key, you can retrieve your api key in your [organization settings](https://app.askdialog.com/settings)

### Installation

```bash
npm install @askdialog/dialog-sdk
# or
pnpm add @askdialog/dialog-sdk
# or
yarn add @askdialog/dialog-sdk
```

You can also use our CDN link if you’re not using a package manager.

- Add the script to your project (replace X, Y, Z by versions)

```html
<script src="https://d2m6yt8rnm4dos.cloudfront.net/dialog-sdk.X.Y.Z.min.js"></script>
```
- The `DialogSDK` object will be available on the `window`. You can access all features as shown below:
```typescript

const client = new window.DialogSDK.Dialog({
    apiKey: 'YOUR_API_KEY',
    // ........
})
```

### Instantiate the client

```typescript
import { Dialog } from '@askdialog/dialog-sdk';

const client = new Dialog({
  apiKey: 'YOUR_API_KEY', // required
  locale: 'fr-FR', currency: 'EUR', // ISO 639-1 language
  currency: 'EUR', // required ISO 4217 currency
  countryCode: 'FR', // optional, ISO 3166 alpha-2
  callbacks: {
    addToCart: async ({
    productId,
    quantity,
    currency,
    variantId,
    price,
  }: {
    productId: string;
    quantity: number;
    currency?: string;
    variantId?: string;
    price?: string;
  }) => Promise<void>, // required
    getProduct: async (
        productId: string,
        variantId?: string
    ) => Promise<SimplifiedProduct>, // required
  },
});
```

The apiKey is required to authenticate with our API and interact with our assistant.
The locale specifies the language you want to use.

The optional `countryCode` (ISO 3166 alpha-2, e.g. `'FR'`, `'US'`) sets the region used to format prices (separators, symbol placement) and the language variant. It does not change the currency itself, which comes from each product. The effective region is resolved in this order:

1. the `countryCode` parameter, when provided;
2. the region embedded in `locale` (e.g. `'en-US'` → `US`);
3. the region guessed from the language (e.g. `'fr'` → `FR`).

The addToCart function is triggered when a user clicks the AddToCart button.
The getProduct function is used to display product information in the assistant.

`callbacks` is **optional**: a search-only integration can construct the client with just `apiKey` and `locale`. Only `getProduct()`, `addToCart()`, `changeCartQuantity()` and `getCart()` require their callback — they throw an explicit configuration error when it is absent; every other feature works without callbacks.

When the client is instantiated, it will automatically insert into the DOM the Dialog Assistant script, so you can interact with the assistant using `sendProductMessage` or `sendGenericMessage`. This assistant runtime always loads — it owns the shopper identity, consent handling and analytics bridge — while the heavy assistant UI stays lazy-loaded and is not fetched eagerly.

### Declaring the current product page

The assistant answers product questions with the product context of the page the shopper is on. Entry points that carry a product id (like `sendProductMessage`) set it themselves, but entry points that don't — the floating bookmark, the resume-conversation surface, free-text questions — need the SDK to know what PDP the shopper is looking at, especially after navigating from one product page to another.

Declare it at construction on product pages:

```ts
new Dialog({
  apiKey: 'YOUR_API_KEY',
  locale: 'fr-FR', currency: 'EUR',
  product: { id: 'PRODUCT_ID', variantId: 'VARIANT_ID' }, // variantId optional
});
```

On single-page storefronts, update it on client-side navigation:

```ts
client.setCurrentProduct('PRODUCT_ID');   // arrived on a PDP
client.clearCurrentProduct();             // left for a non-product page
```

Ids must match the product ids of your Dialog product feed. Without a declared product, questions asked from the bookmark after a page change reach the assistant without product context and are answered generically.

### OneTrust auto-blocking

If your site uses OneTrust auto-blocking, it may neutralize the assistant script injected by the SDK (`type` rewritten to `text/plain`) for visitors who declined cookies — a `data-ot-ignore` on your own SDK `<script>` tag does not cover dynamically injected scripts. Two remedies, both merchant-side decisions:

- categorize the assistant CDN domain as strictly necessary in your OneTrust console, or
- pass the optional `ignoreOneTrustAutoBlock: true` constructor flag so the SDK adds `data-ot-ignore` on the script it injects.

Either is compliance-safe with regard to analytics: the assistant gates all analytics on consent internally and sends nothing without an explicit opt-in, unless you declared the consent yourself with `analyticsConsent` (inspect `window.dialog.audit.consent`).

### Declaring the analytics consent

By default the assistant sends analytics events (add-to-cart, checkout, assistant usage) only once it detects a consent signal on the page: Google Consent Mode, TCF v2 or OneTrust. A site with no cookie banner emits no such signal, so nothing is sent for any of its visitors.

On those sites, pass the optional `analyticsConsent: 'granted'` constructor option:

```ts
new Dialog({
  apiKey: 'YOUR_API_KEY',
  locale: 'en-US', currency: 'USD',
  analyticsConsent: 'granted', // no cookie banner on this site
});
```

It works like a Google Consent Mode `default` state:

- analytics is on from the first page view, for every visitor;
- a refusal coming from a consent platform present on the page still wins: a Google Consent Mode `update` set to `denied`, or OneTrust loaded without the performance group (`C0002`), turns analytics off for that visitor;
- `window.dialog.audit.consent` reports `detectedCmp: 'declared'` when the option is what enabled analytics.

Whether consent can be assumed for your visitors is your compliance decision. Omit the option to keep the default detection.

### Disabling add-to-cart

Some sessions must hide purchasing actions — for example a B2B storefront that hides its own add-to-cart when a B2B customer is logged in. Pass the optional `disableAddToCart: true` constructor flag (type `boolean`, default `false`) to suppress Dialog add-to-cart for that widget instance/session:

```ts
new Dialog({
  apiKey: 'YOUR_API_KEY',
  locale: 'fr-FR', currency: 'EUR',
  disableAddToCart: true, // hide the add-to-cart CTA for this session
});
```

When set:

- the assistant hides/disables the add-to-cart CTA on both product recommendation cards and conversational product cards;
- `client.addToCart(...)` becomes a no-op — it never invokes your `callbacks.addToCart` and emits no `TRACK_ADD_TO_CART` event, so a stale UI cannot add to the cart or pollute analytics;
- product links and recommendation browsing are unaffected.

Omit the flag (or set it to `false`) to keep the default behavior — the add-to-cart CTA and analytics are unchanged.

### Reading the cart

The assistant reads the shopper's cart (lines, total, currency) to suggest products that go with it. On storefronts where it cannot read the cart itself — for example a headless storefront — pass the optional `callbacks.getCart`:

```ts
new Dialog({
  apiKey: 'YOUR_API_KEY',
  locale: 'fr-FR', currency: 'EUR',
  callbacks: {
    addToCart, getProduct,
    getCart: async (): Promise<CartSnapshot | null> => ({
      lines: [
        { productId: 'gid://shopify/Product/42', variantId: 'gid://shopify/ProductVariant/4242', quantity: 2, unitPrice: 12.5 },
      ],
      totalAmount: 25, // line items after cart discounts, excluding shipping
      currency: 'EUR', // ISO 4217
    }),
  },
});
```

- Amounts are in currency units (`12.5`, not cents); ids may be Shopify GIDs or raw ids, matching your product feed. Resolve `null` when the shopper has no cart.
- `client.canReadCart()` tells whether the callback was provided; `client.getCart()` resolves your snapshot, and rejects with a configuration error when the callback is absent.
- `getCart` is a read: `disableAddToCart` does not affect it.

Omit it to keep the default behavior.

### Getters

- apiKey
- theme
- userId
- locale

### Features

- Send a message with context

```typescript
 client.sendProductMessage({
    question: 'YOUR_QUESTION', // required
    productId: 'PRODUCT_ID', // required
    productTitle: 'PRODUCT_TITLE', // required
    answer: '', // Optional
    selectedVariantId?: 'CURRENT_VARIANT_ID', // Optional
 })
```

- Send message without context

```typescript
client.sendGenericMessage({
  question: 'YOUR_QUESTION', // required
});
```

- Open the assistant with suggested questions

The assistant opens on a list of questions the shopper can click. With a `product`, a clicked question is asked about that product.

```typescript
client.openAssistantWithSuggestions({
  questions: [{ question: 'YOUR_QUESTION' }], // required, e.g. suggestions.questions
  product: { // Optional
    id: 'PRODUCT_ID',
    title: 'PRODUCT_TITLE',
    handle: 'PRODUCT_HANDLE', // Optional
    selectedVariantId: 'CURRENT_VARIANT_ID', // Optional
  },
});
```

- Get locale information

```typescript 
const localizationInfos = await client.getLocalizationInformations();

/*
Example of expected result when locale: 'en'
{
  countryCode: "US",
  formatted: "en-US",
  language: "English",
  locale: "en"
}
*/
```

- Get suggestion questions

You can use this query to make your own integration and trigger `sendProductMessage` or `sendGenericMessage` on user click.

```typescript
const suggestions = await client.getSuggestions(productId);
// Up to 5 questions (default 2):
const moreSuggestions = await client.getSuggestions(productId, { limit: 5 });

/*
Example of expected result:
{
    "questions": [
        {
            "question": "What is the formula used in this repairing gel to soothe the skin after sun exposure?"
        },
        {
            "question": "How does this gel relieve sunburn and reduce pain?"
        },
        {
            "question": "What are the benefits for the skin after using this product following excessive exposure to UV rays?"
        }
    ],
    "assistantName": "Your expert",
    "inputPlaceholder": "Ask any question...",
    "description": "Ask any question about this product"
}
*/
```


- Search products

`client.search()` sends a multi-index request to the public search API. Build names with `searchIndexName(index, language, country)`: `<index>_<lang>_<country>`, e.g. `products_fr_be`. Supported indices: `products`, `collections`, `articles`, `pages`. Language must be a lowercase ISO 639-1 code (`fr`, `en`). Regional locales such as `fr-FR` are rejected. The country is the shopper's ISO 3166-1 alpha-2 code, lowercased in the index name.

The country is required and independent of language: `fr` with `CA` produces `products_fr_ca`. Product prices are in the base currency of the market that sells to that country. Names without a country suffix return 404.

```typescript
import { Dialog, DialogSearchError, searchIndexName } from '@askdialog/dialog-sdk';
import type { SearchResponse } from '@askdialog/dialog-sdk';

const client = new Dialog({ apiKey: 'YOUR_API_KEY', locale: 'fr-FR', currency: 'EUR' });

const response: SearchResponse = await client.search({
  requests: [
    {
      indexName: searchIndexName('products', 'fr', 'BE'), // "products_fr_be"
      query: 'shampoo',
      page: 0, // optional, zero-indexed (default 0)
      hitsPerPage: 20, // optional, 1-100 (default 20)
    },
  ],
});
// response.results[n]: { index, hits, nbHits, page, nbPages, hitsPerPage,
//                        processingTimeMS, query, queryID }
// A products hit is Algolia's Shopify record (`SearchProductHit`), plus `url`
// and `currency`: { objectID (variant id), id (product id), title?, handle?,
// url?, image?, variants_min_price?, price?, compare_at_price?, ..., _display }
// Collection hits are `SearchCollectionHit`, Algolia's collection record:
// { objectID, title?, handle?, url?, body_html_safe?, image?, products_count?, ..., _display }
// Article hits are `SearchArticleHit`, Algolia's article record:
// { objectID, title?, handle?, tags, blog?: { title?, handle? }, author?: { name },
//   image?, published_at?, updated_at?, body_html_safe?, url?, _display }
// Page hits are `SearchPageHit`, Algolia's page record:
// { objectID, title?, handle?, author?, updated_at?, body_html_safe?, url?, _display }
// Every hit carries `_display` (`SearchHitDisplay`), what to display computed by
// the server: `{ image?, title, url }`, `image` being `{ url, shape }` with
// `shape` one of `'theme' | 'square' | 'rounded' | 'round'`; a product's (`SearchProductHitDisplay`)
// adds `price`, `compare_at_price?` (formatted in the market currency) and
// `lines` (`{ position: 'above_title' | 'below_title', text }[]`). `url` is
// absolute, or relative to the storefront's locale root, e.g. `products/creme-lift`.
// The SDK and its components display what `_display` says only.
```

With the IIFE bundle the results are plain runtime JSON (same shape, no types):

```html
<script src="https://d2m6yt8rnm4dos.cloudfront.net/dialog-sdk.X.Y.Z.min.js"></script>
<script>
  const client = new window.DialogSDK.Dialog({ apiKey: 'YOUR_API_KEY', locale: 'fr-FR', currency: 'EUR' });
  client
    .search({ requests: [{ indexName: 'products_fr_be', query: 'shampoo' }] })
    .then((response) => console.log(response.results[0].hits));
</script>
```

A non-2xx answer rejects with `DialogSearchError` — stable `name`, HTTP `status` and `message` (e.g. `404 Index products_xx does not exist`, `400 Unknown parameter: foo`). Aborting rejects with the native `AbortError`, and network failures keep their native errors.

`client.search()` sends requests unchanged, without debounce, caching or automatic cancellation. Use the search controller below for interactive search.

- Search controller and connectors

The search API is built like InstantSearch: a search controller holds the state, and headless connectors read and change it and apply the display rules. A surface only binds DOM events to connector actions and renders. It is exported by the SDK root and by its `@askdialog/dialog-sdk/search` alias.

```typescript
import {
  connectHits,
  connectPagination,
  connectSearchBox,
  connectStats,
  createSearchController,
  Dialog,
} from '@askdialog/dialog-sdk';

const client = new Dialog({ apiKey: 'YOUR_API_KEY', locale: 'fr-FR', currency: 'EUR' });

const controller = createSearchController({
  transport: (request, options) => client.search(request, options),
  language: 'fr',
  country: 'BE', // shopper's country
  analytics: {
    surface: 'search_page',
    trackViewSearchResults: (params) => client.trackViewSearchResults(params),
    trackSelectSearchResult: (params) => client.trackSelectSearchResult(params),
    trackOpenedSearch: (params) => client.trackOpenedSearch(params),
  },
  apiKey: 'YOUR_API_KEY', // optional: loads the merchant config (business ranking, filterable attributes)
  storefrontRoot: window.Shopify?.routes?.root ?? '/', // optional: where relative `_display.url`s resolve
});

const searchBox = connectSearchBox(controller);
const hits = connectHits(controller);
const stats = connectStats(controller);
const pagination = connectPagination(controller);

input.onfocus = () => searchBox.open(); // search opened, empty-query search
input.oninput = () => searchBox.refine(input.value); // debounced
form.onsubmit = (event) => {
  event.preventDefault();
  searchBox.submit(input.value); // immediate
};

hits.subscribe(({ hits: productHits }) => {
  renderCards(productHits.map(({ display }) => display)).forEach((element, index) => {
    hits.observe(element, index); // viewport impression
    element.onclick = (event) => {
      if (hits.select(index)) event.preventDefault(); // attribution, then `navigate`
    };
  });
});
stats.subscribe(({ text }) => (count.textContent = text)); // "12 résultats"
pagination.subscribe(({ visible, pages, currentPage }) => renderPages(visible, pages, currentPage));
nextButton.onclick = () => pagination.refine(pagination.getRenderState().currentPage + 1);

// On unmount.
[searchBox, hits, stats, pagination].forEach((connector) => connector.dispose());
controller.dispose();
```

**Controller.** `createSearchController(options)` takes:

| Option | Description |
|--------|-------------|
| `language`, `country` | The shopper's ISO 639-1 language and ISO 3166-1 alpha-2 country, e.g. `fr` and `BE` |
| `currency` | The ISO 4217 currency of the shopper's market, e.g. `EUR` (Shopify's `window.Shopify.currency.active`), which filter prices are written in; without it they show as bare amounts |
| `analytics` | `surface` and the `trackViewSearchResults`, `trackSelectSearchResult` and `trackOpenedSearch` callbacks; the controller batches and deduplicates impressions |
| `navigate` | Called with a product's URL after its selection is recorded; omit it to keep native link navigation |
| `storefrontRoot` | The path a relative `_display.url` resolves under, e.g. `/` or `/fr-fr/` (Shopify's `window.Shopify.routes.root`); default `/` |
| `buildProductUrl` | Deprecated and ignored: every hit's `_display.url` is its link |
| `debounceMs`, `hitsPerPage` | Delay before a query change is sent (default 100) and products per page (default 12) |
| `sections` | Indexes searched next to products (`[{ index: 'collections', hitsPerPage: 5 }]`, or a function resolved per request): `collections`, `articles`, `pages` and `query_suggestions` (5 hits unless `hitsPerPage` says otherwise). The empty query searches only `query_suggestions` |
| `mode` | `lexical` (default) or `ai`, fixed at creation. `ai` searches `/public/search/ai`: products only, no section, and no request for a query under 2 characters (the results stay idle) |
| `transport` | Replaces the mode's transport: a search function bound to its client (`client.search`), or a custom one |
| `apiKey` | Binds the mode's transport when `transport` is absent (one of the two is required), and loads the merchant config at the first `open()` or search, once per API key and language for all the page's controllers |
| `config` | The merchant config (`{ businessRanking?, searchConfig? }`) when the surface already has it; nothing is then loaded |
| `texts` | Overrides of the default texts |
| `initialSearchState` | The search state to start from |
| `routing` | Keep the products entry's query, page and refinements in the URL (see **Routing**) |

The client uses a BCP-47 `locale` such as `fr-FR` for assistant localization. Search controllers and React/Vue hooks require explicit `language` (ISO 639-1) and `country` (the shopper's ISO 3166-1 alpha-2 country), independently of the client locale.

For Shopify, use `window.Shopify.country` as the country. Controller options are fixed at creation; recreate the controller to change language or country.

Analytics send each product hit's `id` (the product id) as `product_id`; `navigate` receives `controller.productUrl(hit)`: the hit's `_display.url`, a relative one resolved under `storefrontRoot`.

`controller.getSnapshot()` returns `{ searchState, results, context }`, the same object until the next change. `subscribe(listener)` calls the listener with each new snapshot and returns an unsubscribe function.

- `searchState`: what the shopper asks for, the only writable part. It has InstantSearch's `uiState` shape, keyed by index name:

  ```typescript
  { products_fr_be: { query: 'shampoo', page: 2 } } // zero-based page, absent means 0
  ```

  The products entry also takes InstantSearch's `refinementList` (`{ color: ['red', 'blue'] }`: OR within an attribute, AND across) and `range` (`{ price: '10:50' }`, bounds inclusive, either side empty), plus `filters`: raw `facetFilters` and `numericFilters` (`SearchFilters`) for what the other two cannot express, an exclusion, a mix of attributes in one OR group, a strict or exact bound. All three are sent as the products request's `facetFilters` and `numericFilters`, `filters` as they are; sections are never filtered. A `refinementList` attribute the search config does not declare as `keyword` or `boolean`, or a `range` one it does not declare as `number`, is dropped when the request is built.

  Change it with `setSearchState(updater)`, an object or a function of the previous state. Any change other than `page` resets the page to 0. A query change is sent after the debounce, any other change at once; `search()` sends a pending query now.
- `results`: read-only. `status` (`idle`, `loading`, `success`, `empty` or `error`), `products` (the products `SearchResult`, kept while the next one loads, cleared on error and on `close()`), `sections` and `error`. On the `ai` mode, also `filters` (the filters the products result applied, one block per `source`: `query_constructor` for those the engine read from the query, `user` for the shopper's) and `attributeLabels` (each filtered attribute's label).
- `context`: read-only. `mode`, `language`, `country`, `currency`, `businessRanking`, `filterableAttributes` (empty until the config loads, or when its loading fails; a loaded search config gains `price` as a `number` attribute, last, labelled `texts.filterFields.price`, so a range on price is sent; an attribute may carry `showInSearch: false`, the merchant hiding it from the search page) and `texts`: the default texts of the language (ar, de, en, es, fr, it, ja, ko, nl, pl, pt; English otherwise) with the `texts` overrides applied.

`open()` emits the search opened signal on each focus and, with no query, runs the empty-query search. `close()` cancels requests, flushes the impressions already qualified and returns to idle with no query; the next `open()` runs the empty-query search again. `retry()` replays a failed request; `dispose()` cancels requests and removes subscribers and observers. `observeHit`, `selectHit` and `productUrl` are what connectors call. Create one controller per search surface.

**Routing.** With `routing: true`, the controller starts its products entry from the URL and writes it back with each request: `q`, `page` (1-indexed, absent on page 1), `f.<attribute>=<value>` once per `refinementList` value and `price=<min>:<max>` for the `price` range, keeping the other params and the hash. A query change replaces the history entry; any other change (filters, page) pushes one. Back and forward search the state they lead to, pushing nothing. A refinement on an attribute the search config does not declare with its type, and a malformed or reversed `price`, are ignored; with the config loaded rather than passed, the URL's refinements are kept until it arrives. Call `search()` to run the search the URL describes.

```typescript
const controller = createSearchController({ ...options, apiKey, routing: true });
controller.search(); // /search?q=chemise&f.color=Bleu&price=:50&page=2

// Another URL format, e.g. /search/chemise?colors=Bleu,Rouge
createSearchController({
  ...options,
  routing: {
    createURL: ({ routeState, location }) =>
      `/search/${encodeURIComponent(routeState.query)}?colors=${(routeState.refinementList?.color ?? []).join(',')}`,
    parseURL: ({ location }) => ({
      query: decodeURIComponent(location.pathname.split('/')[2] ?? ''),
      page: 0,
      refinementList: { color: new URLSearchParams(location.search).get('colors')?.split(',') ?? [] },
    }),
  },
});
```

`routeState` is `{ query, page, refinementList?, range? }` (`SearchRouteState`, zero-based `page`); `createURL` returns a URL absolute or relative to `location`. Outside a browser, `routing` does nothing.

**Draft.** `controller.createDraft()` returns a controller over a copy of the search state that shows the parent's results and context and sends no request, e.g. for a filters sheet: connectors work on it as on the controller. `commit()` applies its search state to the parent in one search; `discard()` drops it. Either ends the draft.

**Connectors.** `connectX(controller)`, plus `{ attribute }` for the refinement list (and an optional `limit`) and the range and `{ apiKey }` or `{ transport }` for the AI Overview, returns `getRenderState()`, `subscribe(listener)`, `dispose()` and its actions. The render state stays the same object while nothing it reads changes, so it fits React's `useSyncExternalStore` or a Vue `shallowRef`. Actions do nothing once disposed.

| Connector | Render state | Actions |
|-----------|--------------|---------|
| `connectSearchBox` | `query` (the input's value, pending input included), `status` | `refine(query)` (debounced), `submit(query?)` (now), `clear()`, `open()` (on focus), `close()` |
| `connectHits` | `hits` (`{ hit, display }[]`), `query` (the one the hits answer), `title` (the business ranking's on the empty query, else the products label) | `observe(element, index)`, `select(index, { navigate? })`: returns true when `navigate` ran; call `preventDefault()` then |
| `connectInfiniteHits` | `hits` (`{ hit, display }[]`, every page fetched so far in page order; on the `ai` mode `{ hit }[]`, the raw hits with no `display`), `nbHits` (the engine's total, kept while the next page loads), `isLastPage`, `loadingMore`, `failedMore` (the fetched pages stay). A search starting over at page 0 (new query, other refinements, retry of page 0) drops the fetched pages from its first frame | `showMore()`: requests the next page, ignored while loading, on the last page or with a query pending; `retryMore()`: replays the page that failed |
| `connectStats` | `nbHits`, `text` (the count in the shopper's language) | — |
| `connectPagination` | `visible` (false while loading, with a query pending or with a single page), `currentPage` (zero-based), `nbPages`, `isFirstPage`, `isLastPage`, `pages`: the first, the last and the current ±2 as `{ type: 'page', page }`, with an `{ type: 'ellipsis' }` for each gap | `refine(page)`: ignored while hidden or out of range |
| `connectSections` | `collections`, `articles`, `pages` (only hits with a link): `{ hit, display }[]`, empty on the empty query | — |
| `connectQuerySuggestions` | `suggestions`: the `query_suggestions` section's hits (`{ objectID, query, popularity }`) as `{ hit, parts }[]`, in the order returned. `parts` is `hit.query` in runs `{ text, highlighted }`, the leading part matching the typed text `highlighted`, ignoring case and accents; nothing highlighted on the empty query, where the search returns the most popular when the merchant chose them | `applySuggestion(query)`: sets the query and searches it at once, without the debounce |
| `connectRefinementList(controller, { attribute, limit? })` | `attribute`, `label` (the search config's), `items`: the search config's values as `{ value, isRefined }`. Checked are the visitor's values in `refinementList`, else, on an AI result, the ones the engine detected in the query. With `limit`, folded: the first `limit` values and every checked one further down, in its place; all of them when the fold would hide fewer than 2. `isShowingMore`, `canToggleShowMore` (the fold hides values), `foldedCount` (how many, for `texts.seeMore(count)`) | `refine(value)`: checks or unchecks it in `refinementList`, starting from the values shown checked; unchecking the last detected value keeps the attribute as `[]`. `toggleShowMore()`: unfolds or folds again |
| `connectRange(controller, { attribute })` | `attribute`, `min` and `max` (the fields as typed, else the search state's bounds; empty for none), `minAboveMax` | `refine(min, max)`: writes the fields to `range`, an empty field removing its bound; a floor above the ceiling only shows the error |
| `connectCurrentRefinements` | `items`: one chip per filter group the products search sent, `{ attribute, label, value, text, detected, removable }`. `label` is the attribute's published label (`results.attributeLabels`, else the search config's), else the default one of the language; `value` the group's values alone (`≤ 30,00 €`, `Nike or Puma`); `text` the whole group in words (`Price up to €30.00`); prices are written in `currency`. On the `ai` mode, the groups the engine detected in the query come first, `detected` and read-only; then the shopper's from `filters`, `refinementList` and `range`, in the request's order. An exclusion or a group mixing attributes is read-only | `remove(chip)`: takes a removable chip of the current render state off the search state (its `filters` group, its `refinementList` attribute or its `range` bound); does nothing for any other chip |
| `connectClearRefinements` | `canRefine`: the products request sends a value or a bound the visitor picked | `refine()`: removes every `refinementList` and `range` in one change, keeping the query |
| `connectDynamicWidgets` | `attributesToRender`: the attributes to give a filter section, the `keyword` ones with values in the search config's order, then `price` when declared as a `number`; boolean, date and valueless ones, and any with `showInSearch: false`, are left out | — |

A hit's `display` is ready to render, from its `_display` and, for `titleParts`, its `_highlightResult`. A product's: `title`, `titleParts` (the title in runs `{ text, highlighted }`, `highlighted` on the parts the engine wrapped in `<em>` in `_highlightResult.title.value`, text unescaped; one plain run when the hit has no `_highlightResult` or its `matchLevel` is `none`; render each run as text, never `value` as HTML), `href` (`_display.url`, a relative one resolved under `storefrontRoot` and kept only on the storefront's origin; http(s) only), `image`, `price`, `compareAtPrice` (empty unless higher than the price), `lineAboveTitle` and `lineBelowTitle` (the first display line at each position). A section hit's: `title`, `titleParts`, `href` and `image`. `image` is `_display.image`, `{ url, shape }`: draw `url` in `shape`, `theme` with the surface's own corners, `square` with straight ones, `rounded` with rounded ones and `round` as a circle.

**Helpers.** The subpath also exports the shared UI helpers the connectors use, for a surface that formats in its own locale: `getSearchTexts(locale, overrides?)`, `formatSearchPrice(hit, locale)`, `formatSearchCompareAtPrice(hit, locale)`, `hitTitle`, `hitImage`, `hitHref(hit, root?)`, `resolveDisplayUrl(url, root?)`, `safeHref`, `navigableCollections`, `highlightedTitleParts(title, highlightResult)` and `resolveSearchPanelVariables(theme)`; plus `SearchStatus`, `DialogSearchError` and the types of the snapshot and the hits.

**AI transports.** `searchAi(apiKey, request, options?)` posts to `/public/search/ai` and `searchAiOverview(apiKey, request, options?)` to `/public/search/ai/overview` (the text and filter suggestions about an AI search's first page). Both send the request as is, extra fields included, with the API key header and `options.signal`; an HTTP error rejects with `DialogSearchError`, and past 30 s the request aborts and rejects with a `TimeoutError` `DOMException`.

**AI Overview.** `connectAiOverview(controller, { apiKey })`, on an `ai` controller, requests the overview once page 0 answers, with its query, filters, hit count and first 3 object IDs, and keeps it while later pages load. Pass `{ transport }` instead of `apiKey` to send it your way, e.g. with the visitor's session added. A request is sent once per page and transport, whichever connector or search asks for it again; one no connector waits for any more is aborted. Render state: `status` (`idle` without an AI search, `loading` until page 0 and its overview answer, `success`, `error` when either fails), `text`, `suggestions` (`{ label, filters }[]`) and `attributeLabels`. `applySuggestion(suggestion)` replaces every filter of the search state with the suggestion's, in one search: a group picking values of one attribute goes to `refinementList` and inclusive bounds to `range` when the search config declares the attribute with that type, the rest to `filters`. It writes no URL; a surface syncing the search state to its URL decides whether to.

The raw JavaScript reference adapter, on this API, lives in [`packages/search-example`](../search-example).

- Handler for fetch product

The `getProduct` callback is called by the assistant to display product information. You must return an object matching the `SimplifiedProduct` interface.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | `string` | Yes | The product identifier |
| `variantId` | `string` | No | The selected variant identifier |

**Return type: `SimplifiedProduct`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Product identifier |
| `title` | `string` | Yes | Product name |
| `handle` | `string` | Yes | URL-friendly product slug |
| `totalInventory` | `number` | Yes | Total available stock across all variants |
| `variants` | `SimplifiedProductVariant[]` | Yes | List of product variants (see below) |
| `descriptionHtml` | `string` | No | Product description in HTML |
| `url` | `string` | No | Product page URL |
| `featuredImage` | `{ url?: string } \| null` | No | Main product image |
| `options` | `SimplifiedProductOption[]` | No | Product options (size, color, etc.) |

**Variant: `SimplifiedProductVariant`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Variant identifier |
| `price` | `string` | Yes | Variant price (e.g. `"29.99"`) |
| `currencyCode` | `string` | Yes | ISO 4217 currency code (e.g. `"EUR"`, `"USD"`) |
| `displayName` | `string` | No | Variant display name |
| `inventoryQuantity` | `number` | No | Available stock for this variant |
| `compareAtPrice` | `string \| null` | No | Original price before discount |
| `url` | `string` | No | Variant-specific page URL |
| `selectedOptions` | `{ name: string; value: string }[]` | No | Option values for this variant (e.g. `[{ name: "Size", value: "M" }]`) |
| `image` | `{ url?: string } \| null` | No | Variant-specific image |

**Option: `SimplifiedProductOption`** *(optional)*

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Option identifier |
| `name` | `string` | Yes | Option name (e.g. `"Size"`, `"Color"`) |
| `position` | `number` | Yes | Display order |
| `values` | `string[]` | Yes | Available values (e.g. `["S", "M", "L"]`) |

**Example:**

```typescript
const client = new Dialog({
    ...,
    callbacks: {
        getProduct: async (
            productId: string,
            variantId?: string,
        ): Promise<SimplifiedProduct> => {
            const response = await fetch(`https://your-api.com/products/${productId}`);
            const data = await response.json();

            return {
                id: data.id,
                title: data.name,
                handle: data.slug,
                totalInventory: data.stock,
                featuredImage: { url: data.imageUrl },
                variants: data.variants.map((v: any) => ({
                    id: v.id,
                    price: v.price.toString(),
                    currencyCode: 'EUR',
                    displayName: v.name,
                    inventoryQuantity: v.stock,
                    compareAtPrice: v.originalPrice?.toString() ?? null,
                    selectedOptions: v.options,
                    image: v.imageUrl ? { url: v.imageUrl } : null,
                })),
                options: data.options?.map((o: any) => ({
                    id: o.id,
                    name: o.name,
                    position: o.position,
                    values: o.values,
                })),
            };
        },
    },
});
```

- Handler for add to cart

```typescript
const client = new Dialog({
    ...,
    callbacks: {
        addToCart: ({
            productId,
            quantity,
            variantId,
            currency
        }: {
            productId: string;
            quantity: number;
            currency?: string;
            variantId?: string;
        }): Promise<void> => {
            // Call your api to trigger addToCart
            const response = await fetch('....');

            // Trigger other stuff like confirmation modal
            return;
        }
    },
});
```


### Theming (Still in construction)

We are currently working on the theming part so you may find some issues. Contact us if you need more customization.


⚠️ Title, description and content properties are used only to theme the Vue component for the moment.

```typescript
const client = new Dialog({
  ...,
  theme: {
    backgroundColor?: string;
    primaryColor?: string;
    ctaTextColor?: string;
    ctaBorderType?: 'straight' | 'rounded';
    capitalizeCtas?: boolean;
    fontFamily?: string;
    highlightProductName?: boolean;
    title?: { // Used in Vue component only
        fontSize?: string;
        color?: string;
    }
    description?: { // Used in Vue component only
        fontSize?: string;
        color?: string;
    }
    content?: { // Used in Vue component only
        fontSize?: string;
        color?: string;
    }
  }
});
```

### Tracking

Our SDK includes a tracking system to monitor user interactions in your purchase flow.

#### Automatic Tracking

When a user interacts with our assistant and clicks on an "Add to Cart" CTA, it automatically triggers the previously configured `addToCart` callback (see "Client Instantiation" section). These events are tracked internally by our system.

#### Manual Tracking

However, we cannot automatically detect cart additions or checkout completions that occur **after** using our assistant. To get accurate data in your Dialog dashboards, you should use the following tracking methods:

#### Available Methods

```typescript

client.registerAddToCartEvent({
    productId: 'ProductIdentifier', // {string} - Required
    quantity: 1, // {number} - Required
    currency: 'EUR', // {string} - Optional
    variantId: 'VariantIdentifier', // {string} - Optional
    price: '12.00' // {string} - Optional
});

// Checkout is order-level: call ONCE per completed order with the order total.
// `orderValue` is what the "Revenue generated" dashboard reads.
// Do NOT call this per line item — without an order total, revenue resolves to 0.
client.registerSubmitCheckoutEvent({
    orderValue: 59.98, // {number} - Required - the order total
    currency: 'EUR', // {string} - Optional
    transactionId: 'OrderIdentifier', // {string} - Optional - order id, used to de-duplicate reloads
    items: [ // {array} - Optional - line items, for product-level attribution only
        { productId: 'ProductIdentifier', quantity: 1, price: 29.99, variantId: 'VariantIdentifier' },
    ],
});

// Deprecated per-line signature — still accepted for backward compatibility,
// but carries no order total so revenue cannot be computed. Prefer the call above.
client.registerSubmitCheckoutEvent({
    productId: 'ProductIdentifier',
    quantity: 1,
    price: '12.00',
    currency: 'EUR',
});
```

#### Impressions

`createImpressionTracker` measures views of any list of elements with the Dialog rule: an item counts once it is at least 50 % visible for 1 continuous second, once per item until `reset()`. Counted item ids go out in batches: after 1.5 s without a new impression, at 100 items, on `flush()`, `reset()`, `disconnect()` and on the `pagehide` event. A page restored from the back/forward cache counts its items again. Import it from `@askdialog/dialog-sdk/impressions` to load it alone, with no dependency.

```typescript
import { createImpressionTracker } from '@askdialog/dialog-sdk/impressions';

const impressions = createImpressionTracker({
    onImpressions: (itemIds) => send(itemIds), // {string[]} - in the order they qualified
});
impressions.observe(element, 'item-id'); // once per rendered element
impressions.record('item-id'); // count an item now, e.g. on click
impressions.reset(); // a new context: unwatches every element and counts every item again; observe the elements of the new context
impressions.disconnect(); // sends the pending batch and stops
```

The search controller tracks its result views with it.

#### Listen for Assistant Events

The SDK provides real-time event listening for user interactions with the Dialog assistant.

```typescript
// Basic event listener setup
const unsubscribe = client.onAssistantEvent((event) => {
  console.log('Event type:', event.type);
  console.log('Event payload:', event.payload);
});

// Clean up the event listener when needed
unsubscribe();
```

#### Event Structure

All events follow this structure:

```typescript
interface AssistantEvent {
  type: string;
  payload: {
    // Common fields (included in all events)
    date: string;        // ISO timestamp
    locale: string;      // BCP-47 locale
    currency: string;    // Current currency
    url: string;         // Current page URL
    userId?: string;     // User ID if available
    
    // Event-specific fields
    productId?: string;  // When interacting with products
    variantId?: string;  // When interacting with variants
  }
}
```

#### Available Event Types

- **userOpenedAssistant** - User opened the assistant interface
- **userClosedAssistant** - User closed the assistant interface  
- **userSentMessage** - User sent a message to the assistant
- **userClickedOnProductCard** - User clicked on a product card for more details
- **userOpenedRecommendation** - User clicked on a product recommendation
- **userAddedToCart** - User added a product to cart via the assistant
- **userSendPositiveFeedback** - User gave positive feedback on AI response
- **userSendNegativeFeedback** - User gave negative feedback on AI response

#### Example Usage

```typescript
client.onAssistantEvent((event) => {
  switch (event.type) {
    case 'userAddedToCart':
      // Track conversion in your analytics
      analytics.track('assistant_conversion', {
        productId: event.payload.productId,
        timestamp: event.payload.date
      });
      break;
      
    case 'userSendNegativeFeedback':
      // Log for improvement analysis
      console.log('Negative feedback at:', event.payload.url);
      break;
  }
});
```
