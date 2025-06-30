import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import { load } from '@tauri-apps/plugin-store'
import { useEffect, useState } from 'react'
import createSelectors from './createSelectors'

const store = await load('config.json', { autoSave: true })

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const val = await store.get<{ value: string }>(name)
    return val?.value ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await store.set(name, { value })
  },
  removeItem: async (name: string): Promise<void> => {
    await store.delete(name)
  }
}

export interface State {
  batchSize: number
  pcmThreshold: number
  timeThreshold: number
  enableClassify: boolean
  probThreshold: number
}

const defaultState: State = {
  batchSize: 1024,
  pcmThreshold: -3,
  timeThreshold: 4.5,
  enableClassify: true,
  probThreshold: 0.5
}

const useConfigStoreBase = create<State>()(
  persist(() => defaultState, {
    name: 'config-storage',
    storage: createJSONStorage(() => storage)
  })
)

export const useConfigStore = createSelectors(useConfigStoreBase)

export const useHydration = (): boolean => {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const unsubFinishHydration = useConfigStore.persist.onFinishHydration(() =>
      setHydrated(true)
    )

    setHydrated(useConfigStore.persist.hasHydrated())

    return () => {
      unsubFinishHydration()
    }
  }, [])

  return hydrated
}
