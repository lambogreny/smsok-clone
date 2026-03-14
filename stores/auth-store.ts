import { createStore } from 'zustand/vanilla'

export type User = {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  organizationId?: string | null
}

export type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  permissions: string[]
}

export type AuthActions = {
  login: (user: User, token: string) => void
  logout: () => void
  setPermissions: (permissions: string[]) => void
  updateUser: (updates: Partial<User>) => void
}

export type AuthStore = AuthState & AuthActions

export const defaultAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  permissions: [],
}

export const createAuthStore = (initState: Partial<AuthState> = {}) =>
  createStore<AuthStore>()((set) => ({
    ...defaultAuthState,
    ...initState,
    login: (user, token) =>
      set({ user, token, isAuthenticated: true }),
    logout: () =>
      set({ user: null, token: null, isAuthenticated: false, permissions: [] }),
    setPermissions: (permissions) => set({ permissions }),
    updateUser: (updates) =>
      set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
  }))
