'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Folder,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Pencil,
  Link2,
  Lock
} from 'lucide-react'
import { Project, Category, Activity, Task } from '@/lib/types'
import { DocPathBadge } from '@/components/DocPath'
import CategoryModal from '@/components/CategoryModal'
import ActivityModal from '@/components/ActivityModal'
import TaskModal from '@/components/TaskModal'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
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
    fetchProject()
    fetchAllProjects()
    fetchAllCategories()
    fetchAllActivities()
  }, [id])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data)
        setCategories(data.categories || [])
      } else if (res.status === 404) {
        router.push('/projects')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setAllProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchAllCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setAllCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchAllActivities = async () => {
    try {
      const res = await fetch('/api/activities')
      if (res.ok) {
        const data = await res.json()
        setAllActivities(data)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleActivity = (activityId: string) => {
    const newExpanded = new Set(expandedActivities)
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId)
    } else {
      newExpanded.add(activityId)
    }
    setExpandedActivities(newExpanded)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa categoria?')) return
    try {
      await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' })
      fetchProject()
      fetchAllCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa attività?')) return
    try {
      await fetch(`/api/activities/${activityId}`, { method: 'DELETE' })
      fetchProject()
      fetchAllActivities()
    } catch (error) {
      console.error('Error deleting activity:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      fetchProject()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleToggleTask = async (task: Task) => {
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, completed: !task.completed })
      })
      fetchProject()
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle size={14} className="text-red-400" />
      case 'medium': return <Clock size={14} className="text-amber-400" />
      case 'low': return <CheckCircle2 size={14} className="text-emerald-400" />
      default: return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  }

  const isOverdue = (task: Task) => {
    return !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
  }

  const isTaskBlocked = (task: Task) => {
    return task.dependsOn && task.dependsOn.some(dep => !dep.prerequisite?.completed)
  }

  const isActivityBlocked = (activity: Activity) => {
    return activity.dependsOn && activity.dependsOn.some(dep => dep.prerequisite?.status !== 'done')
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-pulse text-slate-400">Caricamento...</div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          href="/projects"
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: project.color + '20' }}
          >
            <Folder size={20} style={{ color: project.color }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            {project.description && (
              <p className="text-slate-400 text-sm">{project.description}</p>
            )}
            {project.docPath && <DocPathBadge path={project.docPath} />}
          </div>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null)
            setShowCategoryModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors"
        >
          <Plus size={18} />
          Categoria
        </button>
      </div>

      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-12 text-center">
            <ListTodo size={64} className="mx-auto text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Nessuna categoria</h2>
            <p className="text-slate-400 mb-6">Aggiungi una categoria per organizzare le tue attività</p>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-500 transition-colors"
            >
              <Plus size={20} />
              Aggiungi Categoria
            </button>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => toggleCategory(category.id)}
              >
                <button className="p-1">
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown size={18} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={18} className="text-slate-400" />
                  )}
                </button>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: category.color + '20' }}
                >
                  <Folder size={16} style={{ color: category.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-white">{category.name}</span>
                  {category.description && (
                    <span className="text-slate-400 text-sm ml-2">• {category.description}</span>
                  )}
                  {category.docPath && (
                    <div className="mt-1.5"><DocPathBadge path={category.docPath} /></div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">
                    {category.activities?.length || 0} attività
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingCategory(category)
                      setShowCategoryModal(true)
                    }}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCategory(category.id)
                    }}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCategoryId(category.id)
                      setEditingActivity(null)
                      setShowActivityModal(true)
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-500 transition-colors"
                  >
                    <Plus size={14} />
                    Attività
                  </button>
                </div>
              </div>

              {expandedCategories.has(category.id) && (
                <div className="p-4 space-y-3">
                  {(!category.activities || category.activities.length === 0) ? (
                    <p className="text-center text-slate-500 py-4">Nessuna attività in questa categoria</p>
                  ) : (
                    category.activities.map((activity) => {
                      const blocked = isActivityBlocked(activity)
                      return (
                        <div key={activity.id} className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
                          <div
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
                            onClick={() => toggleActivity(activity.id)}
                          >
                            <button className="p-0.5">
                              {expandedActivities.has(activity.id) ? (
                                <ChevronDown size={16} className="text-slate-500" />
                              ) : (
                                <ChevronRight size={16} className="text-slate-500" />
                              )}
                            </button>
                            <div
                              className={`w-6 h-6 rounded flex items-center justify-center ${
                                activity.status === 'done' ? 'bg-emerald-500/20' :
                                activity.status === 'in_progress' ? 'bg-amber-500/20' : 'bg-slate-700'
                              }`}
                            >
                              {activity.status === 'done' ? (
                                <CheckCircle2 size={14} className="text-emerald-400" />
                              ) : activity.status === 'in_progress' ? (
                                <Clock size={14} className="text-amber-400" />
                              ) : (
                                <ListTodo size={14} className="text-slate-400" />
                              )}
                            </div>
                            <span className="flex-1 text-white font-medium">{activity.name}</span>
                            {/* Dependency indicators */}
                            {activity.dependsOn && activity.dependsOn.length > 0 && (
                              <span
                                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                  blocked
                                    ? 'bg-orange-500/20 text-orange-400'
                                    : 'bg-slate-700 text-slate-400'
                                }`}
                                title={`${activity.dependsOn.length} prerequisit${activity.dependsOn.length === 1 ? 'o' : 'i'}`}
                              >
                                <Link2 size={10} />
                                {activity.dependsOn.length}
                                {blocked && ' bloccata'}
                              </span>
                            )}
                            {activity.startedAt && (
                              <span className="text-xs text-slate-500" title={`Iniziata il ${formatDate(activity.startedAt)}`}>
                                <Clock size={10} className="inline mr-0.5" />
                                {formatDate(activity.startedAt)}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              activity.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                              activity.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
                            }`}>
                              {activity.status === 'done' ? 'Completato' : activity.status === 'in_progress' ? 'In corso' : 'Da fare'}
                            </span>
                            <span className="text-sm text-slate-500">
                              {activity.tasks?.length || 0} task
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteActivity(activity.id)
                              }}
                              className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingActivity(activity)
                                setSelectedCategoryId(activity.categoryId)
                                setShowActivityModal(true)
                              }}
                              className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"
                              title="Modifica attività"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedActivityId(activity.id)
                                setEditingTask(null)
                                setShowTaskModal(true)
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-500 transition-colors"
                            >
                              <Plus size={12} />
                              Task
                            </button>
                          </div>

                          {activity.docPath && (
                            <div className="px-3 pb-2">
                              <DocPathBadge path={activity.docPath} />
                            </div>
                          )}

                          {expandedActivities.has(activity.id) && (
                            <div className="px-4 pb-4 space-y-2">
                              {(!activity.tasks || activity.tasks.length === 0) ? (
                                <p className="text-center text-slate-500 py-2 text-sm">Nessun task in questa attività</p>
                              ) : (
                                activity.tasks.map((task) => {
                                  const taskBlocked = isTaskBlocked(task)
                                  const unfinishedPrereqs = task.dependsOn?.filter(d => !d.prerequisite?.completed) || []
                                  return (
                                    <div
                                      key={task.id}
                                      className={`rounded-lg bg-slate-800/50 ${
                                        task.completed ? 'opacity-60' : ''
                                      } ${isOverdue(task) ? 'ring-1 ring-red-500/30' : ''}`}
                                    >
                                      <div className="flex items-center gap-3 p-2.5">
                                      <button
                                        onClick={() => handleToggleTask(task)}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                          task.completed
                                            ? 'bg-emerald-500 border-emerald-500'
                                            : 'border-slate-500 hover:border-emerald-500'
                                        }`}
                                      >
                                        {task.completed && <CheckSquare size={12} className="text-white" />}
                                      </button>
                                      <span className={`flex-1 text-sm ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                                        {task.title}
                                      </span>
                                      {/* Task dependency indicators */}
                                      {task.dependsOn && task.dependsOn.length > 0 && (
                                        <span className="flex items-center gap-1 text-xs text-slate-400" title="Ha prerequisiti">
                                          <Link2 size={10} />
                                        </span>
                                      )}
                                      {taskBlocked && (
                                        <span className="flex items-center gap-1 text-xs text-slate-400" title="Bloccata da prerequisiti incompleti">
                                          <Lock size={10} className="text-amber-400" />
                                          <span className="flex gap-1">
                                            {unfinishedPrereqs.map(dep => (
                                              <span key={dep.prerequisiteId} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded text-xs">
                                                {dep.prerequisite?.title}
                                              </span>
                                            ))}
                                          </span>
                                        </span>
                                      )}
                                      {getPriorityIcon(task.priority)}
                                      {task.dueDate && (
                                        <span className={`text-xs ${isOverdue(task) ? 'text-red-400' : 'text-slate-500'}`}>
                                          {formatDate(task.dueDate)}
                                        </span>
                                      )}
                                      <button
                                        onClick={() => {
                                          setEditingTask(task)
                                          setSelectedActivityId(task.activityId)
                                          setShowTaskModal(true)
                                        }}
                                        className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                      </div>
                                      {task.docPath && (
                                        <div className="px-2.5 pb-2">
                                          <DocPathBadge path={task.docPath} />
                                        </div>
                                      )}
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

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false)
          setEditingCategory(null)
        }}
        onSave={() => {
          fetchProject()
          fetchAllCategories()
        }}
        category={editingCategory}
        projectId={id}
        projects={allProjects.length > 0 ? allProjects : (project ? [{ ...project }] : [])}
      />

      <ActivityModal
        isOpen={showActivityModal}
        onClose={() => {
          setShowActivityModal(false)
          setEditingActivity(null)
          setSelectedActivityId('')
        }}
        onSave={() => {
          fetchProject()
          fetchAllActivities()
        }}
        activity={editingActivity}
        categoryId={selectedCategoryId}
        categories={allCategories}
        projectId={id}
      />

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setEditingTask(null)
          setSelectedActivityId('')
        }}
        onSave={fetchProject}
        task={editingTask}
        activityId={selectedActivityId}
        activities={allActivities}
        projectId={id}
      />
    </div>
  )
}
