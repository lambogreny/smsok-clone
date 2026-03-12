import { createStore } from 'zustand/vanilla'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export type UiState = {
  sidebar: {
    isOpen: boolean
    activeTab: string
  }
  theme: 'dark'
  locale: 'th' | 'en'
  modals: Record<string, boolean>
}

export type UiActions = {
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  setActiveTab: (tab: string) => void
  setLocale: (locale: 'th' | 'en') => void
  openModal: (id: string) => void
  closeModal: (id: string) => void
  toggleModal: (id: string) => void
}

export type UiStore = UiState & UiActions

export const defaultUiState: UiState = {
  sidebar: { isOpen: true, activeTab: 'dashboard' },
  theme: 'dark',
  locale: 'th',
  modals: {},
}

export const createUiStore = (initState: Partial<UiState> = {}) =>
  createStore<UiStore>()(
    devtools(
      persist(
        immer((set) => ({
          ...defaultUiState,
          ...initState,
          toggleSidebar: () =>
            set((s) => {
              s.sidebar.isOpen = !s.sidebar.isOpen
            }),
          setSidebarOpen: (isOpen: boolean) =>
            set((s) => {
              s.sidebar.isOpen = isOpen
            }),
          setActiveTab: (tab: string) =>
            set((s) => {
              s.sidebar.activeTab = tab
            }),
          setLocale: (locale: 'th' | 'en') =>
            set((s) => {
              s.locale = locale
            }),
          openModal: (id: string) =>
            set((s) => {
              s.modals[id] = true
            }),
          closeModal: (id: string) =>
            set((s) => {
              s.modals[id] = false
            }),
          toggleModal: (id: string) =>
            set((s) => {
              s.modals[id] = !s.modals[id]
            }),
        })),
        {
          name: 'smsok-ui',
          partialize: (s) => ({
            theme: s.theme,
            locale: s.locale,
            sidebar: s.sidebar,
          }),
          skipHydration: true,
        }
      ),
      { name: 'UiStore' }
    )
  )
