import { Dialog, DialogSearchError } from "@askdialog/dialog-sdk";

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

let controller;

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

function renderProductCard({ product }) {
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
      if (response.nbHits === 0) {
        statusEl.textContent = `No products match “${response.query}”.`;
        return;
      }
      statusEl.textContent = `${response.nbHits} product${response.nbHits > 1 ? "s" : ""} for “${response.query}” (${response.processingTimeMs} ms)`;
      resultsEl.replaceChildren(...response.hits.map(renderProductCard));

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
  const dialog = new Dialog({ apiKey, locale: "fr" });
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
