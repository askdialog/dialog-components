<p align="center">
  <a href="https://www.askdialog.com">
    <h1 align="center">Dialog</h1>
  </a>
</p>

<p align="center">
  <strong>AI-Powered Shopping Assistant for E-Commerce</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@askdialog/dialog-sdk"><img src="https://img.shields.io/npm/v/@askdialog/dialog-sdk.svg?label=@askdialog/dialog-sdk" alt="SDK npm version"></a>
  <a href="https://www.npmjs.com/package/@askdialog/dialog-vue"><img src="https://img.shields.io/npm/v/@askdialog/dialog-vue.svg?label=@askdialog/dialog-vue" alt="Vue npm version"></a>
  <a href="https://www.npmjs.com/package/@askdialog/dialog-react"><img src="https://img.shields.io/npm/v/@askdialog/dialog-react.svg?label=@askdialog/dialog-react" alt="React npm version"></a>
  <a href="https://github.com/askdialog/dialog-components/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@askdialog/dialog-sdk.svg" alt="License"></a>
</p>

<p align="center">
  <a href="https://www.askdialog.com">Website</a> ·
  <a href="https://app.askdialog.com">Dashboard</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#packages">Packages</a>
</p>

---

## Overview

Dialog is an AI assistant designed to boost e-commerce sales by providing intelligent product recommendations and seamless customer interactions. This monorepo contains the official SDK and UI component libraries for integrating Dialog into your web applications.

### Features

- **AI-Powered Suggestions** - Automatically generate relevant product questions to engage customers
- **Multi-Framework Support** - Native components for Vue 3 and React 19
- **Customizable Theming** - Full control over colors, typography, and styling
- **Built-in Analytics** - Track user interactions, add-to-cart events, and conversions
- **TypeScript First** - Complete type definitions for excellent developer experience
- **Lightweight** - Minimal bundle size with tree-shaking support

## Packages

This monorepo contains the following packages:

| Package | Version | Description |
|---------|---------|-------------|
| [`@askdialog/dialog-sdk`](./packages/sdk) | [![npm](https://img.shields.io/npm/v/@askdialog/dialog-sdk.svg)](https://www.npmjs.com/package/@askdialog/dialog-sdk) | Core SDK with AI assistant functionality |
| [`@askdialog/dialog-vue`](./packages/vue) | [![npm](https://img.shields.io/npm/v/@askdialog/dialog-vue.svg)](https://www.npmjs.com/package/@askdialog/dialog-vue) | Vue 3 component library |
| [`@askdialog/dialog-react`](./packages/react) | [![npm](https://img.shields.io/npm/v/@askdialog/dialog-react.svg)](https://www.npmjs.com/package/@askdialog/dialog-react) | React 19 component library |

## Quick Start

### Prerequisites

- **Node.js** >= 22
- **API Key** - Get your API key from [Dialog Dashboard](https://app.askdialog.com/settings)

### Vue 3

```bash
npm install @askdialog/dialog-sdk @askdialog/dialog-vue
```

```vue
<script setup lang="ts">
import { Dialog, type SimplifiedProduct } from '@askdialog/dialog-sdk'
import { DialogProductBlock } from '@askdialog/dialog-vue'
import '@askdialog/dialog-vue/style.css'

const client = new Dialog({
  apiKey: 'YOUR_API_KEY',
  locale: 'en',
  callbacks: {
    addToCart: async ({ productId, quantity, variantId }) => {
      // Handle add to cart
    },
    getProduct: async (productId, variantId): Promise<SimplifiedProduct> => {
      // Fetch and return product data matching SimplifiedProduct type
      return {
        id: productId,
        title: 'Product Name',
        handle: 'product-handle',
        descriptionHtml: '<p>Product description</p>',
        url: 'https://store.com/products/product-handle',
        totalInventory: 100,
        featuredImage: {
          url: 'https://store.com/images/product.jpg',
        },
        variants: [
          {
            id: variantId || 'variant-1',
            displayName: 'Default',
            inventoryQuantity: 50,
            price: '29.99',
            currencyCode: 'USD',
            compareAtPrice: '39.99',
            url: 'https://store.com/products/product-handle?variant=variant-1',
            selectedOptions: [
              { name: 'Size', value: 'Medium' },
              { name: 'Color', value: 'Blue' },
            ],
            image: {
              url: 'https://store.com/images/variant.jpg',
            },
          },
        ],
        options: [
          { id: 'option-1', name: 'Size', position: 1, values: ['Small', 'Medium', 'Large'] },
          { id: 'option-2', name: 'Color', position: 2, values: ['Red', 'Blue', 'Green'] },
        ],
      }
    },
  },
})
</script>

<template>
  <DialogProductBlock
    :client="client"
    product-id="product-123"
    product-title="Product Name"
  />
</template>
```

### React 19

```bash
npm install @askdialog/dialog-sdk @askdialog/dialog-react
```

```tsx
import { Dialog, type SimplifiedProduct } from '@askdialog/dialog-sdk'
import { DialogProductBlock } from '@askdialog/dialog-react'
import '@askdialog/dialog-react/style.css'

const client = new Dialog({
  apiKey: 'YOUR_API_KEY',
  locale: 'en',
  callbacks: {
    addToCart: async ({ productId, quantity, variantId }) => {
      // Handle add to cart
    },
    getProduct: async (productId, variantId): Promise<SimplifiedProduct> => {
      // Fetch and return product data matching SimplifiedProduct type
      return {
        id: productId,
        title: 'Product Name',
        handle: 'product-handle',
        descriptionHtml: '<p>Product description</p>',
        url: 'https://store.com/products/product-handle',
        totalInventory: 100,
        featuredImage: {
          url: 'https://store.com/images/product.jpg',
        },
        variants: [
          {
            id: variantId || 'variant-1',
            displayName: 'Default',
            inventoryQuantity: 50,
            price: '29.99',
            currencyCode: 'USD',
            compareAtPrice: '39.99',
            url: 'https://store.com/products/product-handle?variant=variant-1',
            selectedOptions: [
              { name: 'Size', value: 'Medium' },
              { name: 'Color', value: 'Blue' },
            ],
            image: {
              url: 'https://store.com/images/variant.jpg',
            },
          },
        ],
        options: [
          { id: 'option-1', name: 'Size', position: 1, values: ['Small', 'Medium', 'Large'] },
          { id: 'option-2', name: 'Color', position: 2, values: ['Red', 'Blue', 'Green'] },
        ],
      }
    },
  },
})

function ProductPage() {
  return (
    <DialogProductBlock
      client={client}
      productId="product-123"
      productTitle="Product Name"
    />
  )
}
```

### SDK Only (Vanilla JS)

```bash
npm install @askdialog/dialog-sdk
```

```typescript
import { Dialog, type SimplifiedProduct } from '@askdialog/dialog-sdk'

const client = new Dialog({
  apiKey: 'YOUR_API_KEY',
  locale: 'en',
  callbacks: {
    addToCart: async ({ productId, quantity, variantId }) => {
      // Handle add to cart
    },
    getProduct: async (productId, variantId): Promise<SimplifiedProduct> => {
      // Return product data - see type definition below
    },
  },
})

// Fetch AI-generated suggestions for a product
const suggestions = await client.getSuggestions('product-123')

// Send a message to the assistant
await client.sendProductMessage({
  message: 'What are the dimensions?',
  productId: 'product-123',
})
```

## Product Types

The `getProduct` callback must return a `SimplifiedProduct` object. This is essential for Dialog to function correctly.

### SimplifiedProduct

```typescript
interface SimplifiedProduct {
  id: string                          // Unique product identifier
  title: string                       // Product display name
  handle: string                      // URL-friendly product slug
  descriptionHtml?: string            // HTML product description
  url?: string                        // Full product page URL
  totalInventory: number              // Total stock across all variants
  featuredImage?: {
    url?: string                      // Main product image URL
  } | null
  variants: SimplifiedProductVariant[] // Product variants (sizes, colors, etc.)
  options?: SimplifiedProductOption[]  // Available product options
}
```

### SimplifiedProductVariant

```typescript
interface SimplifiedProductVariant {
  id: string                          // Unique variant identifier
  displayName?: string                // Variant display name
  inventoryQuantity?: number          // Stock count for this variant
  price: string                       // Current price (e.g., "29.99")
  currencyCode: string                // ISO currency code (e.g., "USD", "EUR")
  compareAtPrice?: string | null      // Original price for sale items
  url?: string                        // Direct URL to this variant
  selectedOptions?: {
    name: string                      // Option name (e.g., "Size")
    value: string                     // Selected value (e.g., "Medium")
  }[]
  image?: {
    url?: string                      // Variant-specific image URL
  } | null
}
```

### SimplifiedProductOption

```typescript
interface SimplifiedProductOption {
  id: string                          // Option identifier
  name: string                        // Option name (e.g., "Size", "Color")
  position: number                    // Display order
  values: string[]                    // Available values (e.g., ["S", "M", "L"])
}
```

## Components

### DialogProductBlock

The main component for displaying AI-powered product suggestions.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `client` | `Dialog` | Yes | Dialog SDK instance |
| `productId` | `string` | Yes | Product identifier |
| `productTitle` | `string` | Yes | Product display name |
| `selectedVariantId` | `string` | No | Currently selected variant |
| `enableInput` | `boolean` | No | Show input field (default: `true`) |

### DialogInput

A standalone input component for asking questions.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `client` | `Dialog` | Yes | Dialog SDK instance |
| `productId` | `string` | Yes | Product identifier |
| `productTitle` | `string` | Yes | Product display name |

## Theming

Customize the appearance by passing a `theme` object to the SDK:

```typescript
const client = new Dialog({
  apiKey: 'YOUR_API_KEY',
  locale: 'en',
  theme: {
    backgroundColor: '#ffffff',
    primaryColor: '#007bff',
    ctaTextColor: '#ffffff',
    ctaBorderType: 'rounded', // 'straight' | 'rounded'
    capitalizeCtas: false,
    fontFamily: 'Inter, sans-serif',
    title: {
      fontSize: '18px',
      color: '#1a1a1a',
    },
    description: {
      fontSize: '14px',
      color: '#666666',
    },
    content: {
      fontSize: '14px',
      color: '#333333',
    },
  },
  callbacks: {
    // ...
  },
})
```

## Analytics & Tracking

Track user interactions for analytics:

```typescript
// Track add-to-cart events
client.registerAddToCartEvent({
  productId: 'product-123',
  variantId: 'variant-456',
  quantity: 1,
  price: 29.99,
})

// Track checkout events
client.registerSubmitCheckoutEvent({
  productId: 'product-123',
  variantId: 'variant-456',
  quantity: 1,
  price: '29.99',
})

// Listen to assistant events
client.onAssistantEvent((event) => {
  console.log('Assistant event:', event)
})
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/askdialog/dialog-components.git
cd dialog-components

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm dev` | Start Vue example dev server |
| `pnpm dev:react-example` | Start React example dev server |
| `pnpm lint` | Lint all packages |
| `pnpm lint:fix` | Fix linting issues |
| `pnpm test` | Run all tests |
| `pnpm clean` | Clean all build outputs |
| `pnpm graph` | View dependency graph |

### Project Structure

```
dialog-components/
├── packages/
│   ├── sdk/              # @askdialog/dialog-sdk - Core SDK
│   ├── vue/              # @askdialog/dialog-vue - Vue 3 components
│   ├── react/            # @askdialog/dialog-react - React components
│   ├── vue-example/      # Vue development app
│   └── react-example/    # React development app
├── .changeset/           # Version management
├── nx.json               # Nx configuration
├── pnpm-workspace.yaml   # pnpm workspace config
└── tsconfig.base.json    # Shared TypeScript config
```

### Tech Stack

- **Build System**: [Nx](https://nx.dev) + [Vite](https://vitejs.dev)
- **Package Manager**: [pnpm](https://pnpm.io)
- **Languages**: TypeScript 5.9
- **Versioning**: [Changesets](https://github.com/changesets/changesets)
- **Linting**: ESLint 9 + Prettier

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Creating a Changeset

When making changes that should be released:

```bash
pnpm changeset
```

Follow the prompts to describe your changes.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Links

- [Website](https://www.askdialog.com)
- [Dashboard](https://app.askdialog.com)
- [npm - SDK](https://www.npmjs.com/package/@askdialog/dialog-sdk)
- [npm - Vue](https://www.npmjs.com/package/@askdialog/dialog-vue)
- [npm - React](https://www.npmjs.com/package/@askdialog/dialog-react)
