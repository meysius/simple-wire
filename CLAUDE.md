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

## simple-wire
simple-wire is an opinionated, lightweight framework for building typescript backends. The main goal of simple-wire is to provide a solid bare minimum structure to help you sustain your delivery speed as your application grows in an unopinionated world such as ExpressJS.

simple-wire's philosophy is that you only need three design patterns to keep delivering efficiently as your application grows:

1. Separate Domain and Presentation Layers
2. Split Domain into Department Slices
3. Use Dependency Injection


## Project Structure

```
src/
├── index.ts                     # App entrypoint & DI container wiring
├── setup/
│   ├── config.ts                # Zod-validated environment config
│   ├── db.ts                    # Drizzle DB client factory + schema aggregator
│   └── async-context.ts        # Per-request context (requestId, etc.)
├── controllers/
│   └── users.controller.ts     # HTTP route handlers
└── domain/
    └── identity/               # Example domain slice
        ├── identity.schema.ts  # Drizzle table definition + Zod types
        ├── identity.repo.ts    # DB access interface + Drizzle implementation
        └── identity.service.ts # Business logic
```

## Architecture

### Entrypoint (`src/index.ts`)

Calls `createApp()` from `simple-wire` and registers all dependencies into the Awilix DI container. Two typed interfaces define the container's shape:

```typescript
interface ControllersCradle {
  usersController: UsersController;
}

interface ProvidersCradle {
  db: DrizzleDb;
  identityService: IdentityService;
  identityRepo: IdentityRepo;
}

createApp<Config, AsyncContext, ControllersCradle, ProvidersCradle>({ ... });
```

### Dependency Injection

All classes receive their dependencies via constructor injection using a typed `Props` object:

```typescript
type Props = {
  logger: SWLogger;
  identityRepo: IdentityRepo;
};

export class IdentityService {
  constructor({ logger, identityRepo }: Props) { ... }
}
```

### Controllers

Controllers implement the `SWController` interface and define their routes via `getRoutes()`:

```typescript
export class UsersController implements SWController {
  getRoutes(): RouteDefinition[] {
    return [
      { method: 'get',  path: '/users', handler: this.listUsers },
      { method: 'post', path: '/users', handler: this.createUser },
    ];
  }
}
```

Routes are automatically registered on Express at startup — no manual `app.get(...)` calls needed.

### Domain Slices

Each domain owns its schema, repo, and service in one folder. The three-file pattern per slice:

| File | Role |
|---|---|
| `*.schema.ts` | Drizzle table definition + Zod-inferred TypeScript types |
| `*.repo.ts` | Repository interface + Drizzle implementation |
| `*.service.ts` | Business logic, depends on the repo |

Add new domains by creating a new folder under `src/domain/` following the same pattern, then registering them in `src/index.ts` and `src/setup/db.ts`.

### Configuration

Environment variables are validated at startup using a Zod schema that extends `SWConfig`:

```typescript
export const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PORT: z.coerce.number().min(1000).default(3000),
  DATABASE_URL: z.string(),
}) satisfies z.ZodType<SWConfig>;
```