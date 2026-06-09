'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Plus,
  TrendingUp
} from 'lucide-react'
import { Project, Task, Stats } from '@/lib/types'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsRes, tasksRes, statsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/stats')
      ])

      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data)
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json()
        setRecentTasks(data.slice(0, 5))
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10'
      case 'medium': return 'text-amber-400 bg-amber-400/10'
      case 'low': return 'text-emerald-400 bg-emerald-400/10'
      default: return 'text-slate-400 bg-slate-400/10'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-emerald-400'
      case 'in_progress': return 'text-amber-400'
      case 'todo': return 'text-slate-400'
      default: return 'text-slate-400'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-pulse text-slate-400">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Panoramica dei tuoi progetti e attività</p>
        </div>
        <Link
          href="/projects?new=true"
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25"
        >
          <Plus size={20} />
          Nuovo Progetto
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <FolderKanban className="text-indigo-400" size={24} />
            </div>
            <TrendingUp className="text-emerald-400" size={20} />
          </div>
          <div className="text-3xl font-bold text-white">{stats?.overall.totalProjects || 0}</div>
          <div className="text-slate-400 text-sm mt-1">Progetti totali</div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <CheckSquare className="text-emerald-400" size={24} />
            </div>
            <span className="text-emerald-400 text-sm font-medium">{stats?.overall.completionRate || 0}%</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.overall.completedTasks || 0}</div>
          <div className="text-slate-400 text-sm mt-1">Task completati</div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Clock className="text-amber-400" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.overall.pendingTasks || 0}</div>
          <div className="text-slate-400 text-sm mt-1">Task in attesa</div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.overall.overdueTasks || 0}</div>
          <div className="text-slate-400 text-sm mt-1">Task in ritardo</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Projects Overview */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Progetti</h2>
            <Link href="/projects" className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center gap-1">
              Vedi tutti <ArrowRight size={16} />
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FolderKanban size={48} className="mx-auto mb-3 opacity-50" />
                <p>Nessun progetto ancora</p>
                <Link href="/projects?new=true" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
                  Crea il primo progetto
                </Link>
              </div>
            ) : (
              projects.slice(0, 5).map((project) => {
                const projectStats = stats?.projectStats.find(p => p.id === project.id)
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900 transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: project.color + '20' }}
                    >
                      <FolderKanban size={24} style={{ color: project.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{project.name}</div>
                      <div className="text-sm text-slate-400">
                        {projectStats?.completedTasks || 0}/{projectStats?.totalTasks || 0} task completati
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{projectStats?.completionRate || 0}%</div>
                      <div className="w-20 h-2 bg-slate-700 rounded-full mt-1">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${projectStats?.completionRate || 0}%`, backgroundColor: project.color }}
                        />
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Task Recenti</h2>
            <Link href="/calendar" className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center gap-1">
              Vedi calendario <ArrowRight size={16} />
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {recentTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckSquare size={48} className="mx-auto mb-3 opacity-50" />
                <p>Nessun task ancora</p>
              </div>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${task.completed ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {task.title}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {task.activity?.category?.project?.name} / {task.activity?.name}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Bassa'}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-slate-500">
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
