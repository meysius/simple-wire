# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server with hot reload (tsx watch)
pnpm build        # Compile TypeScript to dist/
pnpm start        # Run compiled production build
pnpm typecheck    # Type check without emitting files
pnpm clean        # Remove dist/ folder
```

### Database (Drizzle)
```bash
npx drizzle-kit generate    # Generate migrations from schema changes
npx drizzle-kit migrate     # Apply pending migrations
npx drizzle-kit push        # Push schema directly (dev only)
npx drizzle-kit studio      # Open Drizzle Studio GUI
```

## Architecture

This is a TypeScript/Express REST API using Awilix for dependency injection.

### Dependency Injection Pattern
- `src/index.ts` defines the DI container (`Cradle` interface) and bootstraps the app via `createApp()`
- Dependencies are registered with `asClass()` or `asFunction()` from Awilix
- Classes receive dependencies through constructor injection using a deps object: `constructor({ dep1, dep2 }: Pick<Cradle, 'dep1' | 'dep2'>)`
- Use `Pick<Cradle, ...>` to type the dependency subset each class needs

### Layered Structure
- **Controllers** (`src/controllers/`): Implement `IController` interface with `getRoutes()` returning route definitions. Listed in `controllers` array in `createApp()`.
- **Services** (`src/services/`): Business logic layer, injected into controllers
- **Repositories** (`src/repos/`): Data access layer using Drizzle ORM, injected into services
- **Database** (`src/db/`): Schema definitions (`schema.ts`) and Drizzle client factory (`index.ts`)

### Request Context
- `AsyncLocalStorage` provides per-request context (`src/app/async-context.ts`)
- Middleware sets `requestId` on each request
- Logger automatically includes `requestId` via pino mixin

### Configuration
- Environment variables validated with Zod schema (`src/config.ts`)
- Extend `ConfigSchema` and `BaseConfig` for app-specific config
- Uses `dotenv` for local development

### Path Aliases
- `@/*` maps to `src/*` (configured in `tsconfig.json`)
