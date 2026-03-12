'use client'

import type { ReactNode } from 'react'
import { AuthStoreProvider } from './auth-store-provider'
import { UiStoreProvider } from './ui-store-provider'
import { NotificationsStoreProvider } from './notifications-store-provider'
import { SmsStoreProvider } from './sms-store-provider'
import { ContactsStoreProvider } from './contacts-store-provider'
import { CampaignWizardStoreProvider } from './campaign-wizard-store-provider'
import { PackagesStoreProvider } from './credits-store-provider'

export function StoreProviders({ children }: { children: ReactNode }) {
  return (
    <AuthStoreProvider>
      <UiStoreProvider>
        <NotificationsStoreProvider>
          <SmsStoreProvider>
            <ContactsStoreProvider>
              <CampaignWizardStoreProvider>
                <PackagesStoreProvider>
                  {children}
                </PackagesStoreProvider>
              </CampaignWizardStoreProvider>
            </ContactsStoreProvider>
          </SmsStoreProvider>
        </NotificationsStoreProvider>
      </UiStoreProvider>
    </AuthStoreProvider>
  )
}
