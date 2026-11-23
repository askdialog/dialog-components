# @askdialog/dialog-react

React component library for Dialog AI-powered product assistance.

## Table of contents

- [Search filter and AI components](#search-filter-and-ai-components)
- [Search connector hooks](#search-connector-hooks)
- [Installation](#installation)
- [Usage](#usage)
- [Available Components](#available-components)
  - [DialogProductBlock](#dialogproductblock)
  - [DialogInput](#dialoginput)
  - [Storefront search](#storefront-search)
    - [useDialogSearch](#usedialogsearch)
    - [DialogSearchBar](#dialogsearchbar)
    - [DialogSearchResults](#dialogsearchresults)
    - [DialogSearchPagination](#dialogsearchpagination)
    - [DialogSearchProductCard](#dialogsearchproductcard)
    - [Upgrading from 2.x](#upgrading-from-2x)
- [Theming](#theming)
- [Development](#development)
- [TypeScript](#typescript)
- [React Version](#react-version)

## Installation

```bash
npm install @askdialog/dialog-react @askdialog/dialog-sdk
# or
pnpm add @askdialog/dialog-react @askdialog/dialog-sdk
# or
yarn add @askdialog/dialog-react @askdialog/dialog-sdk
```

## Usage

```tsx
import { Dialog } from '@askdialog/dialog-sdk';
import { DialogInput, DialogProductBlock } from '@askdialog/dialog-react';
import '@askdialog/dialog-react/style.css';

const client = new Dialog({
  apiKey: 'your-api-key',
  locale: 'en', currency: 'EUR',
  callbacks: {
    addToCart: () => Promise.resolve(),
    getProduct: () => Promise.resolve({
      // Product data
    }),
  },
});

function App() {
  return (
    <DialogProductBlock
      client={client}
      productId="product-123"
      productTitle="Product Name"
    />
  );
}
```

## Available Components

### DialogProductBlock

Product block with up to 2 product questions and an "Ask something else" button that opens the assistant with up to 5 product questions about the product. The button label is in English, French or Spanish depending on the client locale (English otherwise).

**Props:**
- `client` (Dialog) - Dialog SDK client instance (required)
- `productId` (string) - Product ID (required)
- `productTitle` (string) - Product title (required)
- `selectedVariantId` (string, optional) - Selected variant ID
- `enableInput` (boolean, optional) - Deprecated. Shows the input field instead of the "Ask something else" button (default: false)

**Example:**
```tsx
<DialogProductBlock
  client={client}
  productId="9403924119882"
  productTitle="Blizzard King All-Mountain Snowboard"
  selectedVariantId="variant-123"
/>
```

### DialogInput

Standalone input component for asking questions. It shows the fixed "Ask the AI a question" text and an AI disclosure line, in English, French or Spanish depending on the client locale (English otherwise).

**Props:**
- `client` (Dialog) - Dialog SDK client instance (required)
- `productId` (string) - Product ID (required)
- `productTitle` (string) - Product title (required)
- `placeholder` (string, optional) - Deprecated, ignored
- `selectedVariantId` (string, optional) - Selected variant ID

**Example:**
```tsx
<DialogInput
  client={client}
  productId="9403924119882"
  productTitle="Product Name"
/>
```

### Storefront search

`useDialogSearch` binds the search controller of `@askdialog/dialog-sdk` to component state. The controller holds the search state, the results and the context (language, country, business ranking, texts) and manages requests and analytics; the components render the SDK's connectors (search box, hits, sections, pagination) and handle navigation.

```tsx
import { Dialog } from '@askdialog/dialog-sdk';
import {
  DialogSearchBar,
  DialogSearchResults,
  useDialogSearch,
} from '@askdialog/dialog-react';
import '@askdialog/dialog-react/style.css';

const client = new Dialog({ apiKey: 'your-api-key', locale: 'en-US', currency: 'USD' });

function SearchPage() {
  const { controller, state, theme } = useDialogSearch({ client, language: 'en', country: 'US' });

  return (
    <>
      <DialogSearchBar controller={controller} placeholder="Search products..." />
      <DialogSearchResults controller={controller} state={state} theme={theme} />
    </>
  );
}
```

#### useDialogSearch

Creates one search controller per hook instance and disposes it on unmount. The controller loads the merchant's business ranking and search config with `client.apiKey` at the first open or search.

**Options:**
- `client` (Dialog) - Dialog SDK client instance (required)
- `language` (string, required) - Lowercase ISO 639-1 language code, e.g. `fr`
- `country` (string, required) - Shopper's ISO 3166-1 alpha-2 country, e.g. `BE`; prices follow its market
- `surface` (SearchSurface, optional) - Where results are displayed, for analytics (default: `'search_page'`)
- `navigate` ((url, hit: SearchProductHit) => void, optional) - Router adapter called after selection attribution (e.g. `(url) => router.push(url)`). Omit it to let the cards' plain `<a href>` links navigate natively.
- `storefrontRoot` (string, optional) - The path a hit's relative `_display.url` resolves under, e.g. `/` or `/fr-fr/` (Shopify's `window.Shopify.routes.root`); default `/`
- `buildProductUrl` (deprecated, ignored) - Every hit's link is its `_display.url`
- `debounceMs` (number, optional) - Keystroke debounce (default: 100)
- `hitsPerPage` (number, optional) - Results per page (default: 12)
- `sections` (SearchSection[], optional) - Extra indices searched alongside the products; `collections` fills the collections column of `DialogSearchResults`. Only request an index the catalog exposes: a missing one fails the whole search.

Search language and country are explicit and independent of `client.locale`, which can be a regional locale such as `fr-FR`.

**Returns:** `{ controller, state, theme }` — pass them to the components below.
- `controller` (SearchController) - The controller of `@askdialog/dialog-sdk`; pass it to the SDK's connectors (`connectHits(controller)`, …) to build a custom UI
- `state` (SearchSnapshot) - The controller's snapshot, re-rendered on each change: `searchState` (the query and page asked, keyed by index name), `results` (`status` is `idle` / `loading` / `success` / `empty` / `error`, `products`, `sections`, `error`) and `context` (`language`, `country`, `businessRanking`, `texts`)
- `theme` (Theme) - The client's theme, for `DialogSearchResults`

With the collections column, for a catalog that exposes a collections index:

```tsx
const { controller, state, theme } = useDialogSearch({
  client,
  language: 'en',
  country: 'US',
  sections: [{ index: 'collections', hitsPerPage: 5 }],
});
```

#### DialogSearchBar

Search input bound to the search box connector: its value is the controller's query, typing runs a debounced search, submitting (Enter) searches immediately. Focusing the input opens the search, which emits the `TRACK_OPENED_SEARCH` analytics event and runs the empty-query search.

**Props:**
- `controller` (SearchController) - From `useDialogSearch` (required)
- `placeholder` (string, optional) - Input placeholder text
- `autoFocus` (boolean, optional) - Focus the input on mount
- `submitAriaLabel` (string, optional) - Accessible label of the submit button (default: `'Search'`)

#### DialogSearchResults

Floating results panel overlaying the page content: portaled to `document.body` in `position: fixed`, centered on the bar (up to 1440px wide, filling the viewport) and anchored under the spot where the component is rendered (place it right after the bar), so no ancestor stacking context or `overflow: hidden` can hide it. It shows the same layout as the Shopify search overlay: a collections column on the left when `sections` requests them, the products on the right as a list or a 3-column grid, the query match emphasized in every title, and, when `seeAllHref` is set, a "See all results" button; without it, the panel shows the first page of hits only and does not paginate. Below 768px the panel stacks, collections in a horizontal rail above the products. Colors, radii and font follow the SDK theme (dark palette when `backgroundColor` is dark, straight or rounded corners from `ctaBorderType`). Each product card renders the hits connector's display of the hit, Algolia's Shopify record: its `_display.image` (hits require `_display`, computed by the server since DAT-2016; when `_display.image` is absent, no thumbnail; its `shape` draws it with the theme's corners for `theme`, straight corners for `square`, rounded corners for `rounded` and as a circle for `round`), its `_display.title`, its `_display.price` (formatted by the server in the shopper's market currency), struck through next to it its `_display.compare_at_price` when present, and its `_display.url` (a relative one resolved under `storefrontRoot`); a hit without a price shows none. Each card links to the product page and records search attribution (viewport impressions, select on click and middle-click) automatically. Clicking outside the panel (and outside the bar) closes it; typing again or re-focusing the bar reopens it with the results kept.

**Props:**
- `controller` (SearchController) - From `useDialogSearch` (required)
- `state` (SearchSnapshot) - From `useDialogSearch` (required)
- `locale` (string, optional) - BCP 47 locale for counts and labels; omitted, the connectors' display is used, in the search `language`. Prices are formatted by the server.
- `theme` (Theme, optional) - The client's theme, as returned by `useDialogSearch`; styles the panel (palette, radii, font)
- `layout` (`'list' | 'grid'`, optional) - Products layout (default: `'list'`)
- `seeAllHref` ((query) => string, optional) - Link of the "See all results" footer button; omitted, the panel shows the first page of hits only, with no pagination

#### DialogSearchPagination

Previous/next controls with a page indicator, bound to the pagination connector; hidden while loading and while there is a single page. Not rendered by `DialogSearchResults`, which does not paginate: use it on a results page of your own.

**Props:**
- `controller` (SearchController) - From `useDialogSearch` (required)
- `state` (SearchSnapshot) - From `useDialogSearch` (required)
- `locale` (string, optional) - Locale of the button labels; the search language when omitted

#### DialogSearchProductCard

One product card, as `DialogSearchResults` renders it, for custom layouts. It renders the hits connector's display of `state.results.products.hits[index]` and records its impressions and selection; it renders nothing for a hit that is not at `index` in the shown results.

**Props:**
- `controller` (SearchController) - From `useDialogSearch` (required)
- `hit` (SearchProductHit) - `state.results.products.hits[index]` (required)
- `index` (number) - The hit's position in the shown results (required)

#### Upgrading from 2.x

The components keep their props and rendering, except the pagination of `DialogSearchResults`; `useDialogSearch` keeps its options. What changed:
- `DialogSearchResults` no longer paginates: without `seeAllHref` it shows the first page of hits only. Set `seeAllHref`, or render `DialogSearchPagination` on a results page of your own.
- `controller` is the controller of `@askdialog/dialog-sdk`: `setQuery`, `submit` and `setPage` are replaced by `setSearchState` and `search` (or the SDK's connectors), `getState` by `getSnapshot`, `observeResult` / `selectResult` by `observeHit` / `selectHit`.
- `state` is the controller's snapshot: read `state.results.status`, `state.results.products` and `state.results.sections` instead of `state.status`, `state.response` and `state.sections`, and `state.context.businessRanking` instead of `state.businessRanking`.
- Without a `locale` prop, texts and prices follow the search `language` and `country` instead of English and the browser's number format.
- The peer `@askdialog/dialog-sdk` is 3.x.

## Theming

The components use CSS variables for theming. You can customize the theme through the Dialog SDK client:

```tsx
const client = new Dialog({
  apiKey: 'your-api-key',
  theme: {
    backgroundColor: 'pink',
    primaryColor: 'pink',
    ctaTextColor: 'white',
    ctaBorderType: 'rounded',
    capitalizeCtas: true,
    fontFamily: 'Arial',
    highlightProductName: true,
    title: {
      fontSize: '22px',
      color: 'purple',
    },
    description: {
      color: 'blue',
      fontSize: '18px',
    },
    content: {
      color: 'green',
      fontSize: '10px',
    },
  },
});
```

## Development

This section is for contributors working on the library itself.

### Prerequisites

- Node.js >= 22
- pnpm >= 10

### Setup

```bash
# From monorepo root
pnpm install
```

### Development Workflows

#### Daily Development

Work on components with instant feedback:

```bash
# From monorepo root
pnpm dev:react-example
# Opens react-example app at http://localhost:5173
```

**What happens:**
- The example app runs with Vite dev server
- Components are resolved from **source files** (`packages/react/src/`) via alias
- Changes to components are immediately reflected (HMR enabled)
- No rebuild required

#### Testing Built Library

Test the library as consumers would receive it from npm:

```bash
# Step 1: Build the library
pnpm build:react

# Step 2: Run example app against built dist/
cd packages/react-example
pnpm dev:test-dist
# Or from root: TEST_DIST=true pnpm dev:react-example
```

**When to use:**
- Before creating a pull request
- After modifying build configuration
- To verify the build works correctly
- Before publishing a new version

### Build Commands

```bash
# Build the library only
pnpm build:react

# Build all packages in the monorepo
pnpm build

# Clean dist folder
pnpm --filter @askdialog/dialog-react clean

# Lint code
pnpm --filter @askdialog/dialog-react lint

# Fix linting issues
pnpm --filter @askdialog/dialog-react lint:fix
```

### Project Structure

```
packages/react/
├── src/
│   ├── main.ts              # Library entry point
│   ├── components/          # Exported components
│   │   ├── index.ts         # Component barrel export
│   │   └── DialogProductBlock/
│   │       ├── DialogProductBlock.tsx
│   │       ├── DialogProductBlock.css
│   │       ├── DialogInput.tsx
│   │       ├── DialogInput.css
│   │       ├── ThemeProvider.tsx
│   │       └── ...
│   └── icons/               # Icon components
├── dist/                    # Build output (gitignored)
├── package.json
├── vite.config.ts           # Library build configuration
└── project.json             # Nx configuration
```

### Testing the Package

#### Full Integration Test

Test the package in a real React project:

```bash
# 1. Build and pack
cd packages/react
pnpm build
pnpm pack

# 2. Create test project
cd /tmp
pnpm create vite test-dialog --template react-ts
cd test-dialog
pnpm install

# 3. Install from tarball
pnpm add /path/to/askdialog-dialog-react-*.tgz

# 4. Test imports and functionality
pnpm dev
```

### Publishing

```bash
# From monorepo root
pnpm publish:react
```

**Pre-publish checklist:**
- [ ] All tests pass
- [ ] Version updated in `package.json`
- [ ] Tested with built library (`pnpm dev:test-dist`)
- [ ] Tarball inspected with `pnpm pack`
- [ ] CHANGELOG updated

## TypeScript

This package includes TypeScript type definitions. The types are automatically available when you install the package.

## React Version

This package requires React 19 or higher as a peer dependency.


## Search connector hooks

Requires `@askdialog/dialog-sdk@^3.8.0`. `useDialogSearch` accepts the SDK controller options, including `mode`, `currency`, `texts`, `config`, `initialSearchState`, `routing`, `facets`, `facetsTransport`, `transport` and `sections`. The client supplies the API key and analytics callbacks. Options are fixed at creation. Lexical search uses `client.search`; AI mode uses the SDK AI transport with the client's public API key. A supplied `transport` overrides either mode.

For example, use `{ client, language: 'en', country: 'US', routing: true, facets: true }` for a lexical results page; call `controller.search()` on mount to run the restored URL state. Use `{ client, language: 'en', country: 'US', mode: 'ai', currency: 'USD' }` for natural-language search. AI requests start at two trimmed characters, omit additional sections and do not request facet counts. Render AI hits with `useInfiniteHits` or `DialogSearchInfiniteHits`: each entry's `display` is built from the AI record (title, image, price range, and its `url`, else Shopify's `products/<handle>` under `storefrontRoot`; on another platform, render your own link from `entry.hit`). The existing `DialogSearchResults` and `DialogSearchProductCard` require lexical `_display` hits.

| Hook/composable | SDK connector | Extra argument |
| --- | --- | --- |
| `useSearchBox` | `connectSearchBox` | |
| `useHits` | `connectHits` | |
| `useInfiniteHits` | `connectInfiniteHits` | |
| `usePagination` | `connectPagination` | |
| `useStats` | `connectStats` | |
| `useSections` | `connectSections` | |
| `useQuerySuggestions` | `connectQuerySuggestions` | Request the `query_suggestions` section on the controller |
| `useSortBy` | `connectSortBy` | Lexical mode only |
| `useRefinementList` | `connectRefinementList` | `{ attribute, limit? }` |
| `useRange` | `connectRange` | `{ attribute }` |
| `useCurrentRefinements` | `connectCurrentRefinements` | |
| `useClearRefinements` | `connectClearRefinements` | |
| `useDynamicWidgets` | `connectDynamicWidgets` | |
| `useAiOverview` | `connectAiOverview` | `{ apiKey }` or `{ transport }`, AI controller only |

All wrappers take the controller first and return `[state, connector]`; actions are the SDK connector's actions. A `controller.createDraft()` is also a controller: pass it to filter hooks in a mounted sheet, `commit()` to apply once, or `discard()` to cancel, then unmount the sheet. These hooks provide state and lifecycle management; they do not add filter or AI components to the existing floating panel.

```tsx
import { useDialogSearch, useRefinementList, useSearchBox } from '@askdialog/dialog-react'

function SearchPage({ client }: { client: import('@askdialog/dialog-sdk').Dialog }) {
  const { controller } = useDialogSearch({ client, language: 'en', country: 'US' })
  const [box, searchBox] = useSearchBox(controller)
  const [colors, refinement] = useRefinementList(controller, { attribute: 'color', limit: 5 })
  return <>
    <input value={box.query} onChange={event => searchBox.refine(event.target.value)} />
    {colors.items.map(item => <button key={item.value} aria-pressed={item.isRefined}
      onClick={() => refinement.refine(item.value)}>{item.value}</button>)}
  </>
}
```

The exported generic `useConnector(connect, controller)` returns the same tuple. Keep a custom `connect` factory stable with `useCallback`; changing it or the controller replaces the connector. Built-in parameterized hooks accept inline option objects and recreate only when their values change. Connectors are disposed on unmount and recreated during StrictMode effect replay.

For `useAiOverview`, inline custom transports are supported: the hook keeps its connector while forwarding future requests to the latest function. Changing the API key or switching between a custom transport and the default transport recreates it. A custom factory passed directly to `useConnector` must still be stable (module scope or `useCallback`).

## Search filter and AI components

Import the package stylesheet as for the existing search components. Each component takes `controller` and optional `theme` (usually `client.theme`); labels use the controller's SDK texts and the existing `--dso-*` theme variables.

| Component | Additional props | Behavior |
| --- | --- | --- |
| `DialogSearchRefinementList` | `attribute`, optional `limit` | Checkboxes, result counts when enabled, show more/less. |
| `DialogSearchRange` | optional `attribute` (default `price`), `label` | Min/max inputs accept decimal dots and commas. Non-numeric text is marked invalid and does not change the applied range; `invalidLabel` translates its error. Reversed bounds show an error and send no search. |
| `DialogSearchCurrentRefinements` | | Applied chips, removal of removable filters, Clear all. |
| `DialogSearchInfiniteHits` | `renderHit(entry, index)` | Accumulated lexical or AI hits, Show more, loading, empty and retry. A list restored on a later page (`routing` with `page`) shows a Show previous button that loads the pages above. |
| `DialogSearchAiOverview` | `apiKey` or `transport`, optional `label` | AI controller only: text, follow-up suggestions, loading and retry. |

The controls can live directly on a results page, or receive a `SearchDraft` in your own filter sheet. Create one draft when opening the sheet; pass it to the filter components, use Clear all to reset pending refinements, `draft.commit()` to apply in one search, or `draft.discard()` to cancel. Unmount the sheet after either action. The host owns the sheet's open state, focus and Apply/Cancel labels.

Infinite hits use native links by default. Their default cards do not call the controller's page-local impression/selection methods: after loading another page, those methods refer only to that page, not to the accumulated hits. Use `renderHit` / the `hit` slot for host-specific navigation and attribution. The existing `DialogSearchProductCard` continues to track a single current page; do not pass an accumulated index to it.

The React AI overview hook forwards future requests to the latest custom `transport` without restarting on callback-only renders. Vue binds controller and connector options during setup: remount a keyed component when changing its controller or attribute. The optional overview `label` defaults to English `AI overview`; pass your translated accessible label when needed.

```tsx
import { DialogSearchRefinementList, DialogSearchRange,
  DialogSearchCurrentRefinements, DialogSearchInfiniteHits,
  DialogSearchAiOverview } from '@askdialog/dialog-react'

// `controller` comes from useDialogSearch. For a sheet, pass its draft instead.
<DialogSearchRefinementList controller={controller} attribute="color" limit={5} theme={theme} />
<DialogSearchRange controller={controller} theme={theme} />
<DialogSearchCurrentRefinements controller={controller} theme={theme} />
<DialogSearchInfiniteHits controller={controller} theme={theme} />
// `aiController` comes from useDialogSearch({ ...options, mode: 'ai' }).
<DialogSearchAiOverview controller={aiController} apiKey={client.apiKey} theme={theme} />
```

New controls use the controller’s `language` and `texts` directly, without a separate locale override. Pass `label` for a translated AI overview landmark and `errorLabel` on infinite hits / AI overview for a translated failure message; their error defaults are English. Live range refinements apply on each keystroke, as the SDK connector does. Use a draft when edits should wait for Apply.
