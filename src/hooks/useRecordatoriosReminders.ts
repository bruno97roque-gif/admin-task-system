import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import type { Recordatorio } from '../types'
import { useRecordatoriosStore } from '../stores/recordatoriosStore'

const REMINDER_INTERVAL_MS = 5 * 60 * 1000

function playAlertSound() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.frequency.value = 880
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
  } catch {
    // Audio no disponible
  }
}

function showBrowserNotifications(items: Recordatorio[]) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  items.forEach((item) => {
    new Notification('Recordatorio pendiente', {
      body: item.descripcion,
      icon: '/favicon.png',
      tag: `recordatorio-${item.id}`,
    })
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
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
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
