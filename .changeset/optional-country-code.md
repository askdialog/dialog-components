---
"@askdialog/dialog-sdk": minor
---

feat(sdk): add optional `countryCode` constructor parameter

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
