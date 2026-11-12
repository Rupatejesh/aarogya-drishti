import { useEffect, useState, useCallback } from 'react'
import type { AuthUser } from '../services/api'

export interface NotificationAlertItem {
  id: string
  title: string
  message: string
  timestamp: string
  createdAt: number
  unread: boolean
  category: 'OTP' | 'APPOINTMENT' | 'DRONE' | 'BIOPSY' | 'REMINDER' | 'SCREENING' | 'GRIEVANCE' | 'SYSTEM'
}

export const formatRelativeTime = (timestampMs: number): string => {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000))
  if (diffSec < 45) return 'Just now'
  if (diffSec < 90) return '1 min ago'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} mins ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours === 1) return '1 hour ago'
  if (diffHours < 24) return `${diffHours} hours ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

const getStorageKey = (user?: AuthUser | null): string => {
  const identifier = user?.phone || user?.id || 'global'
  return `aarogya_notifications_${identifier}`
}

export const generatePersonalizedSeedNotifications = (
  user?: AuthUser | null,
): NotificationAlertItem[] => {
  const name = user?.fullName || 'కిల్లో సోమన్న (Killo Somanna)'
  const phone = user?.phone || '94942 10842'
  const mandal = user?.mandal || 'G. Madugula'
  const uidn = user?.maaUidn || 'UIDN-ASR-GMAD-2026-1048'
  const now = Date.now()

  return [
    {
      id: `notif-seed-1-${now}`,
      title: '📲 SMS OTP Dispatched & Verified',
      message: `Mobile OTP dispatched to +91 ${phone} (${name}, ${mandal}). Session authenticated successfully under ${uidn}.`,
      createdAt: now - 2 * 60 * 1000,
      timestamp: '2 mins ago',
      unread: true,
      category: 'OTP',
    },
    {
      id: `notif-seed-2-${now}`,
      title: '🩺 Telemedicine Consultation Confirmed',
      message: `Appointment confirmed with Dr. V. Anitha Rao, MDS (Oral Oncology) for patient ${name} at 10:30 AM.`,
      createdAt: now - 14 * 60 * 1000,
      timestamp: '14 mins ago',
      unread: true,
      category: 'APPOINTMENT',
    },
    {
      id: `notif-seed-3-${now}`,
      title: '📦 Prescribed Medications Dispatched',
      message: `Prescribed oral medications safely dispatched from District Central Pharmacy to PHC ${mandal} Depot for immediate patient collection.`,
      createdAt: now - 28 * 60 * 1000,
      timestamp: '28 mins ago',
      unread: true,
      category: 'SYSTEM',
    },
    {
      id: `notif-seed-4-${now}`,
      title: '🔬 Urgent Biopsy Pipeline Initiated',
      message: `Specimen #BX-20261110-01 received at DH Paderu Histopathology Lab for ${name}. Dual-reporting with KGH active.`,
      createdAt: now - 60 * 60 * 1000,
      timestamp: '1 hour ago',
      unread: false,
      category: 'BIOPSY',
    },
    {
      id: `notif-seed-5-${now}`,
      title: '📅 14-Day OPMD Follow-Up Scheduled',
      message: `Automated clinical protocol alert: Follow-up surveillance visit scheduled for ${name} in ${mandal}.`,
      createdAt: now - 2 * 60 * 60 * 1000,
      timestamp: '2 hours ago',
      unread: false,
      category: 'REMINDER',
    },
  ]
}

export const getStoredNotifications = (user?: AuthUser | null): NotificationAlertItem[] => {
  try {
    const key = getStorageKey(user)
    const raw = localStorage.getItem(key)
    if (!raw) {
      const initial = generatePersonalizedSeedNotifications(user)
      localStorage.setItem(key, JSON.stringify(initial))
      return initial
    }
    const parsed: NotificationAlertItem[] = JSON.parse(raw)
    // Update relative timestamps
    return parsed.map((item) => ({
      ...item,
      timestamp: formatRelativeTime(item.createdAt || Date.now() - 60000),
    }))
  } catch {
    return generatePersonalizedSeedNotifications(user)
  }
}

export const pushRealtimeNotification = (
  notification: {
    title: string
    message: string
    category?: NotificationAlertItem['category']
    unread?: boolean
  },
  user?: AuthUser | null,
): NotificationAlertItem => {
  const key = getStorageKey(user)
  const current = getStoredNotifications(user)
  const now = Date.now()

  const newItem: NotificationAlertItem = {
    id: `notif-${now}-${Math.random().toString(36).slice(2, 7)}`,
    title: notification.title,
    message: notification.message,
    category: notification.category || 'SYSTEM',
    createdAt: now,
    timestamp: 'Just now',
    unread: notification.unread ?? true,
  }

  const updated = [newItem, ...current].slice(0, 50)
  try {
    localStorage.setItem(key, JSON.stringify(updated))
  } catch {
    // Ignore storage quota
  }

  // Dispatch custom event to notify all components in real-time
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('aarogya:notification', {
        detail: { notification: newItem, userKey: key },
      }),
    )
  }

  return newItem
}

export const markAllNotificationsRead = (user?: AuthUser | null): void => {
  const key = getStorageKey(user)
  const current = getStoredNotifications(user)
  const updated = current.map((n) => ({ ...n, unread: false }))
  try {
    localStorage.setItem(key, JSON.stringify(updated))
  } catch {
    // Ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('aarogya:notification-update', {
        detail: { action: 'read-all', userKey: key },
      }),
    )
  }
}

export const clearAllNotifications = (user?: AuthUser | null): void => {
  const key = getStorageKey(user)
  try {
    localStorage.setItem(key, JSON.stringify([]))
  } catch {
    // Ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('aarogya:notification-update', {
        detail: { action: 'clear', userKey: key },
      }),
    )
  }
}

export function useRealtimeNotifications(user?: AuthUser | null) {
  const [notifications, setNotifications] = useState<NotificationAlertItem[]>(() =>
    getStoredNotifications(user),
  )

  const reload = useCallback(() => {
    setNotifications(getStoredNotifications(user))
  }, [user])

  useEffect(() => {
    reload()
  }, [reload, user?.id, user?.phone, user?.mandal])

  // Periodic refresh for relative time ("Just now" -> "1 min ago", etc.)
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          timestamp: formatRelativeTime(item.createdAt || Date.now() - 60000),
        })),
      )
    }, 15000)
    return () => clearInterval(timer)
  }, [])

  // Listen to realtime events across components and tabs
  useEffect(() => {
    const handleNotificationEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{
        notification?: NotificationAlertItem
        action?: string
        userKey?: string
      }>
      const currentKey = getStorageKey(user)
      if (customEvent.detail?.userKey && customEvent.detail.userKey !== currentKey) {
        // Event for another user session
        return
      }
      reload()
    }

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === getStorageKey(user)) {
        reload()
      }
    }

    window.addEventListener('aarogya:notification', handleNotificationEvent)
    window.addEventListener('aarogya:notification-update', handleNotificationEvent)
    window.addEventListener('storage', handleStorageEvent)

    return () => {
      window.removeEventListener('aarogya:notification', handleNotificationEvent)
      window.removeEventListener('aarogya:notification-update', handleNotificationEvent)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [reload, user])

  const markAllRead = useCallback(() => {
    markAllNotificationsRead(user)
    reload()
  }, [user, reload])

  const clear = useCallback(() => {
    clearAllNotifications(user)
    reload()
  }, [user, reload])

  const unreadCount = notifications.filter((n) => n.unread).length

  return {
    notifications,
    unreadCount,
    markAllRead,
    clear,
    reload,
  }
}

