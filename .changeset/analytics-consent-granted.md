---
"@askdialog/dialog-sdk": minor
---

New optional constructor option `analyticsConsent` (type `'granted'`, omitted by default). When set, the SDK declares the analytics consent to the injected assistant (via `data-analytics-consent` on the mounted `#dialog-shopify-ai` div), which then sends analytics events from the first page view instead of waiting for a consent signal.

Context: the assistant only sends analytics once it detects a consent signal (Google Consent Mode, TCF v2, OneTrust). A site with no cookie banner emits none, so add-to-cart and checkout events were never collected there. The option works like a Google Consent Mode `default` state: a refusal coming from a consent platform present on the page still turns analytics off for that visitor. Default behavior is unchanged: omit the option and analytics stays gated on detection.

```ts
new Dialog({
  apiKey,
  locale,
  currency,
  analyticsConsent: 'granted', // no cookie banner on this site
})
```
