'use client'

import { createContext, useState, useContext, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createAuthStore, type AuthStore } from '@/stores/auth-store'

type AuthStoreApi = ReturnType<typeof createAuthStore>
const AuthStoreContext = createContext<AuthStoreApi | undefined>(undefined)

export const AuthStoreProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() => createAuthStore())
  return <AuthStoreContext.Provider value={store}>{children}</AuthStoreContext.Provider>
}

export const useAuthStore = <T,>(selector: (s: AuthStore) => T): T => {
  const ctx = useContext(AuthStoreContext)
  if (!ctx) throw new Error('useAuthStore must be used within AuthStoreProvider')
  return useStore(ctx, selector)
}
