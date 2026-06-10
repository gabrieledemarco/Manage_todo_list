'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FolderKanban, CheckSquare, Clock, AlertTriangle, ArrowRight, Plus, Zap } from 'lucide-react'
import { Project, Task, Stats } from '@/lib/types'

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="skeleton h-4 w-24 mb-4" />
      <div className="skeleton h-8 w-16 mb-2" />
      <div className="skeleton h-3 w-32" />
    </div>
  )
}

function StatCard({ icon: Icon, value, label, accent, sub }: {
  icon: React.ElementType, value: number | string, label: string, accent: string, sub?: string
}) {
  return (
    <div className="rounded-2xl p-6 transition-all duration-200 group cursor-default"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl" style={{ background: `${accent}18` }}>
          <Icon size={20} style={{ color: accent }} />
        </div>
        {sub && <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: `${accent}18`, color: accent }}>{sub}</span>}
      </div>
      <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [pRes, tRes, sRes] = await Promise.all([fetch('/api/projects'), fetch('/api/tasks'), fetch('/api/stats')])
      if (pRes.ok) setProjects(await pRes.json())
      if (tRes.ok) { const d = await tRes.json(); setRecentTasks(d.slice(0, 6)) }
      if (sRes.ok) setStats(await sRes.json())
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const getPriorityStyle = (priority: string) => {
    if (priority === 'high') return { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' }
    if (priority === 'medium') return { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' }
    return { bg: 'rgba(16,185,129,0.12)', color: '#10b981' }
  }

  const getPriorityLabel = (p: string) => p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Bassa'

  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera'

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
          <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-7xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} style={{ color: '#f59e0b' }} />
            <span className="text-sm font-medium" style={{ color: '#f59e0b' }}>{greeting}</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Panoramica dei tuoi progetti e attività</p>
        </div>
        <Link href="/projects?new=true"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
        >
          <Plus size={16} />
          Nuovo Progetto
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={FolderKanban} value={stats?.overall.totalProjects || 0} label="Progetti totali" accent="#6366f1" />
        <StatCard icon={CheckSquare} value={stats?.overall.completedTasks || 0} label="Task completati" accent="#10b981" sub={`${stats?.overall.completionRate || 0}%`} />
        <StatCard icon={Clock} value={stats?.overall.pendingTasks || 0} label="Task in attesa" accent="#f59e0b" />
        <StatCard icon={AlertTriangle} value={stats?.overall.overdueTasks || 0} label="Task in ritardo" accent="#ef4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Progetti recenti</h2>
            <Link href="/projects" className="flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
            >
              Vedi tutti <ArrowRight size={13} />
            </Link>
          </div>
          <div className="p-4 space-y-2">
            {projects.length === 0 ? (
              <div className="text-center py-10">
                <FolderKanban size={40} style={{ color: 'var(--text-tertiary)' }} className="mx-auto mb-3" />
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Nessun progetto ancora</p>
                <Link href="/projects?new=true" className="text-sm font-medium" style={{ color: '#818cf8' }}>Crea il primo →</Link>
              </div>
            ) : (
              projects.slice(0, 5).map((project) => {
                const ps = stats?.projectStats.find(p => p.id === project.id)
                const pct = ps?.completionRate || 0
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150"
                    style={{ color: 'var(--text-primary)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: project.color + '20' }}>
                      <FolderKanban size={18} style={{ color: project.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{project.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {ps?.completedTasks || 0}/{ps?.totalTasks || 0} task
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{pct}%</div>
                      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: project.color }} />
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Task recenti</h2>
            <Link href="/calendar" className="flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
            >
              Calendario <ArrowRight size={13} />
            </Link>
          </div>
          <div className="p-4 space-y-1.5">
            {recentTasks.length === 0 ? (
              <div className="text-center py-10">
                <CheckSquare size={40} style={{ color: 'var(--text-tertiary)' }} className="mx-auto mb-3" />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nessun task ancora</p>
              </div>
            ) : (
              recentTasks.map((task) => {
                const ps = getPriorityStyle(task.priority)
                const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < now
                return (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150"
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: task.completed ? '#10b981' : isOverdue ? '#ef4444' : 'rgba(255,255,255,0.2)' }} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${task.completed ? 'line-through' : ''}`}
                        style={{ color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                        {task.title}
                      </div>
                      <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {task.activity?.category?.project?.name} · {task.activity?.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: ps.bg, color: ps.color }}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs" style={{ color: isOverdue ? '#ef4444' : 'var(--text-tertiary)' }}>
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
