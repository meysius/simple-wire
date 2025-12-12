import express, { Request, Response } from "express";
import { InjectionMode, createContainer, asClass, asValue, NameAndRegistrationPair, Resolver } from "awilix";
import { z } from "zod";
import { IController } from "./controller";
import { Logger, ILogger } from "./logger";
import { getAsyncContext, Context, runWithContext, GetAsyncContextFn } from "./async-context";
import { BaseConfig } from "./config";

export interface BaseCradle<T extends BaseConfig> {
  config: T;
  logger: ILogger;
  getAsyncContext: GetAsyncContextFn;
}

type StrictMap<T> = {
  [K in keyof T]: Resolver<T[K]>
};

export interface AppOptions<T extends BaseConfig, P, C> {
  configSchema: z.ZodType<T>;
  providers: StrictMap<P>;
  controllers: StrictMap<C>;
}

function requestContextMiddleware(req: Request, res: Response, next: Function) {
  const requestId = (req.headers['x-request-id'] as string) || `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const context = new Context(requestId);
  runWithContext(context, () => next());
}

export async function createApp<T extends BaseConfig, P, C>(
  options: AppOptions<T, P, C>
) {
  const app = express();
  const config = options.configSchema.parse(process.env);
  const port = config.PORT;

  app.use(express.json());
  app.use(requestContextMiddleware);

  type FullCradle = P & C & BaseCradle<T>;

  const container = createContainer<FullCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  container.register({
    ...options.providers,
    ...options.controllers,
    logger: asClass(Logger).singleton(),
    getAsyncContext: asValue(getAsyncContext),
    config: asValue(config),
  } as NameAndRegistrationPair<FullCradle>);

  const logger = container.resolve<ILogger>('logger');

  for (const key of Object.keys(options.controllers)) {
    const controller = container.resolve<IController>(key);
    const routes = controller.getRoutes();
    routes.forEach((route) => {
      const { method, path, handler } = route;
      app[method](path, handler.bind(controller));
    });
  }

  const shutdown = () => {
    const logger = container.resolve<Logger>('logger');
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Closed out remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  const server = app.listen(port, () => {
    logger.info(`Service started on port ${port}`);
  });
}