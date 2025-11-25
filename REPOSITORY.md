# Dialog Components Repository

## Repository Philosophy

This monorepo is designed to provide **multiple integration pathways** for the Dialog AI Assistant into frontend applications, catering to different technical requirements, frameworks, and deployment scenarios. The architecture follows a **layered approach** where a core SDK serves as the foundation for framework-specific components and standalone implementations.

### Core Principles

1. **Flexibility First**: Support various integration methods - from full component libraries to minimal script injections
2. **Framework Agnostic Core**: The SDK is framework-independent, enabling any frontend stack to integrate Dialog
3. **Progressive Enhancement**: Developers can choose their level of abstraction - from low-level SDK to high-level components
4. **Developer Experience**: Each integration path includes example projects demonstrating best practices
5. **Maintainability**: Shared tooling (Nx, pnpm, changesets) ensures consistent development and release processes

## Integration Pathways

The repository is structured to support multiple ways of integrating Dialog into websites:

### 1. Component Libraries (Current & Planned)
Framework-specific component libraries that wrap the SDK with native framework patterns:
- **Vue 3** (`@askdialog/dialog-vue`) - Production ready
- **React** - Planned
- **Svelte** - Planned

### 2. Direct SDK Usage
Developers can use `@askdialog/dialog-sdk` directly for custom implementations without framework-specific abstractions.

### 3. HTML Templates (Planned)
Pre-built HTML templates with embedded Dialog functionality for quick prototyping or static sites.

## Package Architecture

### Package Overview

```
packages/
├── sdk/              # @askdialog/dialog-sdk (Core SDK)
├── vue/              # @askdialog/dialog-vue (Vue 3 Components)
└── vue-example/      # @askdialog/vue-example (Demo Application)
```


#### `@askdialog/dialog-sdk`
**Type**: Library (Published)
**Version**: 1.0.26-beta.1
**Purpose**: Core TypeScript SDK for Dialog AI Assistant

**Key Features**:
- Framework-agnostic TypeScript implementation
- Product recommendations and customer interactions
- Analytics integration (PostHog)
- Multiple build outputs:
  - ES Module (`dist/index.js`)
  - TypeScript declarations (`dist/index.d.ts`)
  - IIFE bundle for CDN/script tags (`bundle/dialog-sdk.{version}.min.js`)

**Dependencies**:
- `posthog-js`: Analytics and telemetry
- `uuidv7`: Unique identifier generation

**Build Process**:
- TypeScript compilation with environment-specific configuration
- `build:prod` / `build:dev` toggle configuration via shell script
- esbuild for IIFE bundling and minification
- Optional CDN deployment to AWS S3 + CloudFront

**Distribution**:
- npm registry (public)
- CDN (https://dialog-sdk.s3.amazonaws.com/dialog-sdk.{version}.min.js)

---

#### `@askdialog/dialog-vue`
**Type**: Library (Published)
**Version**: 1.0.24-beta.1
**Purpose**: Vue 3 component library wrapping the Dialog SDK

**Key Features**:
- Native Vue 3 components (`DialogProductBlock`, etc.)
- Composition API support
- TypeScript declarations
- Multiple output formats for flexibility

**Dependencies**:
- `@askdialog/dialog-sdk`: workspace:* (internal dependency)
- `vue`: ^3.5.13 (peer dependency)

**Build Process**:
- Vite for bundling with Vue plugin
- `vue-tsc` for TypeScript type checking
- Generates:
  - ES Module (`dist/dialog-vue.js`)
  - UMD bundle (`dist/dialog-vue.umd.js`)
  - CSS bundle (`dist/dialog-vue.css`)
  - TypeScript declarations (`dist/main.d.ts`)

**Distribution**:
- npm registry (public)

---

#### `@askdialog/vue-example`
**Type**: Application (Private)
**Purpose**: Example Vue 3 application demonstrating Dialog Vue component usage

**Key Features**:
- Production-grade example implementation
- Development sandbox for testing components
- Reference architecture for consumers

**Dependencies**:
- `@askdialog/dialog-sdk`: workspace:*
- `@askdialog/dialog-vue`: workspace:*
- `vue`: ^3.5.13

**Build Process**:
- Vite development server
- Production build output for deployment reference

**Distribution**:
- Not published (internal reference only)

## Dependency Graph

```
┌─────────────────────────────────┐
│  @askdialog/dialog-sdk          │  ← Core SDK (no internal deps)
│  (TypeScript, Framework-agnostic)│
└─────────────────┬───────────────┘
                  │
                  │ depends on
                  │
        ┌─────────▼───────────┐
        │ @askdialog/dialog-vue│  ← Vue 3 Components
        │ (Vue 3 Wrapper)      │
        └─────────┬────────────┘
                  │
                  │ depends on both
                  │
         ┌────────▼─────────────┐
         │ @askdialog/vue-example│  ← Example Application
         │ (Demo & Reference)    │
         └──────────────────────┘
```

**Build Order** (enforced by Nx):
1. SDK builds first (no dependencies)
2. Vue components build after SDK completes
3. Vue example builds after both SDK and Vue components complete

## Build System (Nx)

### Why Nx?

Nx provides intelligent build orchestration for monorepos with:
- **Dependency-aware builds**: Automatically builds packages in correct order
- **Affected detection**: Only builds/tests changed packages and their dependents
- **Computation caching**: Skips unchanged builds, saving time
- **Parallel execution**: Runs up to 3 independent tasks concurrently

### Nx Configuration

#### Target Definitions (nx.json)

```json
{
  "build": {
    "dependsOn": ["^build"],        // Build upstream dependencies first
    "inputs": ["production", "^production"],
    "cache": true,
    "outputs": ["{projectRoot}/dist"]
  },
  "dev": {
    "dependsOn": ["^build"],        // Build dependencies before dev mode
    "cache": false                  // Dev servers shouldn't cache
  }
}
```

#### Project Tags

Projects are tagged for organizational purposes:
- **Type tags**: `type:library`, `type:app`
- **Scope tags**: `scope:sdk`, `scope:vue`

#### Affected Commands

Default base branch for affected commands: `staging`

```bash
# Only build packages changed since staging branch
pnpm nx affected -t build

# Only lint affected packages
pnpm nx affected -t lint
```

### Build Targets by Package

#### SDK (`@askdialog/dialog-sdk`)
```bash
pnpm nx build @askdialog/dialog-sdk
```
- Runs TypeScript compilation
- Sets production configuration
- Outputs to `packages/sdk/dist/`

#### Vue Components (`@askdialog/dialog-vue`)
```bash
pnpm nx build @askdialog/dialog-vue
```
- Automatically builds SDK first (dependency)
- Runs `vue-tsc` type checking
- Runs Vite build
- Outputs to `packages/vue/dist/`

#### Vue Example (`@askdialog/vue-example`)
```bash
pnpm nx build @askdialog/vue-example
# or for development:
pnpm nx dev @askdialog/vue-example
```
- Automatically builds SDK and Vue components first
- Runs Vite build/dev server
- Outputs to `packages/vue-example/dist/`

### Common Commands

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build:sdk
pnpm build:vue

# Build only affected packages
pnpm build:affected

# Run development server (auto-builds dependencies)
pnpm dev
pnpm dev:vue-example

# Lint all packages
pnpm lint
pnpm lint:fix

# Visualize dependency graph
pnpm graph
```

## CI/CD Workflows

### Workflow Overview

The repository uses **four GitHub Actions workflows** implementing a complete CI/CD pipeline with branch-based deployment strategy:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Staging    │───▶│     Main     │───▶│     Tags     │
│   Branch     │    │    Branch    │    │  @pkg@ver    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       ▼                   ▼                    ▼
  Beta Publish       Prod Publish        GitHub Release
   (@beta tag)       (@latest tag)       (+ Changelog)
```

### 1. PR Validation (pr-validation.yml)

**Triggers**:
- Pull requests to `main` or `staging`
- Direct pushes to `main` or `staging`

**Purpose**: Quality gates before merge

**Jobs**:

**a) Validate** (Lint & Build)
- Sets up Node 22 + pnpm
- Determines affected projects using Nx
- Runs parallel linting on affected packages
- Builds affected packages (ensures no build errors)
- Uses Nx caching for performance

**b) Changeset Check**
- Verifies if changeset exists for the PR
- Issues warning (non-blocking) if missing
- Reminder to run `pnpm changeset` for versioned changes

**Configuration**:
- Concurrency: Cancels in-progress runs for same PR
- Timeout: 15 minutes
- Parallelism: 3 concurrent tasks (Nx configuration)

---

### 2. Beta Publish (beta-publish.yml)

**Triggers**: Push to `staging` branch

**Purpose**: Automated beta releases for testing and early access

**Workflow Steps**:

1. **Enter Prerelease Mode**
   - Checks if `.changeset/pre.json` exists
   - Runs `pnpm changeset pre enter beta` if not in prerelease mode
   - All subsequent versions will have `-beta.X` suffix

2. **Check for Changesets**
   - Scans `.changeset/` directory for pending changes
   - Counts changeset files (excluding README.md)
   - Skips publish if no changesets found

3. **Version Packages**
   - Runs `pnpm changeset version`
   - Increments versions based on changeset types
   - Updates `CHANGELOG.md` files
   - Adds `-beta.X` prerelease identifiers

4. **Build & Publish**
   - Runs `pnpm build` (builds all packages via Nx)
   - Publishes to npm with `--tag beta`
   - Packages install via: `npm install @askdialog/dialog-vue@beta`

5. **Commit & Push**
   - Commits version bumps and changelog updates
   - Pushes to `staging` with tags
   - Commit message: `ci: version packages for beta release [skip ci]`


---

### 3. Production Publish (production-publish.yml)

**Triggers**: Push to `main` branch

**Purpose**: Stable releases to npm with @latest tag

**Workflow Steps**:

1. **Exit Prerelease Mode**
   - Checks for `.changeset/pre.json`
   - Runs `pnpm changeset pre exit` if in beta mode
   - Removes `-beta` suffixes for stable versions
   - Commits and pushes exit (if needed)

2. **Check for Changesets**
   - Same logic as beta workflow
   - Exits early if no changesets pending

3. **Version Packages**
   - Runs `pnpm changeset version`
   - Generates stable semantic versions (e.g., 1.0.27)
   - Updates `CHANGELOG.md` with release notes

4. **Build & Publish**
   - Runs `pnpm build`
   - Publishes with default `@latest` tag
   - Becomes the default installation version

5. **Commit & Push**
   - Commits version bumps and changelogs
   - Pushes to `main` with git tags
   - Tags format: `@askdialog/dialog-sdk@1.0.27`

**Security**: Same as beta workflow

**Concurrency**: No cancellation (ensures atomic releases)

---

### 4. GitHub Release (create-release.yml)

**Triggers**: Git tags matching `@askdialog/**`

**Purpose**: Auto-create GitHub releases with changelogs and npm links

**Workflow Steps**:

1. **Extract Tag Information**
   - Parses tag: `@askdialog/dialog-sdk@1.0.27`
   - Extracts package name: `@askdialog/dialog-sdk`
   - Extracts version: `1.0.27`
   - Detects prerelease: checks for `-beta`, `-alpha`, `-rc` suffixes

2. **Map Package to Directory**
   - `@askdialog/dialog-sdk` → `packages/sdk`
   - `@askdialog/dialog-vue` → `packages/vue`

3. **Extract Changelog**
   - Reads package-specific `CHANGELOG.md`
   - Extracts section for the tagged version
   - Uses `awk` to parse markdown headers

4. **Create GitHub Release**
   - Release name: `@askdialog/dialog-sdk@1.0.27`
   - Body: Changelog content + npm link
   - Marks as prerelease if beta/alpha/rc
   - Links to npm package page

**Example Release Body**:
```markdown
## 1.0.27

### Patch Changes

- Fixed authentication bug
- Updated dependencies

---

```

---


## Version Management (Changesets)

### Why Changesets?

Changesets provide:
- **Developer-friendly**: Contributors write human-readable change descriptions
- **Automatic versioning**: Semantic versioning applied automatically
- **Changelog generation**: Professional release notes from changeset files
- **Monorepo support**: Handles inter-package dependencies
- **Prerelease support**: Beta/alpha releases with automatic suffixes

### Changeset Configuration

```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": true,                           // Auto-commit version bumps
  "access": "public",                       // Publish packages publicly
  "baseBranch": "main",                     // Stable release branch
  "updateInternalDependencies": "patch",    // Bump internal deps as patches
  "ignore": ["@askdialog/vue-example"]      // Don't version example apps
}
```

### Creating a Changeset

When you make changes to published packages:

```bash
# Interactive changeset creation
pnpm changeset

# CLI prompts:
# 1. Which packages changed? [select with space]
#    - @askdialog/dialog-sdk
#    - @askdialog/dialog-vue
#
# 2. What type of change?
#    - patch (bug fixes)
#    - minor (new features)
#    - major (breaking changes)
#
# 3. Write a summary of changes
```

This creates a file in `.changeset/` like:

```markdown
---
"@askdialog/dialog-vue": patch
---

Fixed product block rendering issue with variant selection
```

### Changeset Workflow

#### Development Flow

```bash
# 1. Make your changes
git checkout -b feature/my-feature

# 2. Create changeset(s)
pnpm changeset

# 3. Commit changeset with your code
git add .
git commit -m "feat: add new component"

# 4. Push and create PR to staging
git push origin feature/my-feature
```

#### Beta Release Flow (Staging Branch)

```bash
# 1. Merge PR to staging
# 2. GitHub Action automatically:
#    - Enters prerelease mode (if needed)
#    - Versions packages: 1.0.26-beta.1
#    - Builds packages
#    - Publishes to npm with @beta tag
#    - Commits version bumps
```

Installation:
```bash
npm install @askdialog/dialog-vue@beta
```

#### Production Release Flow (Main Branch)

```bash
# 1. Test beta thoroughly
# 2. Merge staging → main
# 3. GitHub Action automatically:
#    - Exits prerelease mode
#    - Versions packages: 1.0.27 (stable)
#    - Builds packages
#    - Publishes to npm with @latest tag
#    - Creates git tags
#    - Commits version bumps
# 4. Tag trigger creates GitHub Release
```

Installation:
```bash
npm install @askdialog/dialog-vue  # Gets @latest (1.0.27)
```

### Changeset Types and Versioning

Based on [Semantic Versioning](https://semver.org/):

| Change Type | When to Use | Example | Version Impact |
|-------------|-------------|---------|----------------|
| **patch** | Bug fixes, minor tweaks | "Fixed rendering bug" | 1.0.26 → 1.0.27 |
| **minor** | New features, backward compatible | "Added new DialogCart component" | 1.0.26 → 1.1.0 |
| **major** | Breaking changes | "Changed Dialog constructor API" | 1.0.26 → 2.0.0 |

### Internal Dependencies

When `@askdialog/dialog-vue` is updated:
- If SDK is NOT changed: Vue gets its requested bump
- If SDK IS changed: Vue automatically gets at least a patch bump (due to `updateInternalDependencies: "patch"`)

Example:
```bash
# Changeset says: patch bump for dialog-vue
# But dialog-sdk got a minor bump
# Result:
#   - dialog-sdk: 1.0.26 → 1.1.0
#   - dialog-vue: 1.0.26 → 1.0.27 (patch for Vue change + dependency update)
```

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd dialog-components

# Install dependencies (pnpm 10+ required)
pnpm install

# Verify setup
pnpm build        # Build all packages
pnpm lint         # Lint all packages
```

### Development Modes

#### SDK Development

```bash
# Build SDK
pnpm build:sdk

# Watch mode
cd packages/sdk
pnpm watch

# Create CDN bundle
pnpm --filter @askdialog/dialog-sdk run build:bundle:iife
```

#### Vue Component Development

```bash
# Option 1: Use the example app (recommended)
pnpm dev:vue-example

# Option 2: Build and watch
cd packages/vue
pnpm build
# Make changes and rebuild
```

#### Testing Changes End-to-End

```bash
# 1. Build all packages
pnpm build

# 2. Run example app
pnpm dev:vue-example

# 3. Example app uses workspace:* dependencies,
#    so changes to SDK/Vue require rebuilds
```

## Package Manager: pnpm

### Why pnpm?

- **Disk efficiency**: Shared dependency storage via hard links
- **Strict dependencies**: Prevents phantom dependencies
- **Workspace support**: First-class monorepo support
- **Performance**: Faster than npm/yarn in most scenarios

### Requirements

```json
{
  "packageManager": "pnpm@10.0.0",
  "engines": {
    "node": ">=22",
    "pnpm": ">=10"
  }
}
```

### Workspace Commands

```bash
# Install dependencies for all packages
pnpm install

# Add dependency to specific package
pnpm --filter @askdialog/dialog-sdk add posthog-js

# Run script in specific package
pnpm --filter @askdialog/dialog-vue build

# Run script in all packages
pnpm -r build

# Update dependencies
pnpm update
```

## Key Conventions

### Naming
- **Packages**: `@askdialog/dialog-{framework}` or `@askdialog/dialog-sdk`
- **Branches**: `feature/*`, `fix/*`, `chore/*`
- **Commits**: Follow conventional commits (optional but recommended)
- **Tags**: `@askdialog/package-name@version` (auto-generated by changesets)

### File Organization
- **Source**: `src/` directory in each package
- **Output**: `dist/` directory (gitignored, generated)
- **Config**: Root of each package
- **Tests**: Co-located with source files (when implemented)

## Resources

- [Nx Documentation](https://nx.dev)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Semantic Versioning](https://semver.org/)

---

**Last Updated**: 2025-11-25
**Maintainers**: Dialog Team
**License**: MIT
