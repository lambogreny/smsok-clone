'use client'

import { createContext, useState, useContext, useEffect, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createCampaignWizardStore, type CampaignWizardStore } from '@/stores/campaign-wizard-store'

type CampaignWizardStoreApi = ReturnType<typeof createCampaignWizardStore>

const CampaignWizardStoreContext = createContext<CampaignWizardStoreApi | undefined>(undefined)
const CampaignWizardHydratedContext = createContext(false)

export const CampaignWizardStoreProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() => createCampaignWizardStore())
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Manual rehydrate from localStorage after mount (skipHydration: true)
    store.persist.rehydrate()
    setIsHydrated(true)
  }, [store])

  return (
    <CampaignWizardStoreContext.Provider value={store}>
      <CampaignWizardHydratedContext.Provider value={isHydrated}>
        {children}
      </CampaignWizardHydratedContext.Provider>
    </CampaignWizardStoreContext.Provider>
  )
}

export const useCampaignWizardStore = <T,>(selector: (s: CampaignWizardStore) => T): T => {
  const ctx = useContext(CampaignWizardStoreContext)
  if (!ctx) throw new Error('useCampaignWizardStore must be used within CampaignWizardStoreProvider')
  return useStore(ctx, selector)
}

export const useCampaignWizardStoreHydrated = () => useContext(CampaignWizardHydratedContext)
