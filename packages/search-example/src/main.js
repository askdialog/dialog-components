import {
  createSearchImpressionTracker,
  Dialog,
  DialogSearchError,
} from "@askdialog/dialog-sdk";

import { createSearchController, SearchStatus } from "./searchController.js";

const apiKeySection = document.getElementById("api-key-section");
const apiKeyInput = document.getElementById("api-key-input");
const searchInput = document.getElementById("search-input");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const paginationEl = document.getElementById("pagination");
const prevButton = document.getElementById("prev-page");
const nextButton = document.getElementById("next-page");
const pageIndicator = document.getElementById("page-indicator");

const SURFACE = "search_page";

let dialog;
let controller;
let impressions;

// `query_id` stays stable across pagination but rotates on every new
// submission — even of the same text (the wire response regenerates one per
// request; the controller's `trigger` says which case this is).
let analyticsQueryId;

function searchEnvelope(response, trigger) {
  if (trigger === "query" || analyticsQueryId === undefined) {
    analyticsQueryId = response.queryId;
  }
  return {
    query_id: analyticsQueryId,
    surface: SURFACE,
    // Analytics pages are 1-based; the wire response is 0-based.
    page: response.page + 1,
    total_hits: response.nbHits,
    query_length: [...response.query].length,
  };
}

function resultPosition(response, index) {
  return response.page * response.hitsPerPage + index + 1;
}

function formatPrice(priceRange) {
  if (priceRange === undefined) {
    return "";
  }
  const { min, max } = priceRange;
  const format = ({ amount, currencyCode }) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
    }).format(Number(amount));
  return min.amount === max.amount
    ? format(min)
    : `${format(min)} – ${format(max)}`;
}

/**
 * Catalog data is untrusted: only allow http(s) links so a `javascript:` URL
 * cannot execute script. Relative URLs resolve against the page and pass.
 */
function safeProductHref(url) {
  try {
    const { protocol } = new URL(url, window.location.href);
    return protocol === "http:" || protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function renderProductCard({ product }, item, envelope) {
  const li = document.createElement("li");
  li.className = "card";

  const image = document.createElement("div");
  image.className = "card-image";
  if (product.imageUrl !== undefined) {
    const img = document.createElement("img");
    img.src = product.imageUrl;
    img.alt = product.title ?? product.id;
    img.loading = "lazy";
    image.appendChild(img);
  }
  li.appendChild(image);

  const title = document.createElement("p");
  title.className = "card-title";
  title.textContent = product.title ?? product.id;
  li.appendChild(title);

  const meta = document.createElement("p");
  meta.className = "card-meta";
  const price = formatPrice(product.priceRange);
  const stock =
    product.inStock === undefined
      ? ""
      : product.inStock
        ? "In stock"
        : "Out of stock";
  meta.textContent = [price, stock].filter(Boolean).join(" · ");
  li.appendChild(meta);

  const href =
    product.url === undefined ? undefined : safeProductHref(product.url);
  if (href !== undefined) {
    const link = document.createElement("a");
    link.className = "card-link";
    link.href = href;
    link.textContent = "View product";
    // Also on auxclick: a middle-click / new-tab open is a selection too. The
    // click forces the item's impression so CTR by position stays ≤ 100%; the
    // host bridge owns the beacon transport that survives navigation.
    const trackSelect = () => {
      impressions.forceImpression(item);
      dialog.trackSelectSearchResult({ ...envelope, items: [item] });
    };
    // Demo-only: seed URLs are fake, so same-tab navigation is suppressed to
    // keep the console (and its logged events) alive. Real integrations must
    // NOT preventDefault — the event is designed to survive navigation.
    link.addEventListener("click", (event) => {
      event.preventDefault();
      trackSelect();
    });
    // auxclick also fires on right-click, which only opens a context menu:
    // only the middle button is a navigation.
    link.addEventListener("auxclick", (event) => {
      if (event.button === 1) {
        trackSelect();
      }
    });
    li.appendChild(link);
  }

  return li;
}

function describeError(error) {
  if (error instanceof DialogSearchError) {
    return `Search failed (${error.status}${error.code ? ` ${error.code}` : ""}): ${error.message}`;
  }
  return "Search failed: network error. Check your connection and try again.";
}

function render(state) {
  resultsEl.replaceChildren();
  paginationEl.hidden = true;
  statusEl.classList.toggle(
    "status-error",
    state.status === SearchStatus.ERROR,
  );

  switch (state.status) {
    case SearchStatus.IDLE:
      statusEl.textContent = "Start typing to search the catalog.";
      return;
    case SearchStatus.LOADING:
      statusEl.textContent = `Searching “${state.query}”…`;
      return;
    case SearchStatus.ERROR:
      statusEl.textContent = describeError(state.error);
      return;
    case SearchStatus.SUCCESS: {
      const { response } = state;
      // Analytics keys off the accepted response actually being rendered: the
      // controller already dropped stale/canceled responses, and impressions
      // are viewport-driven (tracker) — a network answer alone never counts.
      const envelope = searchEnvelope(response, state.trigger);
      impressions.setContext(envelope);
      if (response.nbHits === 0) {
        statusEl.textContent = `No products match “${response.query}”.`;
        // A rendered no-results state is the view event with zero items; the
        // empty-state message shows above the fold, no viewport gating needed.
        dialog.trackViewSearchResults({ ...envelope, items: [] });
        return;
      }
      statusEl.textContent = `${response.nbHits} product${response.nbHits > 1 ? "s" : ""} for “${response.query}” (${response.processingTimeMs} ms)`;
      resultsEl.replaceChildren(
        ...response.hits.map((hit, index) => {
          const item = {
            product_id: hit.product.id,
            position: resultPosition(response, index),
          };
          const card = renderProductCard(hit, item, envelope);
          impressions.observe(card, item);
          return card;
        }),
      );

      if (response.nbPages > 1) {
        paginationEl.hidden = false;
        pageIndicator.textContent = `Page ${response.page + 1} / ${response.nbPages}`;
        prevButton.disabled = response.page === 0;
        nextButton.disabled = response.page >= response.nbPages - 1;
      }
      return;
    }
  }
}

function start(apiKey) {
  dialog = new Dialog({ apiKey, locale: "fr" });
  impressions = createSearchImpressionTracker({
    emit: (params) => dialog.trackViewSearchResults(params),
  });
  controller = createSearchController({
    search: (request, options) => dialog.search(request, options),
    onState: render,
  });

  apiKeySection.hidden = true;
  searchInput.disabled = false;
  searchInput.focus();
  render(controller.getState());
}

searchInput.addEventListener("input", () => {
  controller.setQuery(searchInput.value);
});

prevButton.addEventListener("click", () => {
  controller.setPage(controller.getState().response.page - 1);
});

nextButton.addEventListener("click", () => {
  controller.setPage(controller.getState().response.page + 1);
});

const envApiKey = import.meta.env.VITE_DIALOG_API_KEY;
if (typeof envApiKey === "string" && envApiKey.length > 0) {
  start(envApiKey);
} else {
  apiKeySection.hidden = false;
  apiKeyInput.addEventListener("change", () => {
    if (apiKeyInput.value.length > 0) {
      start(apiKeyInput.value);
      apiKeyInput.value = "";
    }
  });
}
