'use client'

import { createContext, useState, useContext, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createContactsStore, type ContactsStore } from '@/stores/contacts-store'

type ContactsStoreApi = ReturnType<typeof createContactsStore>
const ContactsStoreContext = createContext<ContactsStoreApi | undefined>(undefined)

export const ContactsStoreProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() => createContactsStore())
  return <ContactsStoreContext.Provider value={store}>{children}</ContactsStoreContext.Provider>
}

export const useContactsStore = <T,>(selector: (s: ContactsStore) => T): T => {
  const ctx = useContext(ContactsStoreContext)
  if (!ctx) throw new Error('useContactsStore must be used within ContactsStoreProvider')
  return useStore(ctx, selector)
}
