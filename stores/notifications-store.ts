import { createStore } from 'zustand/vanilla'
import { immer } from 'zustand/middleware/immer'

export type Notification = {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
}

export type NotificationsState = {
  notifications: Notification[]
  unreadCount: number
}

export type NotificationsActions = {
  addNotification: (notification: Notification) => void
  markRead: (id: string) => void
  markAllRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export type NotificationsStore = NotificationsState & NotificationsActions

export const defaultNotificationsState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
}

export const createNotificationsStore = (initState: Partial<NotificationsState> = {}) =>
  createStore<NotificationsStore>()(
    immer((set) => ({
      ...defaultNotificationsState,
      ...initState,
      addNotification: (notification) =>
        set((s) => {
          s.notifications.unshift(notification)
          if (!notification.read) s.unreadCount++
        }),
      markRead: (id) =>
        set((s) => {
          const n = s.notifications.find((n) => n.id === id)
          if (n && !n.read) {
            n.read = true
            s.unreadCount = Math.max(0, s.unreadCount - 1)
          }
        }),
      markAllRead: () =>
        set((s) => {
          s.notifications.forEach((n) => (n.read = true))
          s.unreadCount = 0
        }),
      removeNotification: (id) =>
        set((s) => {
          const idx = s.notifications.findIndex((n) => n.id === id)
          if (idx !== -1) {
            if (!s.notifications[idx].read) s.unreadCount = Math.max(0, s.unreadCount - 1)
            s.notifications.splice(idx, 1)
          }
        }),
      clearAll: () =>
        set((s) => {
          s.notifications = []
          s.unreadCount = 0
        }),
    }))
  )
