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

  const statusOptions = [
    { value: 'todo', label: 'Da fare', activeBg: 'rgba(255,255,255,0.12)', activeColor: 'var(--text-primary)' },
    { value: 'in_progress', label: 'In corso', activeBg: 'rgba(245,158,11,0.15)', activeColor: '#f59e0b' },
    { value: 'done', label: 'Completato', activeBg: 'rgba(16,185,129,0.15)', activeColor: '#10b981' }
  ]

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-md animate-slide-in"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {activity ? 'Modifica Attività' : 'Nuova Attività'}
          </h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {!activity && (
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Categoria
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} style={{ background: '#0d0e24' }}>
                    {cat.project?.name} / {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Nome attività
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
              onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              placeholder="Es. Implementazione API, UI Design"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Descrizione
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
              onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              placeholder="Breve descrizione..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Stato
            </label>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value as typeof status)}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: status === s.value ? s.activeBg : 'rgba(255,255,255,0.04)',
                    color: status === s.value ? s.activeColor : 'var(--text-tertiary)',
                    border: `1px solid ${status === s.value ? 'currentColor' : 'var(--border)'}`,
                    opacity: status === s.value ? 1 : 0.7
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}
            >
              {loading ? 'Salvataggio...' : activity ? 'Salva' : 'Crea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
