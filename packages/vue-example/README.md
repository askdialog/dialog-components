# @askdialog/vue-example

Example application demonstrating the usage of `@askdialog/dialog-vue` component library.

**Note:** This package is private and not published to npm. It exists solely for development and testing purposes.

## Purpose

This application serves two primary purposes:

1. **Development Environment**: Provides a hot-reloading environment for developing components in `@askdialog/dialog-vue`
2. **Living Documentation**: Demonstrates how to integrate and use the Dialog Vue components

## Setup

### Environment Variables

Copy the example environment file and configure your API key:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Dialog API key:

```bash
VITE_DIALOG_API_KEY=your-actual-api-key
```

**Note:** `.env.local` is gitignored and should never be committed.

## Running the Example App

### Development Mode (Default)

Uses component **source files** with Hot Module Replacement:

```bash
# From monorepo root
pnpm dev

# Or from this package
pnpm dev
```

Opens at http://localhost:5173

**How it works:**
- Vite alias resolves `@askdialog/dialog-vue` to `../vue/src/main.ts`
- Changes to components in `packages/vue/src/` are instantly reflected
- Full HMR support for rapid development

### Testing Built Library

Test against the **built distribution** (simulates npm consumption):

```bash
# From monorepo root
pnpm build:vue          # Build the library first
cd packages/vue-example
pnpm dev:test-dist      # Run example with built dist

# Or in one line from root
TEST_DIST=true pnpm dev
```

**How it works:**
- Disables Vite alias via `TEST_DIST=true` environment variable
- Workspace protocol (`workspace:*`) resolves to `packages/vue/dist/`
- Tests the actual ESM/UMD bundles that will be published

## Configuration

### Vite Configuration

`vite.config.ts` includes conditional aliasing:

```typescript
const useDistForTesting = process.env.TEST_DIST === 'true';

resolve: {
  alias: useDistForTesting
    ? {}  // Use dist/ from workspace
    : {
        // Use source files for HMR
        '@askdialog/dialog-vue': resolve(__dirname, '../vue/src/main.ts'),
      },
}
```

### Switching Modes

| Mode | Command | Resolves To | Use Case |
|------|---------|-------------|----------|
| Development | `pnpm dev` | Source files | Daily development |
| Testing | `pnpm dev:test-dist` | Built dist/ | Pre-publish validation |

## Project Structure

```
packages/vue-example/
├── src/
│   ├── App.vue           # Demo application
│   ├── main.ts           # Application entry point
│   ├── style.css         # Global styles
│   └── assets/           # Static assets
├── public/               # Public static files
├── index.html            # HTML entry point
├── package.json
├── vite.config.ts        # Vite configuration (with alias logic)
└── project.json          # Nx configuration
```

## Adding Examples

To demonstrate new components or features:

1. Import the component in `src/App.vue`:
   ```vue
   <script setup lang="ts">
   import { YourNewComponent } from '@askdialog/dialog-vue';
   </script>
   ```

2. Add usage example in the template:
   ```vue
   <template>
     <YourNewComponent :prop="value" />
   </template>
   ```

3. Run `pnpm dev` to see changes live

## Development Workflow

### Daily Development

```bash
pnpm dev
# Edit components in packages/vue/src/
# See changes instantly in browser
```

### Before Commit

```bash
pnpm build:vue
pnpm dev:test-dist
# Verify the built library works correctly
```

## Dependencies

- `@askdialog/dialog-vue` (workspace:*) - The component library
- `@askdialog/dialog-sdk` (workspace:*) - Dialog SDK
- `vue` (^3.5.13) - Vue 3 framework

All dependencies are managed via pnpm workspaces.

## Building

This application can be built for production, though it's typically not deployed:

```bash
pnpm build
# Creates dist/ with optimized production bundle
```

## Notes

- This package is marked `"private": true` and will never be published to npm
- It depends on the library via `workspace:*` protocol (pnpm workspaces)
- The development server runs on port 5173 by default
- Browser auto-opens when running `pnpm dev`
