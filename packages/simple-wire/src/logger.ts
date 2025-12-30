import pino from "pino";
import { IConfig } from "./config";
import { AsyncContextGetter, IAsyncContext } from "./async-context";

export interface ILogger {
  info(message: string): void;
  error(message: string): void;
}

type LoggerDeps = {
  config: IConfig;
  getAsyncContext: AsyncContextGetter<IAsyncContext>;
}

export class Logger implements ILogger {
  private readonly pino: pino.Logger;

  constructor({ getAsyncContext, config }: LoggerDeps) {
    this.pino = pino({
      mixin: () => {
        let logContext = {};
        try {
          const context = getAsyncContext();
          logContext = context.getLogContext();
        } catch {}
        return { ...logContext };
      },
      transport: config.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      } : undefined,
    });
  }

  info(message: string): void {
    this.pino.info(message);
  }

  error(message: string): void {
    this.pino.error(message);
  }
}
