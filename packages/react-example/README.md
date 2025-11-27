# @askdialog/react-example

Example application demonstrating the usage of `@askdialog/dialog-react` component library.

**Note:** This package is private and not published to npm. It exists solely for development and testing purposes.

## Purpose

This application serves two primary purposes:

1. **Development Environment**: Provides a hot-reloading environment for developing components in `@askdialog/dialog-react`
2. **Living Documentation**: Demonstrates how to integrate and use the Dialog React components

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
pnpm dev:react-example

# Or from this package
pnpm dev
```

Opens at http://localhost:5174

**How it works:**
- Vite alias resolves `@askdialog/dialog-react` to `../react/src/main.ts`
- Changes to components in `packages/react/src/` are instantly reflected
- Full HMR support for rapid development

### Testing Built Library

Test against the **built distribution** (simulates npm consumption):

```bash
# From monorepo root
pnpm build:react        # Build the library first
cd packages/react-example
pnpm dev:test-dist      # Run example with built dist

# Or in one line from root
TEST_DIST=true pnpm dev:react-example
```

**How it works:**
- Disables Vite alias via `TEST_DIST=true` environment variable
- Workspace protocol (`workspace:*`) resolves to `packages/react/dist/`
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
        '@askdialog/dialog-react': resolve(__dirname, '../react/src/main.ts'),
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
packages/react-example/
├── src/
│   ├── App.tsx           # Demo application
│   ├── App.css           # App component styles
│   ├── main.tsx          # Application entry point
│   └── style.css         # Global styles
├── public/               # Public static files
├── index.html            # HTML entry point
├── package.json
├── vite.config.ts        # Vite configuration (with alias logic)
└── project.json          # Nx configuration
```

## Adding Examples

To demonstrate new components or features:

1. Import the component in `src/App.tsx`:
   ```tsx
   import { YourNewComponent } from '@askdialog/dialog-react';
   ```

2. Add usage example in the component:
   ```tsx
   function App() {
     return (
       <YourNewComponent prop="value" />
     );
   }
   ```

3. Run `pnpm dev` to see changes live

## Development Workflow

### Daily Development

```bash
pnpm dev
# Edit components in packages/react/src/
# See changes instantly in browser
```

### Before Commit

```bash
pnpm build:react
pnpm dev:test-dist
# Verify the built library works correctly
```

## Dependencies

- `@askdialog/dialog-react` (workspace:*) - The component library
- `@askdialog/dialog-sdk` (workspace:*) - Dialog SDK
- `react` (^19.0.0) - React 19 framework
- `react-dom` (^19.0.0) - React DOM

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
- The development server runs on port 5174 by default
- Browser auto-opens when running `pnpm dev`
