'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Bell, ListOrdered } from 'lucide-react'
import { Task, Activity, TaskDependency } from '@/lib/types'
import { DocPathInput } from './DocPath'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  task?: Task | null
  activityId: string
  activities: Activity[]
  projectId?: string
}

export default function TaskModal({ isOpen, onClose, onSave, task, activityId, activities, projectId }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [selectedActivityId, setSelectedActivityId] = useState(activityId)
  const [reminder, setReminder] = useState(false)
  const [reminderDays, setReminderDays] = useState(1)
  const [sequenceOrder, setSequenceOrder] = useState<number | null>(null)
  const [docPath, setDocPath] = useState('')
  const [loading, setLoading] = useState(false)

  // Dependencies state
  const [dependencies, setDependencies] = useState<TaskDependency[]>([])
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [selectedPrereqId, setSelectedPrereqId] = useState('')
  const [depsLoading, setDepsLoading] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '')
      setPriority(task.priority as 'low' | 'medium' | 'high')
      setSelectedActivityId(task.activityId)
      setReminder(task.reminder ?? false)
      setReminderDays(task.reminderDays ?? 1)
      setDependencies(task.dependsOn || [])
      setDocPath(task.docPath || '')
      setSequenceOrder(task.sequenceOrder ?? null)
    } else {
      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority('medium')
      setSelectedActivityId(activityId)
      setReminder(false)
      setReminderDays(1)
      setDependencies([])
      setDocPath('')
      setSequenceOrder(null)
    }
    setSelectedPrereqId('')
  }, [task, isOpen, activityId])

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectTasks()
    }
  }, [isOpen, projectId])

  const fetchProjectTasks = async () => {
    if (!projectId) return
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data: Task[] = await res.json()
        // Filter tasks in the same project, exclude current task
        const filtered = data.filter(t =>
          t.activity?.category?.project?.id === projectId &&
          t.id !== task?.id
        )
        setAvailableTasks(filtered)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const handleAddDependency = async () => {
    if (!selectedPrereqId || !task) return
    setDepsLoading(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prerequisiteId: selectedPrereqId })
      })
      if (res.ok) {
        const dep = await res.json()
        setDependencies(prev => [...prev, dep])
        setSelectedPrereqId('')
      }
    } catch (error) {
      console.error('Error adding dependency:', error)
    } finally {
      setDepsLoading(false)
    }
  }

  const handleRemoveDependency = async (prereqId: string) => {
    if (!task) return
    try {
      await fetch(`/api/tasks/${task.id}/dependencies/${prereqId}`, {
        method: 'DELETE'
      })
      setDependencies(prev => prev.filter(d => d.prerequisiteId !== prereqId))
    } catch (error) {
      console.error('Error removing dependency:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const url = task ? `/api/tasks/${task.id}` : '/api/tasks'
      const method = task ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          dueDate: dueDate || null,
          priority,
          activityId: selectedActivityId,
          reminder,
          reminderDays,
          docPath: docPath || null,
          sequenceOrder
        })
      })

      if (res.ok) {
        onSave()
        onClose()
      }
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Tasks not already in dependencies and not current task
  const prereqsAlreadyAdded = new Set(dependencies.map(d => d.prerequisiteId))
  const availableForAdd = availableTasks.filter(t => !prereqsAlreadyAdded.has(t.id))

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 bg-black/60 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {task ? 'Modifica Task' : 'Nuovo Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Attività
            </label>
            <select
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              {activities.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.category?.project?.name} / {act.category?.name} / {act.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Titolo task
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Es. Creare form di contatto"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descrizione
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y min-h-[80px]"
              placeholder="Dettagli del task..."
            />
          </div>

          <DocPathInput value={docPath} onChange={setDocPath} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Data scadenza
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Priorità
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="low">Bassa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          {/* Reminder section */}
          <div className="border border-slate-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={16} className={reminder ? 'text-amber-400' : 'text-slate-400'} />
                <span className="text-sm font-medium text-slate-300">Promemoria</span>
              </div>
              <button
                type="button"
                onClick={() => setReminder(!reminder)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  reminder ? 'bg-amber-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    reminder ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {reminder && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">Ricordami</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={reminderDays}
                  onChange={(e) => setReminderDays(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <span className="text-sm text-slate-400">giorni prima della scadenza</span>
              </div>
            )}
          </div>

          {/* Sequential order section */}
          <div className="border border-slate-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered size={16} className={sequenceOrder !== null ? 'text-indigo-400' : 'text-slate-400'} />
                <span className="text-sm font-medium text-slate-300">Ordine sequenziale</span>
              </div>
              <button
                type="button"
                onClick={() => setSequenceOrder(prev => prev !== null ? null : 1)}
                className={`relative w-11 h-6 rounded-full transition-colors ${sequenceOrder !== null ? 'bg-indigo-500' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${sequenceOrder !== null ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            {sequenceOrder !== null && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">Step</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={sequenceOrder}
                  onChange={(e) => setSequenceOrder(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <span className="text-sm text-slate-400">nell'ordine di questa attività</span>
              </div>
            )}
          </div>

          {/* Dependencies section - only when editing an existing task with projectId */}
          {task && projectId && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Propedeuticità
              </label>
              {/* Current dependencies as chips */}
              {dependencies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {dependencies.map((dep) => (
                    <span
                      key={dep.prerequisiteId}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        dep.prerequisite?.completed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {dep.prerequisite?.title || dep.prerequisiteId}
                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(dep.prerequisiteId)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {availableForAdd.length > 0 ? (
                <div className="flex gap-2">
                  <select
                    value={selectedPrereqId}
                    onChange={(e) => setSelectedPrereqId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="">Seleziona task prerequisito...</option>
                    {availableForAdd.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddDependency}
                    disabled={!selectedPrereqId || depsLoading}
                    className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                  >
                    <Plus size={14} />
                    Aggiungi
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-2">
                  {dependencies.length > 0 ? 'Tutti i task del progetto sono già prerequisiti.' : 'Nessun altro task disponibile nel progetto.'}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Salvataggio...' : task ? 'Salva' : 'Crea'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}
