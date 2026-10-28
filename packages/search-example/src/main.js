import { Dialog } from "@askdialog/dialog-sdk";
import {
  connectHits,
  connectPagination,
  connectSearchBox,
  connectStats,
  createSearchController,
  DialogSearchError,
  SearchStatus,
} from "@askdialog/dialog-sdk";

const apiKeySection = document.getElementById("api-key-section");
const apiKeyInput = document.getElementById("api-key-input");
const searchInput = document.getElementById("search-input");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const paginationEl = document.getElementById("pagination");
const prevButton = document.getElementById("prev-page");
const nextButton = document.getElementById("next-page");
const pageIndicator = document.getElementById("page-indicator");

// The connectors carry the display rules: each hit comes with a `display`
// (title, http(s) `href`, image, price formatted in the shopper's market).
function renderProductCard({ display }, index, hits) {
  const li = document.createElement("li");
  li.className = "card";

  const image = document.createElement("div");
  image.className = "card-image";
  if (display.image !== undefined) {
    const img = document.createElement("img");
    img.src = display.image;
    img.alt = display.title;
    img.loading = "lazy";
    image.appendChild(img);
  }
  li.appendChild(image);

  const title = document.createElement("p");
  title.className = "card-title";
  title.textContent = display.title;
  li.appendChild(title);

  const meta = document.createElement("p");
  meta.className = "card-meta";
  meta.textContent = display.price;
  li.appendChild(meta);

  if (display.href !== undefined) {
    const link = document.createElement("a");
    link.className = "card-link";
    link.href = display.href;
    link.textContent = "View product";
    // `select` records attribution (forced impression + select event,
    // so CTR by position stays ≤ 100%) — also on auxclick: a middle-click /
    // new-tab open is a selection too.
    // Demo-only: seed URLs are fake, so same-tab navigation is suppressed to
    // keep the console (and its logged events) alive. Real integrations must
    // NOT preventDefault unless `select` returns true — the events are
    // designed to survive navigation.
    link.addEventListener("click", (event) => {
      event.preventDefault();
      hits.select(index);
    });
    // auxclick also fires on right-click, which only opens a context menu:
    // only the middle button is a navigation.
    link.addEventListener("auxclick", (event) => {
      if (event.button === 1) {
        hits.select(index, { navigate: false });
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

function renderStatus({ controller, searchBox, hits, stats }) {
  const { status, query } = searchBox.getRenderState();
  statusEl.classList.toggle("status-error", status === SearchStatus.ERROR);

  switch (status) {
    case SearchStatus.IDLE:
      statusEl.textContent = "Start typing to search the catalog.";
      return;
    case SearchStatus.LOADING:
      statusEl.textContent = `Searching “${query}”…`;
      return;
    case SearchStatus.ERROR:
      statusEl.textContent = describeError(
        controller.getSnapshot().results.error,
      );
      return;
    case SearchStatus.EMPTY:
      statusEl.textContent = `No products match “${hits.getRenderState().query}”.`;
      return;
    case SearchStatus.SUCCESS: {
      const { processingTimeMS } = controller.getSnapshot().results.products;
      // The count in the shopper's language, from the SDK's default texts.
      statusEl.textContent = `${stats.getRenderState().text} · “${hits.getRenderState().query}” (${processingTimeMS} ms)`;
      return;
    }
  }
}

function renderHits(hits) {
  resultsEl.replaceChildren(
    ...hits.getRenderState().hits.map((hit, index) => {
      const card = renderProductCard(hit, index, hits);
      hits.observe(card, index); // viewport impression
      return card;
    }),
  );
}

function renderPagination(pagination) {
  const { visible, currentPage, nbPages, isFirstPage, isLastPage } =
    pagination.getRenderState();
  paginationEl.hidden = !visible;
  pageIndicator.textContent = `Page ${currentPage + 1} / ${nbPages}`;
  prevButton.disabled = isFirstPage;
  nextButton.disabled = isLastPage;
}

function start(apiKey) {
  const dialog = new Dialog({ apiKey, locale: "fr-FR", currency: "EUR" });
  const controller = createSearchController({
    transport: (request, options) => dialog.search(request, options),
    language: "fr",
    country: "FR",
    analytics: {
      surface: "search_page",
      trackViewSearchResults: (params) => dialog.trackViewSearchResults(params),
      trackSelectSearchResult: (params) =>
        dialog.trackSelectSearchResult(params),
      trackOpenedSearch: (params) => {
        // Same payload as the TRACK_OPENED_SEARCH event the Dialog instance emits.
        console.log("[search] opened", { userId: dialog.userId, ...params });
        dialog.trackOpenedSearch(params);
      },
    },
    // Link for a hit without `url`: here a Shopify-style product page.
    buildProductUrl: (hit) =>
      hit.handle === undefined ? undefined : `/products/${hit.handle}`,
    // No `navigate` adapter: the demo renders plain `<a href>` links and
    // suppresses navigation above; a real integration passes its router here.
  });
  controller.subscribe(({ searchState, results }) => {
    console.log(`[search] ${results.status}`, { searchState, results });
  });

  const searchBox = connectSearchBox(controller);
  const hits = connectHits(controller);
  const stats = connectStats(controller);
  const pagination = connectPagination(controller);
  const connectors = { controller, searchBox, hits, stats };

  // The status line reads three connectors: render it when any of them changes.
  for (const connector of [searchBox, hits, stats]) {
    connector.subscribe(() => renderStatus(connectors));
  }
  hits.subscribe(() => renderHits(hits));
  pagination.subscribe(() => renderPagination(pagination));

  // DOM events only call connector actions.
  // Focusing the input opens search; every focus emits, dedup happens downstream.
  searchInput.addEventListener("focus", () => searchBox.open());
  searchInput.addEventListener("input", () =>
    searchBox.refine(searchInput.value),
  );
  // Enter skips the debounce: an explicit submission runs immediately.
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchBox.submit(searchInput.value);
    }
  });
  prevButton.addEventListener("click", () =>
    pagination.refine(pagination.getRenderState().currentPage - 1),
  );
  nextButton.addEventListener("click", () =>
    pagination.refine(pagination.getRenderState().currentPage + 1),
  );

  apiKeySection.hidden = true;
  searchInput.disabled = false;
  renderStatus(connectors);
  renderHits(hits);
  renderPagination(pagination);
  searchInput.focus();
}

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
