'use client'

import { createContext, useState, useContext, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createSmsStore, type SmsStore } from '@/stores/sms-store'

type SmsStoreApi = ReturnType<typeof createSmsStore>
const SmsStoreContext = createContext<SmsStoreApi | undefined>(undefined)

export const SmsStoreProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() => createSmsStore())
  return <SmsStoreContext.Provider value={store}>{children}</SmsStoreContext.Provider>
}

export const useSmsStore = <T,>(selector: (s: SmsStore) => T): T => {
  const ctx = useContext(SmsStoreContext)
  if (!ctx) throw new Error('useSmsStore must be used within SmsStoreProvider')
  return useStore(ctx, selector)
}
