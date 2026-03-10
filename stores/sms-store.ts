import { createStore } from 'zustand/vanilla'
import { immer } from 'zustand/middleware/immer'

export type SmsDraft = {
  phone: string
  message: string
  senderName: string
  scheduled: boolean
  scheduleDate?: string
}

export type SmsQueueItem = {
  id: string
  phone: string
  message: string
  senderName: string
  status: 'queued' | 'sending' | 'sent' | 'failed'
  createdAt: string
}

export type SmsState = {
  draft: SmsDraft
  sendingQueue: SmsQueueItem[]
  deliveryStatus: Record<string, 'sent' | 'delivered' | 'failed'>
}

export type SmsActions = {
  updateDraft: (updates: Partial<SmsDraft>) => void
  resetDraft: () => void
  addToQueue: (item: SmsQueueItem) => void
  updateQueueItemStatus: (id: string, status: SmsQueueItem['status']) => void
  removeFromQueue: (id: string) => void
  setDeliveryStatus: (id: string, status: 'sent' | 'delivered' | 'failed') => void
  clearQueue: () => void
}

export type SmsStore = SmsState & SmsActions

const defaultDraft: SmsDraft = {
  phone: '',
  message: '',
  senderName: '',
  scheduled: false,
}

export const defaultSmsState: SmsState = {
  draft: { ...defaultDraft },
  sendingQueue: [],
  deliveryStatus: {},
}

export const createSmsStore = (initState: Partial<SmsState> = {}) =>
  createStore<SmsStore>()(
    immer((set) => ({
      ...defaultSmsState,
      ...initState,
      updateDraft: (updates) =>
        set((s) => {
          Object.assign(s.draft, updates)
        }),
      resetDraft: () =>
        set((s) => {
          s.draft = { ...defaultDraft }
        }),
      addToQueue: (item) =>
        set((s) => {
          s.sendingQueue.push(item)
        }),
      updateQueueItemStatus: (id, status) =>
        set((s) => {
          const item = s.sendingQueue.find((i) => i.id === id)
          if (item) item.status = status
        }),
      removeFromQueue: (id) =>
        set((s) => {
          s.sendingQueue = s.sendingQueue.filter((i) => i.id !== id)
        }),
      setDeliveryStatus: (id, status) =>
        set((s) => {
          s.deliveryStatus[id] = status
        }),
      clearQueue: () =>
        set((s) => {
          s.sendingQueue = []
        }),
    }))
  )
