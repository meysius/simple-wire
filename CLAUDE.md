# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

This is a pnpm workspace monorepo with three packages:

```
packages/
  simple-wire/          # Core framework — published to npm as "simple-wire"
  create-simple-wire/   # CLI scaffolding tool — published as "create-simple-wire"
starter-template/       # Reference app & source for the CLI's bundled template
```

`starter-template` depends on `simple-wire` via `workspace:*`, so core changes are immediately reflected. When `create-simple-wire` is built, its `prebuild` script copies `starter-template/` into `packages/create-simple-wire/template/`.
