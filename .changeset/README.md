# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for version management.

## Creating a Changeset

When you make changes that should be released, run:

```bash
pnpm changeset
```

This will prompt you to:
1. Select which packages are affected
2. Choose the semver bump type (major/minor/patch)
3. Write a summary of the changes

## Commit the Changeset

The command creates a markdown file in `.changeset/`. Commit this file with your PR.
