import { AsyncLocalStorage } from 'async_hooks';
import e from 'express';

export interface IAsyncContext {
  getLogContext(): Record<string, string | number | boolean>;
  setInLogContext(key: string, value: string | number | boolean): void;
}

export type AsyncContextGetter<AC extends IAsyncContext> = () => AC;

export const createAsyncContextGetter = function<AC extends IAsyncContext>(asyncStorage: AsyncLocalStorage<AC>): AsyncContextGetter<AC> {
  return function() {
    const context = asyncStorage.getStore();
    if (!context) {
      throw new Error('No AsyncContext found in the asyncStorage. Try registering one using asyncStorage.run(...)');
    }
    return context;
  };
}
