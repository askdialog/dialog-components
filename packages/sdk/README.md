# Dialog SDK

## Dialog

Dialog is an AI assistant designed to boost e-commerce sales by providing intelligent product recommendations and seamless customer interactions.

Visit our website: [Dialog AI Assistant](https://www.askdialog.com/)

## Description

Dialog SDK is a powerful TypeScript library that seamlessly integrates the Dialog AI assistant into your applications. It provides a comprehensive set of tools for managing assistant interactions, handling e-commerce operations like product fetching and cart management, and customizing the assistant's appearance to match your brand.

## Get started

### Prerequisites

Before using the Dialog SDK, you need:

- An active API Key, you can retrieve your api key in your [organization settings](https://app.askdialog.com/settings)

### Installation

```bash
npm install @dialog/dialog-sdk
# or
pnpm add @dialog/dialog-sdk
# or
yarn add @dialog/dialog-sdk
```

You can also use our CDN link if you’re not using a package manager.

- Add the script to your project (replace X, Y, Z by versions)

```html
<script src="https://d2m6yt8rnm4dos.cloudfront.net/dialog-sdk.X.Y.Z.min.js"></script>
```
- The `DialogSDK` object will be available on the `window`. You can access all features as shown below:
```typescript

const client = new window.DialogSDK.Dialog({
    apiKey: 'YOUR_API_KEY',
    // ........
})
```

### Instantiate the client

```typescript
import { Dialog } from '@dialog/dialog-sdk';

const client = new Dialog({
  apiKey: 'YOUR_API_KEY', // required
  locale: 'TARGETED_LOCALE', // required
  countryCode: 'FR', // optional, ISO 3166 alpha-2
  callbacks: {
    addToCart: async ({
    productId,
    quantity,
    currency,
    variantId,
    price,
  }: {
    productId: string;
    quantity: number;
    currency?: string;
    variantId?: string;
    price?: string;
  }) => Promise<void>, // required
    getProduct: async (
        productId: string,
        variantId?: string
    ) => Promise<SimplifiedProduct>, // required
  },
});
```

The apiKey is required to authenticate with our API and interact with our assistant.
The locale specifies the language you want to use.

The optional `countryCode` (ISO 3166 alpha-2, e.g. `'FR'`, `'US'`) sets the region used to format prices (separators, symbol placement) and the language variant. It does not change the currency itself, which comes from each product. The effective region is resolved in this order:

1. the `countryCode` parameter, when provided;
2. the region embedded in `locale` (e.g. `'en-US'` → `US`);
3. the region guessed from the language (e.g. `'fr'` → `FR`).

The addToCart function is triggered when a user clicks the AddToCart button.
The getProduct function is used to display product information in the assistant.

When the client is instantiated, it will automatically insert into the DOM the Dialog Assistant script, so you can interact with the assistant using `sendProductMessage` or `sendGenericMessage`.

### Getters

- apiKey
- theme
- userId
- locale

### Features

- Send a message with context

```typescript
 client.sendProductMessage({
    question: 'YOUR_QUESTION', // required
    productId: 'PRODUCT_ID', // required
    productTitle: 'PRODUCT_TITLE', // required
    answer: '', // Optional
    selectedVariantId?: 'CURRENT_VARIANT_ID', // Optional
 })
```

- Send message without context

```typescript
client.sendGenericMessage({
  question: 'YOUR_QUESTION', // required
});
```

- Get locale information

```typescript 
const localizationInfos = await client.getLocalizationInformations();

/*
Example of expected result when locale: 'en'
{
  countryCode: "US",
  formatted: "en-US",
  language: "English",
  locale: "en"
}
*/
```

- Get suggestion questions

You can use this query to make your own integration and trigger `sendProductMessage` or `sendGenericMessage` on user click.

```typescript
const suggestions = await client.getSuggestions(productId);

/*
Example of expected result:
{
    "questions": [
        {
            "question": "What is the formula used in this repairing gel to soothe the skin after sun exposure?"
        },
        {
            "question": "How does this gel relieve sunburn and reduce pain?"
        },
        {
            "question": "What are the benefits for the skin after using this product following excessive exposure to UV rays?"
        }
    ],
    "assistantName": "Your expert",
    "inputPlaceholder": "Ask any question...",
    "description": "Ask any question about this product"
}
*/
```


- Handler for fetch product

The `getProduct` callback is called by the assistant to display product information. You must return an object matching the `SimplifiedProduct` interface.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | `string` | Yes | The product identifier |
| `variantId` | `string` | No | The selected variant identifier |

**Return type: `SimplifiedProduct`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Product identifier |
| `title` | `string` | Yes | Product name |
| `handle` | `string` | Yes | URL-friendly product slug |
| `totalInventory` | `number` | Yes | Total available stock across all variants |
| `variants` | `SimplifiedProductVariant[]` | Yes | List of product variants (see below) |
| `descriptionHtml` | `string` | No | Product description in HTML |
| `url` | `string` | No | Product page URL |
| `featuredImage` | `{ url?: string } \| null` | No | Main product image |
| `options` | `SimplifiedProductOption[]` | No | Product options (size, color, etc.) |

**Variant: `SimplifiedProductVariant`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Variant identifier |
| `price` | `string` | Yes | Variant price (e.g. `"29.99"`) |
| `currencyCode` | `string` | Yes | ISO 4217 currency code (e.g. `"EUR"`, `"USD"`) |
| `displayName` | `string` | No | Variant display name |
| `inventoryQuantity` | `number` | No | Available stock for this variant |
| `compareAtPrice` | `string \| null` | No | Original price before discount |
| `url` | `string` | No | Variant-specific page URL |
| `selectedOptions` | `{ name: string; value: string }[]` | No | Option values for this variant (e.g. `[{ name: "Size", value: "M" }]`) |
| `image` | `{ url?: string } \| null` | No | Variant-specific image |

**Option: `SimplifiedProductOption`** *(optional)*

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Option identifier |
| `name` | `string` | Yes | Option name (e.g. `"Size"`, `"Color"`) |
| `position` | `number` | Yes | Display order |
| `values` | `string[]` | Yes | Available values (e.g. `["S", "M", "L"]`) |

**Example:**

```typescript
const client = new Dialog({
    ...,
    callbacks: {
        getProduct: async (
            productId: string,
            variantId?: string,
        ): Promise<SimplifiedProduct> => {
            const response = await fetch(`https://your-api.com/products/${productId}`);
            const data = await response.json();

            return {
                id: data.id,
                title: data.name,
                handle: data.slug,
                totalInventory: data.stock,
                featuredImage: { url: data.imageUrl },
                variants: data.variants.map((v: any) => ({
                    id: v.id,
                    price: v.price.toString(),
                    currencyCode: 'EUR',
                    displayName: v.name,
                    inventoryQuantity: v.stock,
                    compareAtPrice: v.originalPrice?.toString() ?? null,
                    selectedOptions: v.options,
                    image: v.imageUrl ? { url: v.imageUrl } : null,
                })),
                options: data.options?.map((o: any) => ({
                    id: o.id,
                    name: o.name,
                    position: o.position,
                    values: o.values,
                })),
            };
        },
    },
});
```

- Handler for add to cart

```typescript
const client = new Dialog({
    ...,
    callbacks: {
        addToCart: ({
            productId,
            quantity,
            variantId,
            currency
        }: {
            productId: string;
            quantity: number;
            currency?: string;
            variantId?: string;
        }): Promise<void> => {
            // Call your api to trigger addToCart
            const response = await fetch('....');

            // Trigger other stuff like confirmation modal
            return;
        }
    },
});
```


### Theming (Still in construction)

We are currently working on the theming part so you may find some issues. Contact us if you need more customization.


⚠️ Title, description and content properties are used only to theme the Vue component for the moment.

```typescript
const client = new Dialog({
  ...,
  theme: {
    backgroundColor?: string;
    primaryColor?: string;
    ctaTextColor?: string;
    ctaBorderType?: 'straight' | 'rounded';
    capitalizeCtas?: boolean;
    fontFamily?: string;
    highlightProductName?: boolean;
    title?: { // Used in Vue component only
        fontSize?: string;
        color?: string;
    }
    description?: { // Used in Vue component only
        fontSize?: string;
        color?: string;
    }
    content?: { // Used in Vue component only
        fontSize?: string;
        color?: string;
    }
  }
});
```

### Tracking

Our SDK includes a tracking system to monitor user interactions in your purchase flow.

#### Automatic Tracking

When a user interacts with our assistant and clicks on an "Add to Cart" CTA, it automatically triggers the previously configured `addToCart` callback (see "Client Instantiation" section). These events are tracked internally by our system.

#### Manual Tracking

However, we cannot automatically detect cart additions or checkout completions that occur **after** using our assistant. To get accurate data in your Dialog dashboards, you should use the following tracking methods:

#### Available Methods

```typescript

client.registerAddToCartEvent({
    productId: 'ProductIdentifier', // {string} - Required
    quantity: 1, // {number} - Required
    currency: 'EUR', // {string} - Optional
    variantId: 'VariantIdentifier', // {string} - Optional
    price: '12.00' // {string} - Optional
});

// Checkout is order-level: call ONCE per completed order with the order total.
// `orderValue` is what the "Revenue generated" dashboard reads.
// Do NOT call this per line item — without an order total, revenue resolves to 0.
client.registerSubmitCheckoutEvent({
    orderValue: 59.98, // {number} - Required - the order total
    currency: 'EUR', // {string} - Optional
    transactionId: 'OrderIdentifier', // {string} - Optional - order id, used to de-duplicate reloads
    items: [ // {array} - Optional - line items, for product-level attribution only
        { productId: 'ProductIdentifier', quantity: 1, price: 29.99, variantId: 'VariantIdentifier' },
    ],
});

// Deprecated per-line signature — still accepted for backward compatibility,
// but carries no order total so revenue cannot be computed. Prefer the call above.
client.registerSubmitCheckoutEvent({
    productId: 'ProductIdentifier',
    quantity: 1,
    price: '12.00',
    currency: 'EUR',
});
```

#### Listen for Assistant Events

The SDK provides real-time event listening for user interactions with the Dialog assistant.

```typescript
// Basic event listener setup
const unsubscribe = client.onAssistantEvent((event) => {
  console.log('Event type:', event.type);
  console.log('Event payload:', event.payload);
});

// Clean up the event listener when needed
unsubscribe();
```

#### Event Structure

All events follow this structure:

```typescript
interface AssistantEvent {
  type: string;
  payload: {
    // Common fields (included in all events)
    date: string;        // ISO timestamp
    locale: string;      // Current locale
    url: string;         // Current page URL
    userId?: string;     // User ID if available
    
    // Event-specific fields
    productId?: string;  // When interacting with products
    variantId?: string;  // When interacting with variants
  }
}
```

#### Available Event Types

- **userOpenedAssistant** - User opened the assistant interface
- **userClosedAssistant** - User closed the assistant interface  
- **userSentMessage** - User sent a message to the assistant
- **userClickedOnProductCard** - User clicked on a product card for more details
- **userOpenedRecommendation** - User clicked on a product recommendation
- **userAddedToCart** - User added a product to cart via the assistant
- **userSendPositiveFeedback** - User gave positive feedback on AI response
- **userSendNegativeFeedback** - User gave negative feedback on AI response

#### Example Usage

```typescript
client.onAssistantEvent((event) => {
  switch (event.type) {
    case 'userAddedToCart':
      // Track conversion in your analytics
      analytics.track('assistant_conversion', {
        productId: event.payload.productId,
        timestamp: event.payload.date
      });
      break;
      
    case 'userSendNegativeFeedback':
      // Log for improvement analysis
      console.log('Negative feedback at:', event.payload.url);
      break;
  }
});
```
