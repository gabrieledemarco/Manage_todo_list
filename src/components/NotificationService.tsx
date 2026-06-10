'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, AlertTriangle, Clock } from 'lucide-react'
import { Task } from '@/lib/types'

interface NotificationTask {
  task: Task
  type: 'upcoming' | 'overdue'
}

function formatDateIT(dateString: string) {
  return new Date(dateString).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

function wasNotifiedToday(taskId: string, type: string) {
  try {
    const key = `taskflow_notified_${taskId}_${type}_${getTodayKey()}`
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function markNotifiedToday(taskId: string, type: string) {
  try {
    const key = `taskflow_notified_${taskId}_${type}_${getTodayKey()}`
    localStorage.setItem(key, '1')
  } catch {
    // ignore
  }
}

function sendDesktopNotification(title: string, body: string) {
  if (typeof window === 'undefined') return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/favicon.ico' })
  } catch {
    // ignore
  }
}

export default function NotificationService() {
  const [alertTasks, setAlertTasks] = useState<NotificationTask[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const checkReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks?reminder=true')
      if (!res.ok) return
      const tasks: Task[] = await res.json()
      const now = new Date()
      const today = now.getTime()
      const newAlerts: NotificationTask[] = []

      for (const task of tasks) {
        if (task.completed || !task.dueDate) continue

        const due = new Date(task.dueDate)
        const diffMs = due.getTime() - today
        const diffDays = diffMs / (1000 * 60 * 60 * 24)

        const projectName = task.activity?.category?.project?.name || 'Progetto'

        if (diffMs < 0) {
          // Overdue
          newAlerts.push({ task, type: 'overdue' })
          if (!wasNotifiedToday(task.id, 'overdue')) {
            markNotifiedToday(task.id, 'overdue')
            sendDesktopNotification(
              'Task scaduto',
              `${task.title} e scaduto il ${formatDateIT(task.dueDate)}\nProgetto: ${projectName}`
            )
          }
        } else if (diffDays <= (task.reminderDays ?? 1)) {
          // Upcoming
          newAlerts.push({ task, type: 'upcoming' })
          if (!wasNotifiedToday(task.id, 'upcoming')) {
            markNotifiedToday(task.id, 'upcoming')
            sendDesktopNotification(
              'Scadenza in avvicinamento',
              `${task.title} - scade il ${formatDateIT(task.dueDate)}\nProgetto: ${projectName}`
            )
          }
        }
      }

      setAlertTasks(newAlerts)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }

    // Check immediately
    checkReminders()

    // Then check every 60 seconds
    intervalRef.current = setInterval(checkReminders, 60_000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [checkReminders])

  const badgeCount = alertTasks.length

  return (
    <div className="relative">
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        title="Notifiche promemoria"
      >
        <Bell size={20} />
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {panelOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-sm font-semibold text-white">Promemoria</span>
            <button
              onClick={() => setPanelOpen(false)}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {alertTasks.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-500 text-sm">
                Nessuna scadenza imminente
              </div>
            ) : (
              alertTasks.map(({ task, type }) => {
                const projectName = task.activity?.category?.project?.name || ''
                return (
                  <div
                    key={`${task.id}-${type}`}
                    className={`px-4 py-3 border-b border-slate-700 last:border-0 flex items-start gap-3 ${
                      type === 'overdue' ? 'bg-red-500/5' : 'bg-amber-500/5'
                    }`}
                  >
                    {type === 'overdue' ? (
                      <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Clock size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {type === 'overdue' ? 'Scaduto il' : 'Scade il'} {formatDateIT(task.dueDate!)}
                      </p>
                      {projectName && (
                        <p className="text-xs text-slate-500">{projectName}</p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        type === 'overdue'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {type === 'overdue' ? 'Scaduto' : 'In scadenza'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
