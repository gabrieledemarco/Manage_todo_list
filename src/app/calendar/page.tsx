'use client'

import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Task, Project } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  X
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  backgroundColor: string
  borderColor: string
  extendedProps: {
    task: Task
    projectColor: string
    projectName: string
  }
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const calendarRef = useRef<FullCalendar>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects')
      ])

      if (tasksRes.ok) {
        const data = await tasksRes.json()
        setTasks(data)
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProjectColor = (task: Task): string => {
    return task.activity?.category?.project?.color || '#6366f1'
  }

  const getProjectName = (task: Task): string => {
    return task.activity?.category?.project?.name || 'Sconosciuto'
  }

  const events: CalendarEvent[] = tasks
    .filter(task => task.dueDate)
    .map(task => ({
      id: task.id,
      title: task.title,
      start: task.dueDate!,
      backgroundColor: task.completed 
        ? '#10b981' 
        : new Date(task.dueDate!) < new Date() 
          ? '#ef4444' 
          : getProjectColor(task),
      borderColor: task.completed 
        ? '#10b981' 
        : new Date(task.dueDate!) < new Date() 
          ? '#ef4444' 
          : getProjectColor(task),
      extendedProps: {
        task,
        projectColor: getProjectColor(task),
        projectName: getProjectName(task)
      }
    }))

  const handleEventClick = (info: any) => {
    setSelectedTask(info.event.extendedProps.task)
  }

  const handleToggleComplete = async () => {
    if (!selectedTask) return
    try {
      await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedTask, completed: !selectedTask.completed })
      })
      setSelectedTask(null)
      fetchData()
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const isOverdue = (task: Task) => {
    return !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
  }

  const upcomingTasks = tasks
    .filter(task => task.dueDate && !task.completed)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

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
          <h1 className="text-3xl font-bold text-white">Calendario</h1>
          <p className="text-slate-400 mt-1">Visualizza le scadenze dei tuoi task</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
              }}
              locale={it}
              events={events}
              eventClick={handleEventClick}
              height="auto"
              eventDisplay="block"
              dayMaxEvents={3}
              moreLinkClick="popover"
              eventContent={(eventInfo) => (
                <div className="p-1 text-xs overflow-hidden">
                  <div className="font-medium truncate">{eventInfo.event.title}</div>
                  {eventInfo.event.extendedProps.projectName && (
                    <div className="opacity-75 truncate">{eventInfo.event.extendedProps.projectName}</div>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={18} className="text-amber-400" />
              Prossime scadenze
            </h2>
            <div className="space-y-3">
              {upcomingTasks.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Nessuna scadenza imminente</p>
              ) : (
                upcomingTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isOverdue(task) 
                        ? 'bg-red-500/10 hover:bg-red-500/20 ring-1 ring-red-500/30' 
                        : 'bg-slate-900/50 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: getProjectColor(task) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{task.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {task.activity?.category?.project?.name} / {task.activity?.name}
                        </div>
                        <div className={`text-xs mt-1 ${
                          isOverdue(task) ? 'text-red-400' : 'text-slate-500'
                        }`}>
                          {format(parseISO(task.dueDate!), "dd MMM yyyy", { locale: it })}
                          {isOverdue(task) && ' • In ritardo'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Legenda</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-slate-600" />
                <span className="text-sm text-slate-300">Task in programma</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span className="text-sm text-slate-300">Task in ritardo</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-emerald-500" />
                <span className="text-sm text-slate-300">Task completato</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Dettaglio Task</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {selectedTask.completed ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : isOverdue(selectedTask) ? (
                    <AlertTriangle size={20} className="text-red-400" />
                  ) : (
                    <Clock size={20} className="text-amber-400" />
                  )}
                  <span className={`font-medium ${
                    selectedTask.completed ? 'text-emerald-400' : 
                    isOverdue(selectedTask) ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {selectedTask.completed ? 'Completato' : 
                     isOverdue(selectedTask) ? 'In ritardo' : 'In programma'}
                  </span>
                </div>
                <h3 className={`text-lg font-semibold ${selectedTask.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                  {selectedTask.title}
                </h3>
              </div>

              {selectedTask.description && (
                <p className="text-slate-400">{selectedTask.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Progetto</div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getProjectColor(selectedTask) }}
                    />
                    <span className="text-white">{getProjectName(selectedTask)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Attività</div>
                  <span className="text-white">{selectedTask.activity?.name}</span>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Priorità</div>
                  <span className={`${
                    selectedTask.priority === 'high' ? 'text-red-400' :
                    selectedTask.priority === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {selectedTask.priority === 'high' ? 'Alta' :
                     selectedTask.priority === 'medium' ? 'Media' : 'Bassa'}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Scadenza</div>
                  <span className={isOverdue(selectedTask) ? 'text-red-400' : 'text-white'}>
                    {selectedTask.dueDate && format(parseISO(selectedTask.dueDate), "dd MMMM yyyy", { locale: it })}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3">
              <button
                onClick={() => setSelectedTask(null)}
                className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
              >
                Chiudi
              </button>
              <button
                onClick={handleToggleComplete}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  selectedTask.completed
                    ? 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {selectedTask.completed ? 'Segna come da fare' : 'Segna come completato'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}