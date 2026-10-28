# @askdialog/dialog-vue

Vue 3 component library for Dialog AI-powered product assistance.

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
- [Theming](#theming)
- [Development](#development)
- [TypeScript](#typescript)
- [Vue Version](#vue-version)

## Installation

```bash
npm install @askdialog/dialog-vue @askdialog/dialog-sdk
# or
pnpm add @askdialog/dialog-vue @askdialog/dialog-sdk
# or
yarn add @askdialog/dialog-vue @askdialog/dialog-sdk
```

## Usage

```vue
<script setup lang="ts">
import { Dialog } from '@askdialog/dialog-sdk';
import { DialogProductBlock } from '@askdialog/dialog-vue';
import '@askdialog/dialog-vue/style.css';

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
</script>

<template>
  <DialogProductBlock
    :client="client"
    product-id="product-123"
    product-title="Product Name"
  />
</template>
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
```vue
<DialogProductBlock
  :client="client"
  product-id="9403924119882"
  product-title="Blizzard King All-Mountain Snowboard"
  selected-variant-id="variant-123"
  :enable-input="true"
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
```vue
<DialogInput
  :client="client"
  product-id="9403924119882"
  product-title="Product Name"
  placeholder="Ask something about this product..."
/>
```

### Storefront search

`useDialogSearch` binds the SDK search controller (`createSearchController` from `@askdialog/dialog-sdk/search`) to component state. The controller manages requests, the merchant's configuration and analytics; the components read its connectors (`connectSearchBox`, `connectHits`, `connectSections`, `connectPagination`) and only handle rendering. Texts, display rules, title highlight, prices and theme come from the SDK.

```vue
<script setup lang="ts">
import { Dialog } from '@askdialog/dialog-sdk';
import {
  DialogSearchBar,
  DialogSearchResults,
  useDialogSearch,
} from '@askdialog/dialog-vue';
import '@askdialog/dialog-vue/style.css';

const client = new Dialog({ apiKey: 'your-api-key', locale: 'en-US', currency: 'USD' });

const { controller, state, theme } = useDialogSearch({ client, language: 'en', country: 'US' });
</script>

<template>
  <DialogSearchBar :controller="controller" placeholder="Search products..." />
  <DialogSearchResults :controller="controller" :state="state" :theme="theme" />
</template>
```

#### useDialogSearch

Creates one search controller per composable instance and disposes it on unmount. The controller loads the merchant's business ranking with the client's API key at the first focus or search, for the title of the empty-query products.

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

Options are read once during setup — later changes don't rebind the live controller.

**Returns:** `{ controller, state, theme }` — pass them to the components below; `theme` is the client's theme, for `DialogSearchResults`. `controller` is the SDK's `SearchController`, which you can also pass to the connectors of `@askdialog/dialog-sdk/search` for a custom UI. `state` is a `ShallowRef` of the controller's snapshot: `state.value.searchState` (what the shopper asks for), `state.value.results` (`status` is `idle` / `loading` / `success` / `empty` / `error`, `products`, `sections`, `error`) and `state.value.context` (language, country, business ranking, texts).

With the collections column, for a catalog that exposes a collections index:

```ts
const { controller, state, theme } = useDialogSearch({
  client,
  language: 'en',
  country: 'US',
  sections: [{ index: 'collections', hitsPerPage: 5 }],
});
```

#### DialogSearchBar

Search input, on `connectSearchBox`: typing runs a debounced search, submitting (Enter) searches immediately. Focusing the input opens the search, which emits the `TRACK_OPENED_SEARCH` analytics event and, with no query yet, shows the empty-query products.

**Props:**
- `controller` (SearchController) - From `useDialogSearch` (required)
- `placeholder` (string, optional) - Input placeholder text (default: `'Search products...'`)
- `autoFocus` (boolean, optional) - Focus the input on mount (default: false)
- `submitAriaLabel` (string, optional) - Accessible label of the submit button (default: `'Search'`)

#### DialogSearchResults

Floating results panel overlaying the page content: portaled to `document.body` in `position: fixed`, centered on the bar (up to 1440px wide, filling the viewport) and anchored under the spot where the component is rendered (place it right after the bar), so no ancestor stacking context or `overflow: hidden` can hide it. It shows the same layout as the Shopify search overlay: a collections column on the left when `sections` requests them, the products on the right as a list or a 3-column grid, the query match emphasized in every title, and, when `seeAllHref` is set, a "See all results" button; without it, the panel shows the first page of hits only and does not paginate. Below 768px the panel stacks, collections in a horizontal rail above the products. Colors, radii and font follow the SDK theme (dark palette when `backgroundColor` is dark, straight or rounded corners from `ctaBorderType`). Each product card reads the hit, Algolia's Shopify record: its `product_image` (the variant's `image` when absent), its `title`, its lowest variant price (`variants_min_price`, formatted with `currency`, the base currency of the shopper's market), struck through next to it the lowest compare-at price (`variants_compare_at_price_min`, formatted the same way) when it is higher, and its `url`; a hit without a price shows none. Each card links to the product page and records search attribution (viewport impressions, select on click and middle-click) automatically. Clicking outside the panel (and outside the bar) closes it; typing again or re-focusing the bar reopens it with the results kept.

**Props:**
- `controller` (SearchController) - From `useDialogSearch` (required)
- `state` (SearchSnapshot) - From `useDialogSearch` (required)
- `locale` (string, optional) - BCP 47 locale for prices, counts and labels, formatted with the SDK's helpers. Omitted, they follow the controller's `language` and `country`.
- `theme` (Theme, optional) - The client's theme, as returned by `useDialogSearch`; styles the panel (palette, radii, font)
- `layout` (`'list' | 'grid'`, optional) - Products layout (default: `'list'`)
- `seeAllHref` ((query) => string, optional) - Link of the "See all results" footer button; omitted, the panel shows the first page of hits only, with no pagination

#### DialogSearchPagination

Previous/next controls with a page indicator, on `connectPagination`; hidden while loading, while a typed query is pending, or while there is a single page. Not rendered by `DialogSearchResults`, which does not paginate: use it on a results page of your own.

**Props:**
- `controller` (SearchController) - From `useDialogSearch` (required)
- `state` (SearchSnapshot) - From `useDialogSearch` (required)
- `locale` (string, optional) - Locale of the button labels; omitted, the controller's `language`

#### DialogSearchProductCard

One product of the results, with its image, highlighted title, price and link, and its search attribution (viewport impressions, select on click and middle-click). Rendered by `DialogSearchResults` — exported only for custom layouts.

**Props:**
- `controller` (SearchController) - From `useDialogSearch` (required)
- `hit` (SearchProductHit) - The product hit (required)
- `index` (number) - Its position in `state.results.products.hits`, for attribution (required)
- `locale` (string, optional) - Locale of the prices; omitted, the controller's `language` and `country`
- `query` (string, optional) - The query emphasized in the title
- `display` (ProductHitDisplay, optional) - The hit's display from `connectHits`; built from the hit when omitted

## Theming

The components use CSS variables for theming. You can customize the theme through the Dialog SDK client:

```ts
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
pnpm dev:vue-example
# Opens vue-example app at http://localhost:5173
```

**What happens:**
- The example app runs with Vite dev server
- Components are resolved from **source files** (`packages/vue/src/`) via alias
- Changes to components are immediately reflected (HMR enabled)
- No rebuild required

#### Testing Built Library

Test the library as consumers would receive it from npm:

```bash
# Step 1: Build the library
pnpm build:vue

# Step 2: Run example app against built dist/
cd packages/vue-example
pnpm dev:test-dist
# Or from root: TEST_DIST=true pnpm dev:vue-example
```

**When to use:**
- Before creating a pull request
- After modifying build configuration
- To verify the build works correctly
- Before publishing a new version

### Build Commands

```bash
# Build the library only
pnpm build:vue

# Build all packages in the monorepo
pnpm build

# Clean dist folder
pnpm --filter @askdialog/dialog-vue clean

# Run the specs (builds the SDK first)
pnpm nx test @askdialog/dialog-vue

# Lint code
pnpm --filter @askdialog/dialog-vue lint

# Fix linting issues
pnpm --filter @askdialog/dialog-vue lint:fix
```

### Project Structure

```
packages/vue/
├── src/
│   ├── main.ts              # Library entry point
│   ├── components/          # Exported components
│   │   ├── index.ts         # Component barrel export
│   │   ├── DialogProductBlock/
│   │   │   ├── DialogProductBlock.vue
│   │   │   ├── DialogInput.vue
│   │   │   ├── ThemeProvider.vue
│   │   │   └── ...
│   │   └── DialogSearch/
│   │       ├── DialogSearchBar.vue
│   │       ├── DialogSearchResults.vue
│   │       ├── useDialogSearch.ts
│   │       └── ...
│   └── icons/               # Icon components
├── dist/                    # Build output (gitignored)
├── package.json
├── vite.config.ts           # Library build configuration
└── project.json             # Nx configuration
```

### Publishing

```bash
# From monorepo root
pnpm publish:vue
```

**Pre-publish checklist:**
- [ ] All tests pass
- [ ] Version updated in `package.json`
- [ ] Tested with built library (`pnpm dev:test-dist`)
- [ ] Tarball inspected with `pnpm pack`
- [ ] CHANGELOG updated

## TypeScript

This package includes TypeScript type definitions. The types are automatically available when you install the package.

## Vue Version

This package requires Vue 3 or higher as a peer dependency.

