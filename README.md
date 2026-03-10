# simple-wire
simple-wire is an opinionated, lightweight framework for building typescript backends. The main goal of simple-wire is to provide a solid bare minimum structure to help you sustain your delivery speed as your application grows in an unopinionated world such as ExpressJS.

simple-wire's philosophy is that you only need three design patterns to keep delivering efficiently as your application grows:

1. Separate Domain and Presentation Layers
2. Split Domain into Department Slices
3. Use Dependency Injection

## Getting Started
To get started use the following command to create a new simple-wire application using the starter template:

```bash
pnpm create simple-wire@latest
```

This will prompt you for a project name, scaffold a new project from the starter template, and print next steps.

## What's Included

The generated project comes pre-wired with:

- **Express** — HTTP server
- **Awilix** — Dependency injection container
- **Zod** — Environment config validation
- **Pino** — Structured logging with per-request context
- **Drizzle ORM** — Database access with PostgreSQL
- **AsyncLocalStorage** — Per-request context (e.g. `requestId`) propagated through the entire call chain

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

### Per-Request Context

`AsyncContext` implements `SWAsyncContext` and is created fresh for each request. It reads `x-request-id` from the incoming headers (or generates one) and makes it available throughout the entire async call chain — including inside the logger:

```typescript
export class AsyncContext implements SWAsyncContext {
  constructor(req: Request) {
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random()}`;
    this.logContext = { requestId };
  }
}
```

Every log line automatically includes the `requestId` with no manual passing required.

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
npx drizzle-kit generate   # Generate migrations from schema changes
npx drizzle-kit migrate    # Apply pending migrations
npx drizzle-kit push       # Push schema directly (dev only)
npx drizzle-kit studio     # Open Drizzle Studio GUI
```

## Monorepo

This repository is a pnpm workspace monorepo containing three packages that work together:

```
simple-wire/
├── packages/
│   ├── simple-wire/          # Core framework (published to npm)
│   └── create-simple-wire/   # CLI scaffolding tool (published to npm)
└── starter-template/         # Reference project & scaffold source
```

`starter-template` uses `simple-wire` via `workspace:*`, so changes to the core package are immediately reflected during development. When `create-simple-wire` is built, its `prebuild` script copies `starter-template` into `packages/create-simple-wire/template/`, which is then bundled and shipped with the CLI.

### Workspace Commands

```bash
pnpm dev                  # Run simple-wire and starter-template in parallel with hot reload
pnpm build                # Build all packages in dependency order
pnpm clean                # Remove all dist/, node_modules, and copied template artifacts
pnpm create-simple-wire   # Build create-simple-wire and run it locally (for testing)

pnpm publish:simple-wire          # Build and publish simple-wire to npm
pnpm publish:create-simple-wire   # Build and publish create-simple-wire to npm
                                  # (update SIMPLE_WIRE_VERSION in src/index.ts first)
```

---

### `packages/simple-wire` — Core Framework

**npm:** `simple-wire` · **Version:** `0.0.1` · **License:** MIT

The core library that applications import. It wires together Express, Awilix, and Pino into a single `createApp()` call.

**Exports:**

| Export | Description |
|---|---|
| `createApp()` | Bootstraps the Express server, registers the DI container, mounts all controller routes, and handles graceful shutdown |
| `SWController` | Interface every controller must implement (`getRoutes(): RouteDefinition[]`) |
| `RouteDefinition` | `{ path, method, handler }` route descriptor |
| `SWConfig` | Base config interface (`NODE_ENV`, `PORT`, `LOG_LEVEL`) |
| `SWAsyncContext` | Per-request context interface (`getLogContext`, `setInLogContext`) |
| `SWLogger` | Logger interface (`info`, `error`) |
| `PinoLogger` | Built-in Pino implementation of `SWLogger`; auto-merges async context into every log line |
| `BaseCradle` | Base DI cradle type (`config`, `logger`, `getAsyncContext`) |

**Peer dependencies:** `express`, `awilix`, `pino`, `zod`

**Build:** `pnpm build` (TypeScript → `dist/`); `pnpm dev` for watch mode.

---

### `packages/create-simple-wire` — CLI Scaffolding Tool

**npm:** `create-simple-wire` · **Version:** `0.0.2` · **License:** MIT

A CLI tool that scaffolds new simple-wire projects. Intended to be run via:

```bash
pnpm create simple-wire@latest
# or
npx create-simple-wire@latest
```

**What it does:**
1. Prompts for a project name (validates the directory doesn't already exist)
2. Copies the bundled `template/` directory to the target path
3. Patches `package.json` — sets the project name, version, and pins `simple-wire` to the current release version
4. Renames `_gitignore` → `.gitignore` and copies `.env.example` → `.env` (npm strips leading dots on publish)
5. Prints `cd`, `pnpm install`, and `pnpm dev` next steps

**Build:** The `prebuild` script copies `starter-template` into `template/` (stripping `node_modules` and `dist`) before compiling. Both `dist/` and `template/` are included in the published package via the `files` field.

**Dependencies:** `fs-extra`, `prompts`, `kleur`

---

### `starter-template` — Reference Project

The source of truth for what a new simple-wire application looks like. It is a fully working Express API with:

- A `UsersController` with `GET /users` and `POST /users`
- An `identity` domain slice (schema, repo, service)
- Drizzle ORM + PostgreSQL with migrations
- Zod-validated environment config
- Per-request `AsyncContext` with `requestId`

It serves two purposes: a **reference** for developers to understand conventions, and the **template source** that `create-simple-wire` bundles and copies when scaffolding new projects.
