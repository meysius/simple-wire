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
- **Zod** — Environment config validation
- **Pino** — Structured logging with per-request context
- **Drizzle ORM** — Database access with PostgreSQL
- **AsyncLocalStorage** — Per-request context (e.g. `requestId`) propagated through the entire call chain

Dependency injection is handled manually in your `App` class — no DI container is imposed on you.

## Project Structure

```
src/
├── index.ts                     # App entrypoint — calls buildApp(), mounts controllers
├── setup/
│   ├── app.ts                   # buildApp() function — DI wiring
│   ├── config.ts                # Zod-validated environment config
│   ├── db.ts                    # Drizzle DB client factory + schema aggregator
│   └── async-context.ts        # Per-request context (requestId, etc.)
├── controllers/
│   ├── welcome.controller.ts   # GET / — serves the HTML welcome page
│   └── users.controller.ts     # HTTP route handlers
└── domain/
    └── identity/               # Example domain slice
        ├── identity.schema.ts  # Drizzle table definition + Zod types
        ├── identity.repo.ts    # DB access interface + Drizzle implementation
        └── identity.service.ts # Business logic
```

## Architecture

### Entrypoint (`src/index.ts`)

Calls `buildApp()` to wire all dependencies, then wires the async context middleware and mounts controllers on an Express router:

```typescript
import express, { Router, Request, Response, NextFunction } from "express";
import { buildApp } from "@/setup/app";
import { AsyncContext } from "@/setup/async-context";

const app = buildApp();
const expressApp = express();
expressApp.use(express.json());

expressApp.use((req: Request, _res: Response, next: NextFunction) => {
  app.asyncStorage.run(new AsyncContext(req), () => next());
});

const router = Router();
for (const controller of app.controllers) {
  controller.register(router);
}
expressApp.use(router);

const server = expressApp.listen(app.cfg.PORT, () => {
  app.logger.info(`Service started on port ${app.cfg.PORT}.`);
});

const shutdown = async () => {
  app.logger.info("SIGTERM received. Shutting down gracefully...");
  server.close(async () => {
    await app.shutdown();
    app.logger.info("Closed out remaining connections.");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

### App Builder (`src/setup/app.ts`)

The synchronous `buildApp()` function owns all dependency instantiation and returns a typed `App` object:

```typescript
import { AsyncLocalStorage } from "async_hooks";
import { PinoLogger, createAsyncContextGetter, SWController } from "simple-wire";
import { Config, ConfigSchema } from "@/setup/config";
import { AsyncContext } from "@/setup/async-context";
import { createDbClient, DrizzleDb } from "@/setup/db";
import { WelcomeController } from "@/controllers/welcome.controller";
import { UsersController } from "@/controllers/users.controller";

export function buildApp(): App {
  const cfg = ConfigSchema.parse(process.env);
  const asyncStorage = new AsyncLocalStorage<AsyncContext>();
  const getAsyncContext = createAsyncContextGetter(asyncStorage);

  const logger = new PinoLogger(cfg, getAsyncContext);
  const db = createDbClient(cfg);

  const identityRepo = new DrizzleIdentityRepo(db);
  const identityService = new IdentityService(logger, identityRepo);

  const controllers: SWController[] = [
    new WelcomeController(),
    new UsersController(logger, identityService),
  ];

  return {
    cfg,
    logger,
    db,
    asyncStorage,
    controllers,
    shutdown: async () => {},
  };
}
```

`WelcomeController` serves an HTML welcome page at `GET /` — remove it and its import when you're ready to ship.

### Dependency Injection

All classes receive their dependencies via constructor injection using positional parameters:

```typescript
export class IdentityService {
  constructor(
    private readonly logger: SWLogger,
    private readonly identityRepo: IdentityRepo,
  ) {}
}
```

### Controllers

Controllers implement the `SWController` interface and register their routes via `register(router)`:

```typescript
import { Router } from "express";

export class UsersController implements SWController {
  register(router: Router): void {
    router.get("/users", this.listUsers);
    router.post("/users", this.createUser);
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

Add new domains by creating a new folder under `src/domain/` following the same pattern, then registering them in `src/setup/app.ts` and `src/setup/db.ts`.

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
pnpm db:generate:migrations   # Generate migration files from schema changes
pnpm db:migrate               # Apply pending migrations to the database
pnpm db:studio                # Open Drizzle Studio GUI
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

The core library that applications import. It provides interfaces and utilities for logging, async context, and controller routing — without imposing a DI container or application structure.

**Exports:**

| Export | Description |
|---|---|
| `SWController` | Interface every controller must implement (`register(router: Router): void`) |
| `SWConfig` | Base config interface (`NODE_ENV`, `PORT`, `LOG_LEVEL`) |
| `SWAsyncContext` | Per-request context interface (`getLogContext`, `setInLogContext`) |
| `createAsyncContextGetter` | Factory that creates a typed getter function from an `AsyncLocalStorage` instance |
| `SWLogger` | Logger interface (`info`, `error`) |
| `PinoLogger` | Built-in Pino implementation of `SWLogger`; auto-merges async context into every log line. Constructor: `new PinoLogger(config, getAsyncContext)` |

**Peer dependencies:** `express`, `pino`, `pino-pretty`, `zod`

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

- A `WelcomeController` serving a `GET /` HTML welcome page (remove when ready to ship)
- A `UsersController` with `GET /users` and `POST /users`
- An `identity` domain slice (schema, repo, service)
- Drizzle ORM + PostgreSQL with migrations
- Zod-validated environment config
- Per-request `AsyncContext` with `requestId`

It serves two purposes: a **reference** for developers to understand conventions, and the **template source** that `create-simple-wire` bundles and copies when scaffolding new projects.

---

## Contributing

### Development Commands

```bash
pnpm build               # Build all packages (simple-wire, create-simple-wire, starter-template)
pnpm dev                 # Run simple-wire and starter-template in dev mode with hot reloading
pnpm clean               # Remove all dist/, node_modules, and copied template artifacts
pnpm create-simple-wire  # Build create-simple-wire and run it in the parent directory (local test)
```

### Publishing

```bash
1. npm login
2. Update version number of simple-wire in packages/simple-wire/package.json
3. pnpm publish:simple-wire
4. Update SIMPLE_WIRE_VERSION in packages/create-simple-wire/src/index.ts
5. pnpm publish:create-simple-wire
```

### Creating a Simple Wire Application (for testing)

```bash
npx create-simple-wire@latest
pnpm create simple-wire@latest
```
