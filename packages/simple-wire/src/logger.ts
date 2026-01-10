import pino from "pino";
import { SWConfig } from "./config";
import { AsyncContextGetter, SWAsyncContext } from "./async-context";

export interface SWLogger {
  info(message: string): void;
  error(message: string): void;
}

type LoggerDeps = {
  config: SWConfig;
  getAsyncContext: AsyncContextGetter<SWAsyncContext>;
}

export class PinoLogger implements SWLogger {
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
