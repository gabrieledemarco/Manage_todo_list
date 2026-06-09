'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Target,
  Activity as ActivityIcon
} from 'lucide-react'
import { Stats } from '@/lib/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const priorityData = stats ? [
    { name: 'Alta', value: stats.tasksByPriority.high, color: '#ef4444' },
    { name: 'Media', value: stats.tasksByPriority.medium, color: '#f59e0b' },
    { name: 'Bassa', value: stats.tasksByPriority.low, color: '#22c55e' }
  ] : []

  const statusData = stats ? [
    { name: 'Da fare', value: stats.tasksByStatus.todo, color: '#64748b' },
    { name: 'In corso', value: stats.tasksByStatus.in_progress, color: '#f59e0b' },
    { name: 'Completate', value: stats.tasksByStatus.done, color: '#22c55e' }
  ] : []

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-pulse text-slate-400">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Statistiche</h1>
        <p className="text-slate-400 mt-1">Monitora l&apos;andamento dei tuoi progetti</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-900/20 rounded-2xl p-6 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-500/30 rounded-xl">
              <Target className="text-indigo-400" size={24} />
            </div>
            <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
              <TrendingUp size={14} />
              {stats?.overall.completionRate || 0}%
            </span>
          </div>
          <div className="text-4xl font-bold text-white mb-1">{stats?.overall.completionRate || 0}%</div>
          <div className="text-indigo-300 text-sm">Tasso di completamento</div>
          <div className="mt-4 h-2 bg-indigo-950/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${stats?.overall.completionRate || 0}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-900/20 rounded-2xl p-6 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/30 rounded-xl">
              <CheckCircle2 className="text-emerald-400" size={24} />
            </div>
          </div>
          <div className="text-4xl font-bold text-white mb-1">{stats?.overall.completedTasks || 0}</div>
          <div className="text-emerald-300 text-sm">Task completati</div>
          <div className="mt-4 text-xs text-emerald-400/70">
            di {stats?.overall.totalTasks || 0} totali
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-900/50 to-amber-900/20 rounded-2xl p-6 border border-amber-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/30 rounded-xl">
              <Clock className="text-amber-400" size={24} />
            </div>
          </div>
          <div className="text-4xl font-bold text-white mb-1">{stats?.overall.pendingTasks || 0}</div>
          <div className="text-amber-300 text-sm">Task in attesa</div>
          <div className="mt-4 text-xs text-amber-400/70">
            {Math.round((stats?.overall.pendingTasks || 0) / Math.max(stats?.overall.totalTasks || 1, 1) * 100)}% del totale
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/50 to-red-900/20 rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500/30 rounded-xl">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
          </div>
          <div className="text-4xl font-bold text-white mb-1">{stats?.overall.overdueTasks || 0}</div>
          <div className="text-red-300 text-sm">Task in ritardo</div>
          <div className="mt-4 text-xs text-red-400/70">
            {stats?.overall.overdueTasks === 0 ? 'Tutto in regola!' : 'Richiedono attenzione'}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Completion Chart */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <BarChart3 className="text-violet-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Completamento settimanale</h2>
              <p className="text-sm text-slate-400">Task completati negli ultimi 7 giorni</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weeklyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Priority Distribution */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <ActivityIcon className="text-rose-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Distribuzione priorità</h2>
              <p className="text-sm text-slate-400">Task per livello di priorità</p>
            </div>
          </div>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Legend 
                  verticalAlign="middle" 
                  align="right"
                  iconType="circle"
                  formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Project Performance */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <TrendingUp className="text-cyan-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Performance progetti</h2>
            <p className="text-sm text-slate-400">Statistiche dettagliate per progetto</p>
          </div>
        </div>

        {(!stats?.projectStats || stats.projectStats.length === 0) ? (
          <div className="text-center py-12 text-slate-500">
            <BarChart3 size={48} className="mx-auto mb-3 opacity-50" />
            <p>Nessun dato disponibile</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Progetto</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Task Totali</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Completati</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">In Attesa</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">In Ritardo</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {stats.projectStats.map((project) => (
                  <tr key={project.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="font-medium text-white">{project.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4 text-slate-300">
                      {project.totalTasks}
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-emerald-400 font-medium">{project.completedTasks}</span>
                    </td>
                    <td className="text-center py-4 px-4 text-slate-300">
                      {project.pendingTasks}
                    </td>
                    <td className="text-center py-4 px-4">
                      {project.overdueTasks > 0 ? (
                        <span className="text-red-400 font-medium">{project.overdueTasks}</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${project.completionRate}%`,
                              backgroundColor: project.color
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white w-12 text-right">
                          {project.completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Stato attività</h2>
          <div className="space-y-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-4">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1 text-slate-300">{item.name}</span>
                <span className="text-lg font-bold text-white">{item.value}</span>
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(item.value / Math.max(stats?.overall.totalTasks || 1, 1)) * 100}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Riepilogo</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{stats?.overall.totalProjects || 0}</div>
              <div className="text-sm text-slate-400 mt-1">Progetti</div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{stats?.overall.totalTasks || 0}</div>
              <div className="text-sm text-slate-400 mt-1">Task totali</div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-emerald-400">
                {stats?.overall.totalTasks ? Math.round((stats.overall.completedTasks / stats.overall.totalTasks) * 100) : 0}%
              </div>
              <div className="text-sm text-slate-400 mt-1">Completamento</div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-amber-400">{stats?.overall.pendingTasks || 0}</div>
              <div className="text-sm text-slate-400 mt-1">In attesa</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}