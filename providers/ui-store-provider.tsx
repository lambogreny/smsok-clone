'use client'

import { createContext, useState, useContext, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createUiStore, type UiStore } from '@/stores/ui-store'

type UiStoreApi = ReturnType<typeof createUiStore>
const UiStoreContext = createContext<UiStoreApi | undefined>(undefined)

export const UiStoreProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() => createUiStore())
  return <UiStoreContext.Provider value={store}>{children}</UiStoreContext.Provider>
}

export const useUiStore = <T,>(selector: (s: UiStore) => T): T => {
  const ctx = useContext(UiStoreContext)
  if (!ctx) throw new Error('useUiStore must be used within UiStoreProvider')
  return useStore(ctx, selector)
}
