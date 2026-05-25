---
"@askdialog/dialog-sdk": minor
---

feat(sdk): forward add-to-cart & checkout tracking to the host app

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
