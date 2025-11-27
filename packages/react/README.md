# @askdialog/dialog-react

React component library for Dialog AI-powered product assistance.

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
  locale: 'en',
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

## License

[Your License Here]
