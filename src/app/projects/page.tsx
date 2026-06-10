'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, FolderKanban, Pencil, Trash2, ArrowRight, FolderOpen } from 'lucide-react'
import { Project } from '@/lib/types'
import ProjectModal from '@/components/ProjectModal'

function SkeletonProjectCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="h-1 skeleton" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="skeleton w-11 h-11 rounded-xl" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-48" />
          </div>
        </div>
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-9 rounded-xl" />
      </div>
    </div>
  )
}

interface ProjectCardProps {
  project: Project
  allProjects: Project[]
  onEdit: (p: Project) => void
  onDelete: (id: string) => void
  depth?: number
}

function ProjectCard({ project, allProjects, onEdit, onDelete, depth = 0 }: ProjectCardProps) {
  const totalActivities = project.categories?.reduce((a, c) => a + (c.activities?.length || 0), 0) || 0
  const children = allProjects.filter(p => p.parentId === project.id)

  return (
    <div style={{ marginLeft: depth > 0 ? '0' : '0' }}>
      <div className="rounded-2xl overflow-hidden group transition-all duration-200"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
      >
        <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${project.color}, ${project.color}80)` }} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: project.color + '18' }}>
                <FolderKanban size={20} style={{ color: project.color }} />
              </div>
              <div className="min-w-0">
                <Link href={`/projects/${project.id}`}
                  className="font-semibold text-sm truncate block transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                >
                  {project.name}
                </Link>
                {project.description && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
              <button onClick={() => onEdit(project)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
              >
                <Pencil size={14} />
              </button>
              <button onClick={() => onDelete(project.id)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
            <span>{project.categories?.length || 0} categorie</span>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span>{totalActivities} attività</span>
            {children.length > 0 && (
              <>
                <span style={{ color: 'var(--border-strong)' }}>·</span>
                <span>{children.length} sotto-progett{children.length === 1 ? 'o' : 'i'}</span>
              </>
            )}
          </div>

          {project.categories && project.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.categories.slice(0, 3).map((cat) => (
                <span key={cat.id} className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: cat.color + '18', color: cat.color }}>
                  {cat.name}
                </span>
              ))}
              {project.categories.length > 3 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)' }}>
                  +{project.categories.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Sub-projects */}
          {children.length > 0 && (
            <div className="mb-4 space-y-1.5">
              <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                Sotto-progetti
              </div>
              {children.map(child => (
                <div key={child.id} className="flex items-center gap-2 px-3 py-2 rounded-xl group/child transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = child.color + '60'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
                >
                  <div className="w-4 h-4 rounded flex-shrink-0" style={{ background: child.color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderOpen size={10} style={{ color: child.color }} />
                  </div>
                  <Link href={`/projects/${child.id}`}
                    className="text-xs truncate flex-1 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = child.color}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
                  >
                    {child.name}
                  </Link>
                  <div className="flex items-center gap-1 opacity-0 group-hover/child:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(child)}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'}
                    >
                      <Pencil size={11} />
                    </button>
                    <button onClick={() => onDelete(child.id)}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <Link href={`/projects/${child.id}`}
                    className="opacity-0 group-hover/child:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          )}

          <Link href={`/projects/${project.id}`}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.12)'; (e.currentTarget as HTMLElement).style.color = '#818cf8'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
          >
            Gestisci <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  )
}

function ProjectsContent() {
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  useEffect(() => {
    fetchProjects()
    if (searchParams.get('new') === 'true') setShowModal(true)
  }, [searchParams])

  const fetchProjects = async () => {
    try {
      const r = await fetch('/api/projects')
      if (r.ok) setProjects(await r.json())
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo progetto e tutti i suoi dati?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    fetchProjects()
  }

  const handleEdit = (p: Project) => { setEditing(p); setShowModal(true) }
  const handleClose = () => { setShowModal(false); setEditing(null) }

  // Only root projects appear in the main grid; children are shown inside parent cards
  const rootProjects = projects.filter(p => !p.parentId)

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-start justify-between">
          <div><div className="skeleton h-7 w-32 mb-2" /><div className="skeleton h-4 w-56" /></div>
          <div className="skeleton h-10 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <SkeletonProjectCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Progetti</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Gestisci i tuoi progetti e le loro attività
            {projects.length > rootProjects.length && (
              <span className="ml-2" style={{ color: 'var(--text-tertiary)' }}>
                ({rootProjects.length} radice · {projects.length - rootProjects.length} sotto-progetti)
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
        >
          <Plus size={16} />
          Nuovo Progetto
        </button>
      </div>

      {rootProjects.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.12)' }}>
            <FolderKanban size={32} style={{ color: '#6366f1' }} />
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Nessun progetto ancora</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Crea il tuo primo progetto per iniziare a organizzare le tue attività</p>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Plus size={16} /> Crea Progetto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rootProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              allProjects={projects}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ProjectModal
        isOpen={showModal}
        onClose={handleClose}
        onSave={fetchProjects}
        project={editing}
        allProjects={projects}
      />
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="p-8"><div className="skeleton h-8 w-40" /></div>}>
      <ProjectsContent />
    </Suspense>
  )
}
