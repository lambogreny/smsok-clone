import { createStore } from 'zustand/vanilla'
import { immer } from 'zustand/middleware/immer'

export type ContactsFilter = {
  search: string
  group: string | null
  tag: string | null
}

export type ContactsState = {
  selectedIds: Set<string>
  filters: ContactsFilter
  bulkAction: 'none' | 'delete' | 'addToGroup' | 'addTag' | 'export'
}

export type ContactsActions = {
  selectContact: (id: string) => void
  deselectContact: (id: string) => void
  toggleContact: (id: string) => void
  selectAll: (ids: string[]) => void
  deselectAll: () => void
  setFilter: (updates: Partial<ContactsFilter>) => void
  resetFilters: () => void
  setBulkAction: (action: ContactsState['bulkAction']) => void
}

export type ContactsStore = ContactsState & ContactsActions

const defaultFilters: ContactsFilter = {
  search: '',
  group: null,
  tag: null,
}

export const defaultContactsState: ContactsState = {
  selectedIds: new Set(),
  filters: { ...defaultFilters },
  bulkAction: 'none',
}

export const createContactsStore = (initState: Partial<ContactsState> = {}) =>
  createStore<ContactsStore>()(
    immer((set) => ({
      ...defaultContactsState,
      ...initState,
      selectContact: (id) =>
        set((s) => {
          s.selectedIds.add(id)
        }),
      deselectContact: (id) =>
        set((s) => {
          s.selectedIds.delete(id)
        }),
      toggleContact: (id) =>
        set((s) => {
          if (s.selectedIds.has(id)) {
            s.selectedIds.delete(id)
          } else {
            s.selectedIds.add(id)
          }
        }),
      selectAll: (ids) =>
        set((s) => {
          s.selectedIds = new Set(ids)
        }),
      deselectAll: () =>
        set((s) => {
          s.selectedIds = new Set()
        }),
      setFilter: (updates) =>
        set((s) => {
          Object.assign(s.filters, updates)
        }),
      resetFilters: () =>
        set((s) => {
          s.filters = { ...defaultFilters }
        }),
      setBulkAction: (action) =>
        set((s) => {
          s.bulkAction = action
        }),
    }))
  )
