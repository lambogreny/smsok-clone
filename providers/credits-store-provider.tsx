'use client'

import { createContext, useState, useContext, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createPackagesStore, type PackagesStore } from '@/stores/credits-store'

type PackagesStoreApi = ReturnType<typeof createPackagesStore>
const PackagesStoreContext = createContext<PackagesStoreApi | undefined>(undefined)

export const PackagesStoreProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() => createPackagesStore())
  return <PackagesStoreContext.Provider value={store}>{children}</PackagesStoreContext.Provider>
}

export const usePackagesStore = <T,>(selector: (s: PackagesStore) => T): T => {
  const ctx = useContext(PackagesStoreContext)
  if (!ctx) throw new Error('usePackagesStore must be used within PackagesStoreProvider')
  return useStore(ctx, selector)
}

// Backwards compatibility aliases
export const CreditsStoreProvider = PackagesStoreProvider
export const useCreditsStore = usePackagesStore
