import express, { Request, Response } from "express";
import { AsyncLocalStorage } from "async_hooks";
import { InjectionMode, createContainer, asValue, NameAndRegistrationPair, Resolver } from "awilix";
import { SWController } from "./controller";
import { PinoLogger, SWLogger } from "./logger";
import { AsyncContextGetter, SWAsyncContext, createAsyncContextGetter } from "./async-context";
import { SWConfig } from "./config";

export interface BaseCradle<Config extends SWConfig, AsyncContext extends SWAsyncContext> {
  config: Config;
  getAsyncContext: AsyncContextGetter<AsyncContext>;
  logger: SWLogger;
}

type StrictMap<T> = {
  [K in keyof T]: Resolver<T[K]>
};

export interface AppOptions<Config extends SWConfig, AsyncContext extends SWAsyncContext, ControllersCradle, ProvidersCradle> {
  createAsyncContext: (req: Request) => AsyncContext;
  config: Resolver<Config>;
  logger: Resolver<SWLogger>;
  controllers: StrictMap<ControllersCradle>;
  providers: StrictMap<ProvidersCradle>;
}

export async function createApp<Config extends SWConfig, AsyncContext extends SWAsyncContext, ControllersCradle, ProvidersCradle>(
  options: AppOptions<Config, AsyncContext, ControllersCradle, ProvidersCradle>
) {

  type FullCradle = BaseCradle<Config, AsyncContext> & ControllersCradle & ProvidersCradle;

  const container = createContainer<FullCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  const asyncStorage = new AsyncLocalStorage<AsyncContext>();

  function requestContextMiddleware(req: Request, res: Response, next: Function) {
    const context = options.createAsyncContext(req);
    asyncStorage.run(context, () => next());
  }

  container.register({
    getAsyncContext: asValue(createAsyncContextGetter<AsyncContext>(asyncStorage)),
    config: options.config,
    logger: options.logger,
    ...options.providers,
    ...options.controllers,
  } as NameAndRegistrationPair<FullCradle>);

  const logger = container.resolve<SWLogger>('logger');
  const config = container.resolve<Config>('config');

  const app = express();
  app.use(express.json());
  app.use(requestContextMiddleware);

  for (const key of Object.keys(options.controllers)) {
    const controller = container.resolve<SWController>(key);
    const routes = controller.getRoutes();
    routes.forEach((route) => {
      const { method, path, handler } = route;
      app[method](path, handler.bind(controller));
    });
  }

  const shutdown = () => {
    const logger = container.resolve<SWLogger>('logger');
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Closed out remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  const server = app.listen(config.PORT, () => {
    logger.info(`Service started on port ${config.PORT}.`);
  });
}