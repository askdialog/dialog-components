---
"@askdialog/dialog-sdk": minor
---

New optional constructor flag `ignoreOneTrustAutoBlock` (default `false`). When set, the SDK adds `data-ot-ignore` on the assistant script it injects, so OneTrust auto-blocking does not neutralize it for visitors who declined cookies.

Context: a `data-ot-ignore` placed by the merchant on their own SDK `<script>` tag only covers that tag — OneTrust auto-blocking also intercepts dynamically injected scripts by domain, which left the assistant unavailable to visitors who refused consent. The assistant gates analytics on consent internally (nothing is sent without an explicit opt-in), so loading it is safe; exempting it from the CMP nonetheless remains the merchant's compliance decision, hence opt-in.

```ts
new Dialog({
  apiKey,
  locale,
  ignoreOneTrustAutoBlock: true, // only for OneTrust auto-blocking setups
})
```
