import express, { Request, Response } from "express";
import { AsyncLocalStorage } from "async_hooks";
import { InjectionMode, createContainer, asValue, NameAndRegistrationPair, Resolver } from "awilix";
import { IController } from "./controller";
import { Logger, ILogger } from "./logger";
import { AsyncContextGetter, IAsyncContext, createAsyncContextGetter } from "./async-context";
import { IConfig } from "./config";

export interface BaseCradle<C extends IConfig, AC extends IAsyncContext> {
  config: C;
  getAsyncContext: AsyncContextGetter<AC>;
  logger: ILogger;
}

type StrictMap<T> = {
  [K in keyof T]: Resolver<T[K]>
};

export interface AppOptions<C extends IConfig, AC extends IAsyncContext, ControllersCradle, ProvidersCradle> {
  createAsyncContext: (req: Request) => AC;
  config: Resolver<C>;
  logger: Resolver<ILogger>;
  controllers: StrictMap<ControllersCradle>;
  providers: StrictMap<ProvidersCradle>;
}

export async function createApp<C extends IConfig, AC extends IAsyncContext, ControllersCradle, ProvidersCradle>(
  options: AppOptions<C, AC, ControllersCradle, ProvidersCradle>
) {

  type FullCradle = BaseCradle<C, AC> & ControllersCradle & ProvidersCradle;

  const container = createContainer<FullCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  const asyncStorage = new AsyncLocalStorage<AC>();

  function requestContextMiddleware(req: Request, res: Response, next: Function) {
    const context = options.createAsyncContext(req);
    asyncStorage.run(context, () => next());
  }

  container.register({
    getAsyncContext: asValue(createAsyncContextGetter<AC>(asyncStorage)),
    config: options.config,
    logger: options.logger,
    ...options.providers,
    ...options.controllers,
  } as NameAndRegistrationPair<FullCradle>);

  const logger = container.resolve<ILogger>('logger');
  const config = container.resolve<C>('config');

  const app = express();
  app.use(express.json());
  app.use(requestContextMiddleware);

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

  const server = app.listen(config.PORT, () => {
    logger.info(`Service started on port ${config.PORT}.`);
  });
}