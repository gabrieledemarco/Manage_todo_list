'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Project } from '@/lib/types'
import { DocPathInput } from './DocPath'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  project?: Project | null
  allProjects?: Project[]
}

const colors = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1'
]

export default function ProjectModal({ isOpen, onClose, onSave, project, allProjects = [] }: ProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [parentId, setParentId] = useState<string>('')
  const [docPath, setDocPath] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description || '')
      setColor(project.color)
      setParentId(project.parentId || '')
      setDocPath(project.docPath || '')
    } else {
      setName('')
      setDescription('')
      setColor('#6366f1')
      setParentId('')
      setDocPath('')
    }
  }, [project, isOpen])

  // Collect all descendant IDs of the project being edited to prevent cycles
  function getDescendantIds(p: Project, all: Project[]): Set<string> {
    const ids = new Set<string>()
    const queue = [p.id]
    while (queue.length) {
      const cur = queue.shift()!
      all.forEach(x => {
        if (x.parentId === cur && !ids.has(x.id)) {
          ids.add(x.id)
          queue.push(x.id)
        }
      })
    }
    return ids
  }

  const forbiddenIds = project ? getDescendantIds(project, allProjects) : new Set<string>()
  const parentOptions = allProjects.filter(p => p.id !== project?.id && !forbiddenIds.has(p.id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const url = project ? `/api/projects/${project.id}` : '/api/projects'
      const method = project ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color, parentId: parentId || null, docPath: docPath || null })
      })

      if (res.ok) {
        onSave()
        onClose()
      }
    } catch (error) {
      console.error('Error saving project:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)'
  }

  return (
    <div className="fixed inset-0 overflow-y-auto z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}>
      <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
      <div className="rounded-2xl shadow-2xl w-full max-w-md animate-slide-in"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {project ? 'Modifica Progetto' : 'Nuovo Progetto'}
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
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Nome progetto
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none"
              style={inputStyle}
              onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
              onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              placeholder="Es. Sito Web Aziendale"
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
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none resize-y min-h-[80px]"
              style={inputStyle}
              onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
              onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              placeholder="Breve descrizione del progetto..."
            />
          </div>

          {/* Parent project selector */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Progetto padre <span style={{ color: 'var(--text-tertiary)' }}>(opzionale)</span>
            </label>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none"
              style={{ ...inputStyle, appearance: 'none' }}
              onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
              onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
            >
              <option value="">— Nessun progetto padre —</option>
              {parentOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <DocPathInput value={docPath} onChange={setDocPath} />

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Colore
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)'
                  }}
                />
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
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {loading ? 'Salvataggio...' : project ? 'Salva' : 'Crea'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}
