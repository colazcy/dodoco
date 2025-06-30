import { StoreApi, UseBoundStore } from 'zustand'

type Use<T> = {
  [K in keyof T]: () => T[K];
}

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: Use<T> }
  : never

const createSelectors = <
  State extends object,
  Store extends UseBoundStore<StoreApi<State>>,
>(
    _store: Store
  ): WithSelectors<Store> => {
  const store = _store as WithSelectors<Store>
  const use: Partial<Use<State>> = {}
  for (const k of Object.keys(store.getState()) as Array<keyof State>) {
    use[k] = () => store((s) => s[k])
  }
  store.use = use as Use<State>
  return store
}

export default createSelectors
