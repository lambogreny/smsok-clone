'use client'

import { createContext, useState, useContext, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createNotificationsStore, type NotificationsStore } from '@/stores/notifications-store'

type NotificationsStoreApi = ReturnType<typeof createNotificationsStore>
const NotificationsStoreContext = createContext<NotificationsStoreApi | undefined>(undefined)

export const NotificationsStoreProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() => createNotificationsStore())
  return <NotificationsStoreContext.Provider value={store}>{children}</NotificationsStoreContext.Provider>
}

export const useNotificationsStore = <T,>(selector: (s: NotificationsStore) => T): T => {
  const ctx = useContext(NotificationsStoreContext)
  if (!ctx) throw new Error('useNotificationsStore must be used within NotificationsStoreProvider')
  return useStore(ctx, selector)
}
