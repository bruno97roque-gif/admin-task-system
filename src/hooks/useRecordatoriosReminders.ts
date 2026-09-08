import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import type { Recordatorio } from '../types'
import { useRecordatoriosStore } from '../stores/recordatoriosStore'
import {
  playAlertSound,
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from '../utils/alerts'

const REMINDER_INTERVAL_MS = 5 * 60 * 1000

function showBrowserNotifications(items: Recordatorio[]) {
  items.forEach((item) => {
    showBrowserNotification('Recordatorio pendiente', item.descripcion, `recordatorio-${item.id}`)
  })
}

export function useRecordatoriosReminders(enabled = true) {
  const recordatorios = useRecordatoriosStore((s) => s.recordatorios)
  const fetchRecordatorios = useRecordatoriosStore((s) => s.fetchRecordatorios)
  const pendingCount = recordatorios.filter((r) => r.estado).length
  const hasPending = pendingCount > 0

  const [alertVisible, setAlertVisible] = useState(false)
  const navigate = useNavigate()

  const triggerReminder = useCallback(() => {
    if (!enabled) return
    const pending = useRecordatoriosStore
      .getState()
      .recordatorios.filter((r) => r.estado)
    if (pending.length === 0) return

    setAlertVisible(true)
    playAlertSound()
    showBrowserNotifications(pending)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    fetchRecordatorios()
  }, [fetchRecordatorios, enabled])

  useEffect(() => {
    if (!enabled) return
    requestBrowserNotificationPermission()
  }, [enabled])

  useEffect(() => {
    if (!enabled || !hasPending) return

    const interval = setInterval(triggerReminder, REMINDER_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [enabled, hasPending, triggerReminder])

  const dismissAlert = useCallback(() => setAlertVisible(false), [])

  const goToRecordatorios = useCallback(() => {
    setAlertVisible(false)
    navigate('/recordatorios')
  }, [navigate])

  return {
    showAlert: alertVisible && hasPending,
    dismissAlert,
    goToRecordatorios,
  }
}
