import { AsyncLocalStorage } from 'async_hooks';

export interface SWAsyncContext {
  getLogContext(): Record<string, string | number | boolean>;
  setInLogContext(key: string, value: string | number | boolean): void;
}

export type AsyncContextGetter<AsyncContextImpl extends SWAsyncContext> = () => AsyncContextImpl;

export const createAsyncContextGetter = function<AsyncContextImpl extends SWAsyncContext>(asyncStorage: AsyncLocalStorage<AsyncContextImpl>): AsyncContextGetter<AsyncContextImpl> {
  return function() {
    const context = asyncStorage.getStore();
    if (!context) {
      throw new Error('No AsyncContext found in the asyncStorage. Try registering one using asyncStorage.run(...)');
    }
    return context;
  };
}
