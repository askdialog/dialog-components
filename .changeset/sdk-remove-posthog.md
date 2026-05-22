---
"@askdialog/dialog-sdk": major
---

feat(sdk)!: remove the SDK's own PostHog instance

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
