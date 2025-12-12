import { AsyncLocalStorage } from 'async_hooks';

export interface IContext {
  requestId: string | undefined;
  logContext: Map<string, number | string | boolean>;
}

export class Context implements IContext {
  public requestId: string | undefined;
  public logContext: Map<string, number | string | boolean>;

  constructor(requestId?: string) {
    this.logContext = new Map();
    this.requestId = requestId;
    if (requestId) {
      this.logContext.set('requestId', requestId);
    }
  }
}

const asyncStorage = new AsyncLocalStorage<IContext>();

export function getAsyncContext(): Context | undefined {
  return asyncStorage.getStore();
}

export type GetAsyncContextFn = typeof getAsyncContext;

export function runWithContext<T>(context: IContext, callback: () => T): T {
  return asyncStorage.run(context, callback);
}
