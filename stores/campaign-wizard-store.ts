import { createStore } from 'zustand/vanilla'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export type CampaignWizardStep = 'details' | 'audience' | 'message' | 'schedule' | 'review'

export type CampaignDraft = {
  name: string
  targetGroupId: string | null
  message: string
  senderName: string
  scheduled: boolean
  scheduleDate?: string
  templateId: string | null
}

export type CampaignWizardState = {
  currentStep: CampaignWizardStep
  draft: CampaignDraft
  completedSteps: CampaignWizardStep[]
}

export type CampaignWizardActions = {
  setStep: (step: CampaignWizardStep) => void
  nextStep: () => void
  prevStep: () => void
  updateDraft: (updates: Partial<CampaignDraft>) => void
  markStepComplete: (step: CampaignWizardStep) => void
  resetWizard: () => void
}

export type CampaignWizardStore = CampaignWizardState & CampaignWizardActions

const steps: CampaignWizardStep[] = ['details', 'audience', 'message', 'schedule', 'review']

const defaultDraft: CampaignDraft = {
  name: '',
  targetGroupId: null,
  message: '',
  senderName: '',
  scheduled: false,
  templateId: null,
}

export const defaultCampaignWizardState: CampaignWizardState = {
  currentStep: 'details',
  draft: { ...defaultDraft },
  completedSteps: [],
}

export const createCampaignWizardStore = (initState: Partial<CampaignWizardState> = {}) =>
  createStore<CampaignWizardStore>()(
    devtools(
      persist(
        immer((set) => ({
          ...defaultCampaignWizardState,
          ...initState,
          setStep: (step) =>
            set((s) => {
              s.currentStep = step
            }),
          nextStep: () =>
            set((s) => {
              const idx = steps.indexOf(s.currentStep)
              if (idx < steps.length - 1) {
                s.currentStep = steps[idx + 1]
              }
            }),
          prevStep: () =>
            set((s) => {
              const idx = steps.indexOf(s.currentStep)
              if (idx > 0) {
                s.currentStep = steps[idx - 1]
              }
            }),
          updateDraft: (updates) =>
            set((s) => {
              Object.assign(s.draft, updates)
            }),
          markStepComplete: (step) =>
            set((s) => {
              if (!s.completedSteps.includes(step)) {
                s.completedSteps.push(step)
              }
            }),
          resetWizard: () =>
            set((s) => {
              s.currentStep = 'details'
              s.draft = { ...defaultDraft }
              s.completedSteps = []
            }),
        })),
        {
          name: 'smsok-campaign-wizard',
          partialize: (s) => ({
            currentStep: s.currentStep,
            draft: s.draft,
            completedSteps: s.completedSteps,
          }),
          skipHydration: true,
        }
      ),
      { name: 'CampaignWizardStore' }
    )
  )
