---
"@askdialog/dialog-sdk": patch
---

fix(localization): derive language name from full locale so region variants are preserved

`getDetailedLocaleInfo` now names the language from `localeObj.baseName` instead of the bare language subtag. A `locale` of `en-GB` resolves to `"British English"` (previously `"English"`), `en-US` to `"American English"`, `fr-CA` to `"Canadian French"`, etc. This value is passed as `data-language` to the assistant and drives the response-language instruction in the backend prompt, so the assistant now answers in the merchant's regional variant (e.g. British vs American English spelling) when the integration provides a region-qualified locale.

Integrations must pass a region-qualified locale (e.g. `en-GB`, not `en`) for the variant to take effect; a bare language code still resolves to the generic name.
