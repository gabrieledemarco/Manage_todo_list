'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, FolderKanban, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Project } from '@/lib/types'
import ProjectModal from '@/components/ProjectModal'

function ProjectsContent() {
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
    if (searchParams.get('new') === 'true') {
      setShowProjectModal(true)
    }
  }, [searchParams])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo progetto?')) return
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchProjects()
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
    setMenuOpen(null)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowProjectModal(true)
    setMenuOpen(null)
  }

  const handleCloseModal = () => {
    setShowProjectModal(false)
    setEditingProject(null)
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
          <h1 className="text-3xl font-bold text-white">Progetti</h1>
          <p className="text-slate-400 mt-1">Gestisci i tuoi progetti e le loro attività</p>
        </div>
        <button
          onClick={() => setShowProjectModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25"
        >
          <Plus size={20} />
          Nuovo Progetto
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-12 text-center">
          <FolderKanban size={64} className="mx-auto text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Nessun progetto ancora</h2>
          <p className="text-slate-400 mb-6">Crea il tuo primo progetto per iniziare</p>
          <button
            onClick={() => setShowProjectModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors"
          >
            <Plus size={20} />
            Crea Progetto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-all group"
            >
              <div
                className="h-2"
                style={{ backgroundColor: project.color }}
              />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: project.color + '20' }}
                    >
                      <FolderKanban size={24} style={{ color: project.color }} />
                    </div>
                    <div>
                      <Link href={`/projects/${project.id}`} className="font-semibold text-white hover:text-indigo-300 transition-colors">
                        {project.name}
                      </Link>
                      {project.description && (
                        <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{project.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                      className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {menuOpen === project.id && (
                      <div className="absolute right-0 top-full mt-1 bg-slate-700 rounded-lg shadow-xl border border-slate-600 py-1 min-w-[140px] z-10">
                        <button
                          onClick={() => handleEditProject(project)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 transition-colors"
                        >
                          <Pencil size={14} />
                          Modifica
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-600 transition-colors"
                        >
                          <Trash2 size={14} />
                          Elimina
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                  <span>{project.categories?.length || 0} categorie</span>
                  <span>•</span>
                  <span>
                    {project.categories?.reduce((acc, cat) => acc + (cat.activities?.length || 0), 0) || 0} attività
                  </span>
                </div>

                {project.categories && project.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.categories.slice(0, 3).map((category) => (
                      <span
                        key={category.id}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: category.color + '20', color: category.color }}
                      >
                        {category.name}
                      </span>
                    ))}
                    {project.categories.length > 3 && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-400">
                        +{project.categories.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <Link
                  href={`/projects/${project.id}`}
                  className="mt-4 block text-center py-2.5 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
                >
                  Gestisci
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectModal
        isOpen={showProjectModal}
        onClose={handleCloseModal}
        onSave={fetchProjects}
        project={editingProject}
      />
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-pulse text-slate-400">Caricamento...</div>
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  )
}