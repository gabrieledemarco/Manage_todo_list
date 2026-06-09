'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Activity, Category } from '@/lib/types'

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  activity?: Activity | null
  categoryId: string
  categories: Category[]
}

export default function ActivityModal({ isOpen, onClose, onSave, activity, categoryId, categories }: ActivityModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo')
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activity) {
      setName(activity.name)
      setDescription(activity.description || '')
      setStatus(activity.status as 'todo' | 'in_progress' | 'done')
      setSelectedCategoryId(activity.categoryId)
    } else {
      setName('')
      setDescription('')
      setStatus('todo')
      setSelectedCategoryId(categoryId)
    }
  }, [activity, isOpen, categoryId])

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
        body: JSON.stringify({ name, description, status, categoryId: selectedCategoryId })
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
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
          {!activity && (
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
          )}

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
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              placeholder="Breve descrizione..."
            />
          </div>

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
  )
}