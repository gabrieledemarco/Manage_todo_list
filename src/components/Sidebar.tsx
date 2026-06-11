'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  BarChart3,
  Plus,
  ChevronRight,
  FolderOpen,
  FileText
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Project } from '@/lib/types'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Progetti', icon: FolderKanban },
  { href: '/calendar', label: 'Calendario', icon: Calendar },
  { href: '/dashboard', label: 'Statistiche', icon: BarChart3 },
  { href: '/report', label: 'Report', icon: FileText },
]

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!now) return null

  const timeStr = now.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  const dateStr = now.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })

  // Capitalize first letter
  const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  return (
    <div className="text-center">
      <div className="text-lg font-mono font-semibold text-indigo-400 tracking-wider">
        {timeStr}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">
        {dateFormatted}
      </div>
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [projects, setProjects] = useState<Project[]>([])
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          TaskFlow
        </h1>
        <p className="text-slate-400 text-sm mt-1">Gestione progetti</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-8">
          <div className="flex items-center justify-between px-4 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Progetti
            </span>
            <Link
              href="/projects?new=true"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <Plus size={16} />
            </Link>
          </div>

          <ul className="space-y-1">
            {projects.filter(p => !p.parentId).map((project) => {
              const isExpanded = expandedProjects.has(project.id)
              const children = projects.filter(p => p.parentId === project.id)
              return (
                <li key={project.id}>
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleProject(project.id)}
                      className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                    >
                      <ChevronRight
                        size={14}
                        className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="truncate text-sm">{project.name}</span>
                    </button>
                  </div>
                  {isExpanded && (
                    <ul className="ml-8 mt-1 space-y-1 border-l border-slate-700 pl-3">
                      {/* Sub-projects */}
                      {children.map((child) => (
                        <li key={child.id}>
                          <button
                            onClick={() => toggleProject(child.id)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm transition-colors"
                          >
                            <ChevronRight
                              size={11}
                              className={`transition-transform flex-shrink-0 ${expandedProjects.has(child.id) ? 'rotate-90' : ''}`}
                            />
                            <FolderOpen size={12} className="flex-shrink-0" style={{ color: child.color }} />
                            <span className="truncate text-xs">{child.name}</span>
                          </button>
                          {expandedProjects.has(child.id) && child.categories && (
                            <ul className="ml-5 mt-0.5 space-y-0.5 border-l border-slate-700/50 pl-2">
                              {child.categories.map(category => (
                                <li key={category.id}>
                                  <Link
                                    href={`/projects/${child.id}?category=${category.id}`}
                                    className="flex items-center gap-2 px-2 py-1 rounded text-slate-500 hover:text-white hover:bg-slate-800/40 text-xs transition-colors"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                                    <span className="truncate">{category.name}</span>
                                    {category.activities && (
                                      <span className="ml-auto text-xs bg-slate-700 px-1 py-0.5 rounded-full text-slate-400">
                                        {category.activities.length}
                                      </span>
                                    )}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                      {/* Categories of the root project */}
                      {project.categories && project.categories.map((category) => (
                        <li key={category.id}>
                          <Link
                            href={`/projects/${project.id}?category=${category.id}`}
                            className="flex items-center gap-2 px-3 py-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm transition-colors"
                          >
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="truncate">{category.name}</span>
                            {category.activities && (
                              <span className="ml-auto text-xs bg-slate-700 px-1.5 py-0.5 rounded-full">
                                {category.activities.length}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <LiveClock />
        <div className="text-xs text-slate-500 text-center">
          TaskFlow v1.0 • Self-hosted
        </div>
      </div>
    </aside>
  )
}
