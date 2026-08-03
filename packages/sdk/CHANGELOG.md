# @askdialog/dialog-sdk

## 2.4.0

### Minor Changes

- 98f000d: feat(sdk): expose enriched added-product data in add-to-cart surfaces (DEC-2336)

  `Dialog.addToCart` / `registerAddToCartEvent` now accept optional enriched fields describing the product actually added to cart — `productTitle`, `variantTitle`, `productUrl` — plus the PDP-context product under `pageProductId` / `pageVariantId`. The full input is forwarded to the merchant `callbacks.addToCart` and to the `TRACK_ADD_TO_CART` event, and the `userAddedToCart` assistant event payload type declares the same fields.

  This lets merchant analytics integrations (e.g. GA forwarding) track a Dialog-suggested product added from another product's PDP without resolving product data from the page context (which describes the visited PDP product, not the added one).

  All new fields are optional: existing integrations and older assistant versions keep working unchanged.

- 79f86f9: feat(sdk): add typed `dialog.search()` and make commerce callbacks optional (DEC-2447)

  New `dialog.search(request, options?)` method: a typed product search through the Nest public endpoint (`POST /public/search`). Stateless one-POST-per-call — no debounce, cache or retry; the caller owns cancellation through `options.signal`. Returns the Algolia-shaped envelope (`queryId`, `hits[].product` cards with title/image/priceRange/inStock, pagination) and throws a `DialogSearchError` carrying `status` and `code` on failure. New exports: `DialogSearchError` and the `SearchRequest`/`SearchResponse`/`SearchOptions` types.

  Commerce callbacks (`addToCart`, …) are now optional at construction, so search-only integrations can do `new Dialog({ apiKey, locale })` without wiring cart handlers; commerce entry points throw a descriptive error if invoked without them.

## 2.3.0

### Minor Changes

- 0a4f438: feat(sdk): merge `window.dialog` defensively and register installation audit metadata (DEC-2368)

  The constructor no longer overwrites `window.dialog` wholesale: fields owned by other installation paths (e.g. GTM's `setVariant`/`getVariant` and its pre-init `_queue`) are now preserved. `window.dialog.instance` and `window.dialog.version` keep working unchanged.

  The SDK also registers itself on the new shared audit surface `window.dialog.audit` (`methods` entry `{ method: 'sdk', version }`), so support can identify the installation path and version from the browser console. New exports: `registerDialogInstallation`, `addAuditCapability`, `exposeSdkOnWindowDialog` and the `DialogAudit*` types — the React/Vue wrappers use them to register their own entries.

## 2.2.0

### Minor Changes

- 78a5b40: `registerSubmitCheckoutEvent` now accepts an order-level payload: the order total (`orderValue`) plus optional `currency`, `transactionId` and `items[]`, sent once per completed order. This is what the dashboard's "Revenue generated" reads.

  The previous per-line signature (`{ productId, quantity, price }`) carried no order total, so revenue resolved to 0 for SDK-based integrations. It is now **deprecated but still accepted** — existing installs keep working after upgrading; migrate at your own pace.

  ```ts
  // preferred — once per order, with the total
  client.registerSubmitCheckoutEvent({
    orderValue: 59.98,
    currency: "EUR",
    transactionId: "ORDER-123",
    items: [{ productId, quantity, price, variantId }], // optional, attribution only
  });

  // still works (deprecated) — per line, no order total
  client.registerSubmitCheckoutEvent({
    productId,
    quantity,
    price,
    currency,
    variantId,
  });
  ```

  `registerAddToCartEvent` is unchanged.

## 2.1.0

### Minor Changes

- 597ad48: feat(sdk): add optional `countryCode` constructor parameter

  `Dialog` now accepts an optional `countryCode` (ISO 3166 alpha-2, e.g. `'FR'`, `'US'`). When provided it becomes the **effective region** and takes precedence over the region embedded in `locale`.

  Region resolution precedence:
  1. the explicit `countryCode` parameter (when a valid 2-letter code);
  2. the region embedded in `locale` (e.g. `en-US` → `US`);
  3. the region guessed from the language via `Intl.Locale.maximize()`.

  The effective region drives:
  - `data-country-code` — the price-formatting region;
  - `data-language` — the language display name, so `locale: 'en'` + `countryCode: 'GB'` resolves to `"British English"` (previously the variant only followed the locale).

  `data-shop-iso-code` is now always the **bare language subtag** (`fr`, `en`), never region-qualified. This keeps the assistant's `${language}-${countryCode}` price composition valid on every assistant version (fixing the `fr-FR-FR` class of crash) and preserves the backend's product-name translation lookup, which is keyed by a bare 2-letter locale.

  A bare language code with no explicit region keeps a generic language name (`'fr'` → `"French"`). The parameter is optional, so integrations that only pass `locale` keep their current behavior.

## 2.0.1

### Patch Changes

- fix(localization): derive language name from full locale so region variants are preserved. `getDetailedLocaleInfo` now names the language from `localeObj.baseName` (e.g. `en-GB` → "British English") instead of the bare language subtag.

## 2.0.0

### Major Changes

- ba085c0: feat(sdk)!: remove the SDK's own PostHog instance

  BREAKING CHANGE: the SDK no longer instantiates PostHog. It now only emits
  `TRACK_ADD_TO_CART` / `TRACK_SUBMIT_CHECKOUT` external events; the host app is
  responsible for capturing them (e.g. shopify-assistant's tracking bridge
  forwarding into its single PostHog instance). This removes the second PostHog
  instance that previously ran alongside the host app.

  Removed: the `Tracking` class export, the `TrackingEvents` enum, the `posthog-js`
  dependency, and the `posthogApiKey` config field.

  Migration: any consumer relying on the SDK to send add-to-cart / checkout events
  to PostHog on its own must now listen for the emitted events and forward them.
  Consumers without such a bridge will stop reporting these events.

## 2.0.0-beta.1

### Major Changes

- ba085c0: feat(sdk)!: remove the SDK's own PostHog instance

  BREAKING CHANGE: the SDK no longer instantiates PostHog. It now only emits
  `TRACK_ADD_TO_CART` / `TRACK_SUBMIT_CHECKOUT` external events; the host app is
  responsible for capturing them (e.g. shopify-assistant's tracking bridge
  forwarding into its single PostHog instance). This removes the second PostHog
  instance that previously ran alongside the host app.

  Removed: the `Tracking` class export, the `TrackingEvents` enum, the `posthog-js`
  dependency, and the `posthogApiKey` config field.

  Migration: any consumer relying on the SDK to send add-to-cart / checkout events
  to PostHog on its own must now listen for the emitted events and forward them.
  Consumers without such a bridge will stop reporting these events.

## 1.2.0-beta.0

### Minor Changes

- 8b8c1a9: feat(sdk): forward add-to-cart & checkout tracking to the host app

  `registerAddToCartEvent` and `registerSubmitCheckoutEvent` now also emit
  `TRACK_ADD_TO_CART` / `TRACK_SUBMIT_CHECKOUT` external events (via the
  `enableDialogAssistantEvent` CustomEvent) so a host app can capture them through
  its own PostHog instance, avoiding a second PostHog instance on the page. The
  SDK still tracks to its own PostHog for now — this is the additive first step;
  removing the SDK's PostHog instance is a follow-up breaking change.

  `EventsHandler` gains `notifyConsumerReady()` / `notifyConsumerGone()` and
  buffers tracking events until a consumer is ready, so events fired before the
  host listener attaches are flushed rather than lost. `Dialog.eventsHandler` is
  now exposed publicly so hosts can signal readiness.

## 1.1.0

### Minor Changes

- 354db6b: Add price field in the tracking (Add-to-cart & Checkout)

### Patch Changes

- 9200579: Setup changeset and monorepo

## 1.1.0-beta.3

### Minor Changes

- 354db6b: Add price field in the tracking (Add-to-cart & Checkout)

## 1.0.26-beta.2

### Patch Changes

- 9200579: Setup changeset and monorepo
