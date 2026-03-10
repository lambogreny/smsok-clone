import { createStore } from 'zustand/vanilla'
import { immer } from 'zustand/middleware/immer'

export type TopupStep = 'select' | 'payment' | 'confirm' | 'done'

export type CreditsState = {
  balance: number
  topupFlow: {
    active: boolean
    step: TopupStep
    selectedPackageId: string | null
    amount: number
  }
}

export type CreditsActions = {
  setBalance: (balance: number) => void
  deductCredits: (amount: number) => void
  addCredits: (amount: number) => void
  startTopup: () => void
  setTopupStep: (step: TopupStep) => void
  selectPackage: (packageId: string, amount: number) => void
  cancelTopup: () => void
  completeTopup: (creditsAdded: number) => void
}

export type CreditsStore = CreditsState & CreditsActions

const defaultTopupFlow = {
  active: false,
  step: 'select' as TopupStep,
  selectedPackageId: null,
  amount: 0,
}

export const defaultCreditsState: CreditsState = {
  balance: 0,
  topupFlow: { ...defaultTopupFlow },
}

export const createCreditsStore = (initState: Partial<CreditsState> = {}) =>
  createStore<CreditsStore>()(
    immer((set) => ({
      ...defaultCreditsState,
      ...initState,
      setBalance: (balance) =>
        set((s) => {
          s.balance = balance
        }),
      deductCredits: (amount) =>
        set((s) => {
          s.balance = Math.max(0, s.balance - amount)
        }),
      addCredits: (amount) =>
        set((s) => {
          s.balance += amount
        }),
      startTopup: () =>
        set((s) => {
          s.topupFlow.active = true
          s.topupFlow.step = 'select'
        }),
      setTopupStep: (step) =>
        set((s) => {
          s.topupFlow.step = step
        }),
      selectPackage: (packageId, amount) =>
        set((s) => {
          s.topupFlow.selectedPackageId = packageId
          s.topupFlow.amount = amount
          s.topupFlow.step = 'payment'
        }),
      cancelTopup: () =>
        set((s) => {
          s.topupFlow = { ...defaultTopupFlow }
        }),
      completeTopup: (creditsAdded) =>
        set((s) => {
          s.balance += creditsAdded
          s.topupFlow = { ...defaultTopupFlow }
        }),
    }))
  )
