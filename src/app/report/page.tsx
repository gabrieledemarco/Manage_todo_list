'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Printer, CheckCircle2, Circle, Clock, FolderKanban, FolderOpen, BarChart2 } from 'lucide-react'

interface ActivityItem {
  id: string
  name: string
  description?: string | null
  startedAt?: string | null
  updatedAt: string
  isNewThisWeek?: boolean
  startedThisWeek?: boolean
  tasksTotal: number
  tasksCompleted: number
  tasksCompletedThisWeek: number
}

interface CategoryReport {
  id: string
  name: string
  color: string
  completedThisWeek: ActivityItem[]
  inProgress: ActivityItem[]
  todo: ActivityItem[]
  hasActivity: boolean
}

interface SubProjectReport {
  id: string
  name: string
  color: string
  categories: CategoryReport[]
}

interface ProjectReport {
  id: string
  name: string
  color: string
  parentId: string | null
  categories: CategoryReport[]
  subProjects: SubProjectReport[]
}

interface Report {
  period: { from: string; to: string }
  summary: {
    activitiesCompleted: number
    activitiesInProgress: number
    activitiesTodo: number
    tasksCompletedThisWeek: number
    tasksOpen: number
  }
  projects: ProjectReport[]
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const dow = date.getDay()
  date.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1))
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatShort(d: Date): string {
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
}

function weekLabel(from: Date, to: Date): string {
  const wn = Math.ceil((((from.getTime() - new Date(from.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7)
  return `Settimana ${wn} — ${formatShort(from)} / ${formatShort(to)} ${to.getFullYear()}`
}

function TaskProgress({ total, done, doneThisWeek }: { total: number; done: number; doneThisWeek: number }) {
  if (total === 0) return null
  const pct = Math.round((done / total) * 100)
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#6366f1' }} />
      </div>
      <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
        {done}/{total} task
        {doneThisWeek > 0 && <span style={{ color: '#10b981' }}> (+{doneThisWeek} questa sett.)</span>}
      </span>
    </div>
  )
}

function ActivityRow({ a, status }: { a: ActivityItem; status: 'done' | 'in_progress' | 'todo' }) {
  const colors = { done: '#10b981', in_progress: '#f59e0b', todo: '#64748b' }
  const icons = {
    done: <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />,
    in_progress: <Clock size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />,
    todo: <Circle size={14} style={{ color: '#64748b', flexShrink: 0 }} />
  }
  return (
    <div className="py-2.5 px-3 rounded-xl mb-2 print-activity"
      style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${colors[status]}22` }}>
      <div className="flex items-start gap-2">
        {icons[status]}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.name}</span>
            {a.isNewThisWeek && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>Nuova</span>
            )}
            {status === 'in_progress' && a.startedThisWeek && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>Avviata questa sett.</span>
            )}
          </div>
          {a.description && (
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-tertiary)' }}>{a.description}</p>
          )}
          {status === 'done' && a.startedAt && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Iniziata: {new Date(a.startedAt).toLocaleDateString('it-IT')} · Completata: {new Date(a.updatedAt).toLocaleDateString('it-IT')}
            </p>
          )}
          {status === 'in_progress' && a.startedAt && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Avviata: {new Date(a.startedAt).toLocaleDateString('it-IT')}
            </p>
          )}
          <TaskProgress total={a.tasksTotal} done={a.tasksCompleted} doneThisWeek={a.tasksCompletedThisWeek} />
        </div>
      </div>
    </div>
  )
}

function CategorySection({ cat }: { cat: CategoryReport }) {
  const total = cat.completedThisWeek.length + cat.inProgress.length + cat.todo.length
  if (total === 0) return null

  return (
    <div className="mb-6 print-category">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>({total} attività)</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pl-4 print-grid-3">
        {/* Completate */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 size={12} style={{ color: '#10b981' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#10b981' }}>
              Completate ({cat.completedThisWeek.length})
            </span>
          </div>
          {cat.completedThisWeek.length === 0
            ? <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Nessuna completata questa settimana</p>
            : cat.completedThisWeek.map(a => <ActivityRow key={a.id} a={a} status="done" />)
          }
        </div>
        {/* In corso */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={12} style={{ color: '#f59e0b' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#f59e0b' }}>
              In corso ({cat.inProgress.length})
            </span>
          </div>
          {cat.inProgress.length === 0
            ? <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Nessuna attività in corso</p>
            : cat.inProgress.map(a => <ActivityRow key={a.id} a={a} status="in_progress" />)
          }
        </div>
        {/* Da fare */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Circle size={12} style={{ color: '#64748b' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
              Da fare ({cat.todo.length})
            </span>
          </div>
          {cat.todo.length === 0
            ? <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Nessuna attività in coda</p>
            : cat.todo.map(a => <ActivityRow key={a.id} a={a} status="todo" />)
          }
        </div>
      </div>
    </div>
  )
}

function ProjectSection({ project }: { project: ProjectReport }) {
  const allCategories = [...project.categories, ...project.subProjects.flatMap(sp => sp.categories)]
  const hasAny = allCategories.some(c => c.completedThisWeek.length + c.inProgress.length + c.todo.length > 0)
  const totalCompleted = project.categories.reduce((s, c) => s + c.completedThisWeek.length, 0)
  const totalInProgress = project.categories.reduce((s, c) => s + c.inProgress.length, 0)
  const totalTodo = project.categories.reduce((s, c) => s + c.todo.length, 0)

  if (!hasAny) return null

  return (
    <div className="mb-8 rounded-2xl overflow-hidden print-project"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${project.color}, ${project.color}50)` }} />
      <div className="p-6">
        {/* Project header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: project.color + '18' }}>
              <FolderKanban size={18} style={{ color: project.color }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</h2>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {project.categories.length} categorie · {project.subProjects.length > 0 && `${project.subProjects.length} sotto-progetti · `}
                {totalCompleted + totalInProgress + totalTodo} attività
              </p>
            </div>
          </div>
          {/* Mini progress pills */}
          <div className="flex items-center gap-2 no-print">
            {totalCompleted > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                ✓ {totalCompleted} completate
              </span>
            )}
            {totalInProgress > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                ◷ {totalInProgress} in corso
              </span>
            )}
            {totalTodo > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(100,116,139,0.15)', color: '#64748b' }}>
                ○ {totalTodo} da fare
              </span>
            )}
          </div>
        </div>

        {/* Categories */}
        {project.categories.map(cat => <CategorySection key={cat.id} cat={cat} />)}

        {/* Sub-projects */}
        {project.subProjects.map(sp => (
          <div key={sp.id} className="mt-4 pl-4 print-subproject"
            style={{ borderLeft: `2px solid ${sp.color}40` }}>
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen size={14} style={{ color: sp.color }} />
              <span className="text-sm font-semibold" style={{ color: sp.color }}>{sp.name}</span>
            </div>
            {sp.categories.map(cat => <CategorySection key={cat.id} cat={cat} />)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReportPage() {
  const [monday, setMonday] = useState<Date>(() => getMonday(new Date()))
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  const sunday = addDays(monday, 6)

  const fetchReport = useCallback(async (from: Date, to: Date) => {
    setLoading(true)
    try {
      const toEnd = new Date(to)
      toEnd.setHours(23, 59, 59, 999)
      const r = await fetch(`/api/report?from=${from.toISOString()}&to=${toEnd.toISOString()}`)
      if (r.ok) setReport(await r.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchReport(monday, sunday) }, [monday])

  const prevWeek = () => setMonday(d => addDays(d, -7))
  const nextWeek = () => setMonday(d => addDays(d, 7))
  const isCurrentWeek = getMonday(new Date()).getTime() === monday.getTime()

  const s = report?.summary

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; font-size: 11pt; }
          aside, .no-print { display: none !important; }
          main { margin-left: 0 !important; }
          .print-project { background: white !important; border: 1px solid #e2e8f0 !important; break-inside: avoid; }
          .print-category { break-inside: avoid; }
          .print-activity { background: #f8fafc !important; border-color: #e2e8f0 !important; }
          .print-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
          .print-subproject { border-left-color: #94a3b8 !important; }
          * { color: #1e293b !important; }
          h2 { color: #0f172a !important; }
          .report-summary { background: #f1f5f9 !important; border-color: #e2e8f0 !important; }
        }
      `}</style>

      <div className="p-6 max-w-6xl mx-auto animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 no-print">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Report Settimanale</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Riepilogo attività per la presentazione al team
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
          >
            <Printer size={15} /> Stampa / Esporta PDF
          </button>
        </div>

        {/* Print-only header */}
        <div className="hidden print-header mb-6" style={{ display: 'none' }}>
          <style>{`.print-header { display: block !important; }`}</style>
          <h1 style={{ fontSize: '20pt', fontWeight: 'bold', marginBottom: '4px' }}>Report Settimanale — TaskFlow</h1>
          <p style={{ fontSize: '12pt', color: '#64748b' }}>
            {formatDate(monday)} – {formatDate(sunday)}
          </p>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between mb-6 rounded-2xl px-5 py-4 report-summary"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <button onClick={prevWeek} className="p-2 rounded-xl transition-colors no-print"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {weekLabel(monday, sunday)}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {formatDate(monday)} – {formatDate(sunday)}
              {isCurrentWeek && <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>Settimana corrente</span>}
            </div>
          </div>
          <button onClick={nextWeek} className="p-2 rounded-xl transition-colors no-print"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Summary */}
        {s && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {[
              { label: 'Attività completate', value: s.activitiesCompleted, color: '#10b981', icon: <CheckCircle2 size={16} /> },
              { label: 'In corso', value: s.activitiesInProgress, color: '#f59e0b', icon: <Clock size={16} /> },
              { label: 'Da fare', value: s.activitiesTodo, color: '#64748b', icon: <Circle size={16} /> },
              { label: 'Task completati', value: s.tasksCompletedThisWeek, color: '#6366f1', icon: <BarChart2 size={16} /> },
              { label: 'Task aperti', value: s.tasksOpen, color: '#94a3b8', icon: <BarChart2 size={16} /> },
            ].map(card => (
              <div key={card.label} className="rounded-xl px-4 py-3 text-center"
                style={{ background: card.color + '12', border: `1px solid ${card.color}30` }}>
                <div className="flex items-center justify-center mb-1" style={{ color: card.color }}>{card.icon}</div>
                <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl h-48 skeleton" />
            ))}
          </div>
        ) : report?.projects.length === 0 ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <FolderKanban size={32} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nessun dato per questa settimana</p>
          </div>
        ) : (
          report?.projects.map(p => <ProjectSection key={p.id} project={p} />)
        )}
      </div>
    </>
  )
}
