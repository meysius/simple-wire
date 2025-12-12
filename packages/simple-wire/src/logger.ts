import pino from "pino";
import { BaseConfig } from "./config";
import { GetAsyncContextFn } from "./async-context";

export interface ILogger {
  info(message: string): void;
  error(message: string): void;
}

type LoggerDeps = {
  config: BaseConfig;
  getAsyncContext: GetAsyncContextFn;
}

export class Logger implements ILogger {
  private readonly getAsyncContext: GetAsyncContextFn;
  private readonly pino: pino.Logger;

  constructor({ getAsyncContext, config }: LoggerDeps) {
    this.getAsyncContext = getAsyncContext;
    this.pino = pino({
      mixin: () => {
        const context = this.getAsyncContext();
        if (!context) return {};
        return {
          requestId: context.requestId,
          ...Object.fromEntries(context.logContext)
        };
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
