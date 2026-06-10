# @askdialog/dialog-sdk

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
