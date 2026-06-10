'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Folder, ListTodo, CheckCircle2, Clock, AlertTriangle,
  Pencil, Trash2, ChevronDown, ChevronRight, Check
} from 'lucide-react'
import { Project, Category, Activity, Task } from '@/lib/types'
import CategoryModal from '@/components/CategoryModal'
import ActivityModal from '@/components/ActivityModal'
import TaskModal from '@/components/TaskModal'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [allActivities, setAllActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchProject(); fetchAllCategories(); fetchAllActivities()
  }, [id])

  const fetchProject = async () => {
    try {
      const r = await fetch(`/api/projects/${id}`)
      if (r.ok) { const d = await r.json(); setProject(d); setCategories(d.categories || []) }
      else if (r.status === 404) router.push('/projects')
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }
  const fetchAllCategories = async () => {
    try { const r = await fetch('/api/categories'); if (r.ok) setAllCategories(await r.json()) } catch {}
  }
  const fetchAllActivities = async () => {
    try { const r = await fetch('/api/activities'); if (r.ok) setAllActivities(await r.json()) } catch {}
  }
  const toggleCategory = (catId: string) => setExpandedCategories(prev => { const n = new Set(prev); n.has(catId) ? n.delete(catId) : n.add(catId); return n })
  const toggleActivity = (actId: string) => setExpandedActivities(prev => { const n = new Set(prev); n.has(actId) ? n.delete(actId) : n.add(actId); return n })

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Eliminare questa categoria?')) return
    await fetch(`/api/categories/${catId}`, { method: 'DELETE' })
    fetchProject(); fetchAllCategories()
  }
  const handleDeleteActivity = async (actId: string) => {
    if (!confirm('Eliminare questa attività?')) return
    await fetch(`/api/activities/${actId}`, { method: 'DELETE' })
    fetchProject(); fetchAllActivities()
  }
  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    fetchProject()
  }
  const handleToggleTask = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, completed: !task.completed })
    })
    fetchProject()
  }

  const getPriorityStyle = (p: string) => {
    if (p === 'high') return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' }
    if (p === 'medium') return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
    return { bg: 'rgba(16,185,129,0.1)', color: '#10b981' }
  }
  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  const isOverdue = (task: Task) => !task.completed && task.dueDate && new Date(task.dueDate) < new Date()

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    todo: { label: 'Da fare', bg: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)' },
    in_progress: { label: 'In corso', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    done: { label: 'Completato', bg: 'rgba(16,185,129,0.1)', color: '#10b981' }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-3"><div className="skeleton w-8 h-8 rounded-lg" /><div className="skeleton h-7 w-48" /></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="skeleton h-6 w-32 mb-4" />
            <div className="space-y-3">{[...Array(2)].map((_, j) => <div key={j} className="skeleton h-10 rounded-xl" />)}</div>
          </div>
        ))}
      </div>
    )
  }
  if (!project) return null

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/projects"
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: project.color + '20' }}>
            <Folder size={18} style={{ color: project.color }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</h1>
            {project.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>}
          </div>
        </div>
        <button onClick={() => { setEditingCategory(null); setShowCategoryModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.25)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.15)'}
        >
          <Plus size={16} /> Categoria
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="rounded-2xl p-14 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <ListTodo size={28} style={{ color: '#10b981' }} />
            </div>
            <h2 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Nessuna categoria</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Aggiungi una categoria per organizzare le tue attività</p>
            <button onClick={() => setShowCategoryModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <Plus size={16} /> Aggiungi Categoria
            </button>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${category.color}` }}>
              {/* Category Header */}
              <div className="flex items-center gap-3 p-4 cursor-pointer transition-colors"
                style={{ borderBottom: expandedCategories.has(category.id) ? '1px solid var(--border)' : 'none' }}
                onClick={() => toggleCategory(category.id)}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {expandedCategories.has(category.id)
                  ? <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />
                  : <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: category.color + '18' }}>
                  <Folder size={14} style={{ color: category.color }} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{category.name}</span>
                  {category.description && <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>· {category.description}</span>}
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)' }}>
                    {category.activities?.length || 0} attività
                  </span>
                  <button onClick={() => { setEditingCategory(category); setShowCategoryModal(true) }}
                    className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
                  ><Pencil size={13} /></button>
                  <button onClick={() => handleDeleteCategory(category.id)}
                    className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
                  ><Trash2 size={13} /></button>
                  <button onClick={() => { setSelectedCategoryId(category.id); setEditingActivity(null); setShowActivityModal(true) }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.12)'}
                  ><Plus size={12} /> Attività</button>
                </div>
              </div>

              {/* Activities */}
              {expandedCategories.has(category.id) && (
                <div className="p-3 space-y-2">
                  {(!category.activities || category.activities.length === 0) ? (
                    <p className="text-center text-xs py-4" style={{ color: 'var(--text-tertiary)' }}>Nessuna attività in questa categoria</p>
                  ) : (
                    category.activities.map((activity) => {
                      const sc = statusConfig[activity.status] || statusConfig.todo
                      return (
                        <div key={activity.id} className="rounded-xl overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                          {/* Activity Row */}
                          <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                            onClick={() => toggleActivity(activity.id)}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                          >
                            {expandedActivities.has(activity.id)
                              ? <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
                              : <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />}
                            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: sc.bg }}>
                              {activity.status === 'done' ? <CheckCircle2 size={12} style={{ color: sc.color }} />
                               : activity.status === 'in_progress' ? <Clock size={12} style={{ color: sc.color }} />
                               : <ListTodo size={12} style={{ color: sc.color }} />}
                            </div>
                            <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{activity.name}</span>
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{activity.tasks?.length || 0} task</span>
                              <button onClick={() => { setEditingActivity(activity); setSelectedCategoryId(category.id); setShowActivityModal(true) }}
                                className="p-1 rounded transition-colors" style={{ color: 'var(--text-tertiary)' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
                              ><Pencil size={12} /></button>
                              <button onClick={() => handleDeleteActivity(activity.id)}
                                className="p-1 rounded transition-colors" style={{ color: 'var(--text-tertiary)' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
                              ><Trash2 size={12} /></button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedActivityId(activity.id)
                                  setEditingTask(null)
                                  setShowTaskModal(true)
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                                style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.2)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.12)'}
                              ><Plus size={11} /> Task</button>
                            </div>
                          </div>

                          {/* Tasks */}
                          {expandedActivities.has(activity.id) && (
                            <div className="px-3 pb-3 space-y-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                              <div className="pt-2" />
                              {(!activity.tasks || activity.tasks.length === 0) ? (
                                <p className="text-center text-xs py-2" style={{ color: 'var(--text-tertiary)' }}>Nessun task in questa attività</p>
                              ) : (
                                activity.tasks.map((task) => {
                                  const ps = getPriorityStyle(task.priority)
                                  const overdue = isOverdue(task)
                                  return (
                                    <div key={task.id}
                                      className="flex items-center gap-3 px-3 py-2 rounded-lg group/task transition-all"
                                      style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                                        opacity: task.completed ? 0.55 : 1
                                      }}
                                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
                                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                                    >
                                      <button onClick={() => handleToggleTask(task)}
                                        className="rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                                        style={{
                                          width: '18px', height: '18px',
                                          background: task.completed ? '#10b981' : 'transparent',
                                          borderColor: task.completed ? '#10b981' : 'rgba(255,255,255,0.2)'
                                        }}
                                        onMouseEnter={e => { if (!task.completed) (e.currentTarget as HTMLElement).style.borderColor = '#10b981' }}
                                        onMouseLeave={e => { if (!task.completed) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
                                      >
                                        {task.completed && <Check size={11} className="text-white" />}
                                      </button>
                                      <span className={`flex-1 text-xs ${task.completed ? 'line-through' : ''}`}
                                        style={{ color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                        {task.title}
                                      </span>
                                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                        style={{ background: ps.bg, color: ps.color }}>
                                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Bassa'}
                                      </span>
                                      {task.dueDate && (
                                        <span className="text-xs" style={{ color: overdue ? '#ef4444' : 'var(--text-tertiary)' }}>
                                          {formatDate(task.dueDate)}
                                        </span>
                                      )}
                                      <button onClick={() => handleDeleteTask(task.id)}
                                        className="p-1 rounded opacity-0 group-hover/task:opacity-100 transition-all"
                                        style={{ color: 'var(--text-tertiary)' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
                                      ><Trash2 size={12} /></button>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <CategoryModal isOpen={showCategoryModal} onClose={() => { setShowCategoryModal(false); setEditingCategory(null) }}
        onSave={() => { fetchProject(); fetchAllCategories() }}
        category={editingCategory} projectId={id} projects={project ? [project] : []} />

      <ActivityModal isOpen={showActivityModal} onClose={() => { setShowActivityModal(false); setEditingActivity(null); setSelectedActivityId('') }}
        onSave={() => { fetchProject(); fetchAllActivities() }}
        activity={editingActivity} categoryId={selectedCategoryId} categories={allCategories} />

      <TaskModal isOpen={showTaskModal} onClose={() => { setShowTaskModal(false); setEditingTask(null); setSelectedActivityId('') }}
        onSave={fetchProject} task={editingTask} activityId={selectedActivityId} activities={allActivities} />
    </div>
  )
}
