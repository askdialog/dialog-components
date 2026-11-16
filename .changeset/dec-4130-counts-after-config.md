---
"@askdialog/dialog-sdk": patch
---

Facet counts wait for the merchant config (DEC-4130). A search sent while the merchant config loads (no `config` passed and none kept for the session) sends its hits at once, as before, and its counts once the config settles, with the config's attributes and `price`, for the search then current. It used to send a counts request for `price` alone with the hits, then a second one with the config's attributes when it loaded. A config that fails to load still sends the counts, for `price` alone. The hits request, a passed config, a config kept for the session and the `ai` mode are unchanged.
