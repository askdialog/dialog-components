# @askdialog/dialog-react

React component library for Dialog AI-powered product assistance.

## Table of contents

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

Full-featured dialog component with suggestions and input.

**Props:**
- `client` (Dialog) - Dialog SDK client instance (required)
- `productId` (string) - Product ID (required)
- `productTitle` (string) - Product title (required)
- `selectedVariantId` (string, optional) - Selected variant ID
- `enableInput` (boolean, optional) - Enable input field (default: true)

**Example:**
```tsx
<DialogProductBlock
  client={client}
  productId="9403924119882"
  productTitle="Blizzard King All-Mountain Snowboard"
  selectedVariantId="variant-123"
  enableInput={true}
/>
```

### DialogInput

Standalone input component for asking questions.

**Props:**
- `client` (Dialog) - Dialog SDK client instance (required)
- `productId` (string) - Product ID (required)
- `productTitle` (string) - Product title (required)
- `placeholder` (string, optional) - Input placeholder text
- `selectedVariantId` (string, optional) - Selected variant ID

**Example:**
```tsx
<DialogInput
  client={client}
  productId="9403924119882"
  productTitle="Product Name"
  placeholder="Ask something about this product..."
/>
```

### Storefront search

`useDialogSearch` binds the search controller of `@askdialog/dialog-sdk/search` to component state. The controller holds the search state, the results and the context (language, country, business ranking, texts) and manages requests and analytics; the components render the SDK's connectors (search box, hits, sections, pagination) and handle navigation.

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
- `buildProductUrl` ((hit: SearchProductHit) => string | undefined, optional) - Builds a card's link when its hit has no `url`, e.g. ``(hit) => `/products/${hit.handle}` ``. With neither, the card has no link.
- `debounceMs` (number, optional) - Keystroke debounce (default: 100)
- `hitsPerPage` (number, optional) - Results per page (default: 12)
- `sections` (SearchSection[], optional) - Extra indices searched alongside the products; `collections` fills the collections column of `DialogSearchResults`. Only request an index the catalog exposes: a missing one fails the whole search.

Search language and country are explicit and independent of `client.locale`, which can be a regional locale such as `fr-FR`.

**Returns:** `{ controller, state, theme }` — pass them to the components below.
- `controller` (SearchController) - The controller of `@askdialog/dialog-sdk/search`; pass it to the SDK's connectors (`connectHits(controller)`, …) to build a custom UI
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

Floating results panel overlaying the page content: portaled to `document.body` in `position: fixed`, centered on the bar (up to 1440px wide, filling the viewport) and anchored under the spot where the component is rendered (place it right after the bar), so no ancestor stacking context or `overflow: hidden` can hide it. It shows the same layout as the Shopify search overlay: a collections column on the left when `sections` requests them, the products on the right as a list or a 3-column grid, the query match emphasized in every title, and, when `seeAllHref` is set, a "See all results" button; without it, the panel shows the first page of hits only and does not paginate. Below 768px the panel stacks, collections in a horizontal rail above the products. Colors, radii and font follow the SDK theme (dark palette when `backgroundColor` is dark, straight or rounded corners from `ctaBorderType`). Each product card renders the hits connector's display of the hit, Algolia's Shopify record: its `product_image` (the variant's `image` when absent), its `title`, its lowest variant price (`variants_min_price`, formatted with `currency`, the base currency of the shopper's market), struck through next to it the lowest compare-at price (`variants_compare_at_price_min`, formatted the same way) when it is higher, and its `url`; a hit without a price shows none. Each card links to the product page and records search attribution (viewport impressions, select on click and middle-click) automatically. Clicking outside the panel (and outside the bar) closes it; typing again or re-focusing the bar reopens it with the results kept.

**Props:**
- `controller` (SearchController) - From `useDialogSearch` (required)
- `state` (SearchSnapshot) - From `useDialogSearch` (required)
- `locale` (string, optional) - BCP 47 locale for prices, counts and labels, formatted with the SDK's helpers; omitted, the connectors' display is used, in the search `language` and `country`
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
- `locale` (string, optional) - BCP 47 locale of the prices; the search language and country when omitted
- `query` (string, optional) - Query emphasized inside the title; the answered query when omitted

#### Upgrading from 2.x

The components keep their props and rendering, except the pagination of `DialogSearchResults`; `useDialogSearch` keeps its options. What changed:
- `DialogSearchResults` no longer paginates: without `seeAllHref` it shows the first page of hits only. Set `seeAllHref`, or render `DialogSearchPagination` on a results page of your own.
- `controller` is the controller of `@askdialog/dialog-sdk/search`: `setQuery`, `submit` and `setPage` are replaced by `setSearchState` and `search` (or the SDK's connectors), `getState` by `getSnapshot`, `observeResult` / `selectResult` by `observeHit` / `selectHit`.
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

