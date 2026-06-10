'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Calendar, BarChart3, Plus, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Project } from '@/lib/types'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Progetti', icon: FolderKanban },
  { href: '/calendar', label: 'Calendario', icon: Calendar },
  { href: '/dashboard', label: 'Statistiche', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [projects, setProjects] = useState<Project[]>([])
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/projects').then(r => r.ok ? r.json() : []).then(setProjects).catch(() => {})
  }, [])

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <aside style={{ background: 'var(--bg-elevated)', borderRight: '1px solid var(--border)' }}
      className="w-64 text-white flex flex-col h-screen fixed left-0 top-0 z-40">

      {/* Brand */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <FolderKanban size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>TaskFlow</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Gestione progetti</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative group"
                style={{
                  background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: isActive ? '#818cf8' : 'var(--text-secondary)'
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' } }}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: '#6366f1' }} />}
                <Icon size={17} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Projects section */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Progetti</span>
            <Link href="/projects?new=true"
              className="p-1 rounded-md transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
            >
              <Plus size={14} />
            </Link>
          </div>

          <div className="space-y-0.5">
            {projects.map((project) => {
              const isExpanded = expandedProjects.has(project.id)
              const isProjectActive = pathname.startsWith(`/projects/${project.id}`)
              return (
                <div key={project.id}>
                  <button onClick={() => toggleProject(project.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150"
                    style={{ color: isProjectActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = isProjectActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    <ChevronRight size={13} className={`flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} style={{ color: 'var(--text-tertiary)' }} />
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                    <span className="text-sm truncate">{project.name}</span>
                  </button>

                  {isExpanded && project.categories && (
                    <div className="ml-5 pl-3 mt-0.5 space-y-0.5" style={{ borderLeft: '1px solid var(--border)' }}>
                      {project.categories.map((cat) => (
                        <Link key={cat.id} href={`/projects/${project.id}?category=${cat.id}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all duration-150"
                          style={{ color: 'var(--text-tertiary)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="truncate">{cat.name}</span>
                          {cat.activities && <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)' }}>{cat.activities.length}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
          TaskFlow v0.2.0 · Self-hosted
        </div>
      </div>
    </aside>
  )
}
