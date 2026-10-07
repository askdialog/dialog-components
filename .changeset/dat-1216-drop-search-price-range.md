---
"@askdialog/dialog-sdk": minor
---

Remove the search types left from the old contract (DAT-1216): `SearchPrice`, `SearchPriceRange` and `SearchHit.priceRange`. No index returns them; product prices are on `SearchProductHit`.
