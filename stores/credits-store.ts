import { createStore } from 'zustand/vanilla'
import { immer } from 'zustand/middleware/immer'

export type PurchaseStep = 'select' | 'payment' | 'confirm' | 'done'

export type PackagesState = {
  smsRemaining: number
  smsTotal: number
  purchaseFlow: {
    active: boolean
    step: PurchaseStep
    selectedPackageId: string | null
    smsAmount: number
  }
}

export type PackagesActions = {
  setSmsRemaining: (remaining: number) => void
  setSmsTotal: (total: number) => void
  deductSms: (amount: number) => void
  addSms: (amount: number) => void
  startPurchase: () => void
  setPurchaseStep: (step: PurchaseStep) => void
  selectPackage: (packageId: string, smsAmount: number) => void
  cancelPurchase: () => void
  completePurchase: (smsAdded: number) => void
}

export type PackagesStore = PackagesState & PackagesActions

const defaultPurchaseFlow = {
  active: false,
  step: 'select' as PurchaseStep,
  selectedPackageId: null,
  smsAmount: 0,
}

export const defaultPackagesState: PackagesState = {
  smsRemaining: 0,
  smsTotal: 0,
  purchaseFlow: { ...defaultPurchaseFlow },
}

export const createPackagesStore = (initState: Partial<PackagesState> = {}) =>
  createStore<PackagesStore>()(
    immer((set) => ({
      ...defaultPackagesState,
      ...initState,
      setSmsRemaining: (remaining) =>
        set((s) => {
          s.smsRemaining = remaining
        }),
      setSmsTotal: (total) =>
        set((s) => {
          s.smsTotal = total
        }),
      deductSms: (amount) =>
        set((s) => {
          s.smsRemaining = Math.max(0, s.smsRemaining - amount)
        }),
      addSms: (amount) =>
        set((s) => {
          s.smsRemaining += amount
        }),
      startPurchase: () =>
        set((s) => {
          s.purchaseFlow.active = true
          s.purchaseFlow.step = 'select'
        }),
      setPurchaseStep: (step) =>
        set((s) => {
          s.purchaseFlow.step = step
        }),
      selectPackage: (packageId, smsAmount) =>
        set((s) => {
          s.purchaseFlow.selectedPackageId = packageId
          s.purchaseFlow.smsAmount = smsAmount
          s.purchaseFlow.step = 'payment'
        }),
      cancelPurchase: () =>
        set((s) => {
          s.purchaseFlow = { ...defaultPurchaseFlow }
        }),
      completePurchase: (smsAdded) =>
        set((s) => {
          s.smsRemaining += smsAdded
          s.purchaseFlow = { ...defaultPurchaseFlow }
        }),
    }))
  )

// Backwards compatibility aliases
export type CreditsState = PackagesState
export type CreditsActions = PackagesActions
export type CreditsStore = PackagesStore
export type TopupStep = PurchaseStep
export const defaultCreditsState = defaultPackagesState
export const createCreditsStore = createPackagesStore
