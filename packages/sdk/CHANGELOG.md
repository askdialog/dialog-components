# @askdialog/dialog-sdk

## 1.2.0

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
