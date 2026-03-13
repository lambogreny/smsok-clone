'use client'

import { createContext, useState, useContext, useEffect, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createUiStore, type UiStore } from '@/stores/ui-store'

type UiStoreApi = ReturnType<typeof createUiStore>

const UiStoreContext = createContext<UiStoreApi | undefined>(undefined)
const UiHydratedContext = createContext(false)

export const UiStoreProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() => createUiStore())
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Manual rehydrate from localStorage after mount (skipHydration: true)
    store.persist.rehydrate()
    const timer = window.setTimeout(() => setIsHydrated(true), 0)
    return () => window.clearTimeout(timer)
  }, [store])

  return (
    <UiStoreContext.Provider value={store}>
      <UiHydratedContext.Provider value={isHydrated}>
        {children}
      </UiHydratedContext.Provider>
    </UiStoreContext.Provider>
  )
}

export const useUiStore = <T,>(selector: (s: UiStore) => T): T => {
  const ctx = useContext(UiStoreContext)
  if (!ctx) throw new Error('useUiStore must be used within UiStoreProvider')
  return useStore(ctx, selector)
}

export const useUiStoreHydrated = () => useContext(UiHydratedContext)
