'use client'

import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { Activity, Category, ActivityDependency } from '@/lib/types'
import { DocPathInput } from './DocPath'

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  activity?: Activity | null
  categoryId: string
  categories: Category[]
  projectId?: string
}

export default function ActivityModal({ isOpen, onClose, onSave, activity, categoryId, categories, projectId }: ActivityModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo')
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId)
  const [docPath, setDocPath] = useState('')
  const [loading, setLoading] = useState(false)

  // Dependencies state
  const [dependencies, setDependencies] = useState<ActivityDependency[]>([])
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([])
  const [selectedPrereqId, setSelectedPrereqId] = useState('')
  const [depsLoading, setDepsLoading] = useState(false)

  useEffect(() => {
    if (activity) {
      setName(activity.name)
      setDescription(activity.description || '')
      setStatus(activity.status as 'todo' | 'in_progress' | 'done')
      setSelectedCategoryId(activity.categoryId)
      setDependencies(activity.dependsOn || [])
      setDocPath(activity.docPath || '')
    } else {
      setName('')
      setDescription('')
      setStatus('todo')
      setSelectedCategoryId(categoryId)
      setDependencies([])
      setDocPath('')
    }
    setSelectedPrereqId('')
  }, [activity, isOpen, categoryId])

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectActivities()
    }
  }, [isOpen, projectId])

  const fetchProjectActivities = async () => {
    if (!projectId) return
    try {
      const res = await fetch('/api/activities')
      if (res.ok) {
        const data: Activity[] = await res.json()
        // Filter to activities in the same project, exclude current activity
        const filtered = data.filter(a =>
          a.category?.project?.id === projectId &&
          a.id !== activity?.id
        )
        setAvailableActivities(filtered)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const handleAddDependency = async () => {
    if (!selectedPrereqId || !activity) return
    setDepsLoading(true)
    try {
      const res = await fetch(`/api/activities/${activity.id}/dependencies`, {
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
    if (!activity) return
    try {
      await fetch(`/api/activities/${activity.id}/dependencies/${prereqId}`, {
        method: 'DELETE'
      })
      setDependencies(prev => prev.filter(d => d.prerequisiteId !== prereqId))
    } catch (error) {
      console.error('Error removing dependency:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const url = activity ? `/api/activities/${activity.id}` : '/api/activities'
      const method = activity ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, status, categoryId: selectedCategoryId, docPath: docPath || null })
      })

      if (res.ok) {
        onSave()
        onClose()
      }
    } catch (error) {
      console.error('Error saving activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (!isOpen) return null

  // Activities not already in dependencies and not current activity
  const prereqsAlreadyAdded = new Set(dependencies.map(d => d.prerequisiteId))
  const availableForAdd = availableActivities.filter(a => !prereqsAlreadyAdded.has(a.id))

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 bg-black/60 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {activity ? 'Modifica Attività' : 'Nuova Attività'}
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
              Categoria
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.project?.name} / {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome attività
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Es. Implementazione API, UI Design"
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
              placeholder="Breve descrizione..."
            />
          </div>

          <DocPathInput value={docPath} onChange={setDocPath} />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Stato
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'todo', label: 'Da fare', color: 'slate' },
                { value: 'in_progress', label: 'In corso', color: 'amber' },
                { value: 'done', label: 'Completato', color: 'emerald' }
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value as typeof status)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    status === s.value
                      ? s.color === 'slate'
                        ? 'bg-slate-600 text-white'
                        : s.color === 'amber'
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Show startedAt if activity exists and has it set */}
          {activity?.startedAt && (
            <div className="px-4 py-3 bg-slate-900/50 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400">
                Iniziata il: <span className="text-amber-400 font-medium">{formatDate(activity.startedAt)}</span>
              </span>
            </div>
          )}

          {/* Dependencies section - only when editing an existing activity with projectId */}
          {activity && projectId && (
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
                        dep.prerequisite?.status === 'done'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {dep.prerequisite?.name || dep.prerequisiteId}
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
                    <option value="">Seleziona attività prerequisito...</option>
                    {availableForAdd.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
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
                  {dependencies.length > 0 ? 'Tutte le attività del progetto sono già prerequisiti.' : 'Nessuna altra attività disponibile nel progetto.'}
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
              className="flex-1 px-4 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Salvataggio...' : activity ? 'Salva' : 'Crea'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}
