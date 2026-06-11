import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function inRange(date: Date | string | null | undefined, from: Date, to: Date): boolean {
  if (!date) return false
  const d = new Date(date)
  return d >= from && d <= to
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  let from: Date
  let to: Date

  if (fromParam && toParam) {
    from = new Date(fromParam)
    to = new Date(toParam)
  } else {
    const now = new Date()
    const dow = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
    monday.setHours(0, 0, 0, 0)
    from = monday
    to = new Date(monday)
    to.setDate(monday.getDate() + 6)
    to.setHours(23, 59, 59, 999)
  }

  try {
    const projects = await prisma.project.findMany({
      include: {
        children: {
          include: {
            categories: {
              include: {
                activities: { include: { tasks: true } }
              }
            }
          }
        },
        categories: {
          include: {
            activities: { include: { tasks: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    let totalActivitiesCompleted = 0
    let totalActivitiesInProgress = 0
    let totalActivitiesTodo = 0
    let totalTasksCompletedThisWeek = 0
    let totalTasksOpen = 0

    function processCategories(categories: typeof projects[0]['categories']) {
      return categories.map(cat => {
        const completedThisWeek = cat.activities
          .filter(a => a.status === 'done' && inRange(a.updatedAt, from, to))
          .map(a => ({
            id: a.id,
            name: a.name,
            description: a.description,
            startedAt: a.startedAt,
            updatedAt: a.updatedAt,
            isNewThisWeek: inRange(a.createdAt, from, to),
            tasksTotal: a.tasks.length,
            tasksCompleted: a.tasks.filter(t => t.completed).length,
            tasksCompletedThisWeek: a.tasks.filter(t => t.completed && inRange(t.updatedAt, from, to)).length
          }))

        const inProgress = cat.activities
          .filter(a => a.status === 'in_progress')
          .map(a => ({
            id: a.id,
            name: a.name,
            description: a.description,
            startedAt: a.startedAt,
            updatedAt: a.updatedAt,
            isNewThisWeek: inRange(a.createdAt, from, to),
            startedThisWeek: inRange(a.startedAt, from, to),
            tasksTotal: a.tasks.length,
            tasksCompleted: a.tasks.filter(t => t.completed).length,
            tasksCompletedThisWeek: a.tasks.filter(t => t.completed && inRange(t.updatedAt, from, to)).length
          }))

        const todo = cat.activities
          .filter(a => a.status === 'todo')
          .map(a => ({
            id: a.id,
            name: a.name,
            description: a.description,
            updatedAt: a.updatedAt,
            isNewThisWeek: inRange(a.createdAt, from, to),
            tasksTotal: a.tasks.length,
            tasksCompleted: a.tasks.filter(t => t.completed).length,
            tasksCompletedThisWeek: a.tasks.filter(t => t.completed && inRange(t.updatedAt, from, to)).length
          }))

        totalActivitiesCompleted += completedThisWeek.length
        totalActivitiesInProgress += inProgress.length
        totalActivitiesTodo += todo.length
        for (const a of [...completedThisWeek, ...inProgress, ...todo]) {
          totalTasksCompletedThisWeek += a.tasksCompletedThisWeek
          if (a.tasksTotal) totalTasksOpen += a.tasksTotal - a.tasksCompleted
        }

        return {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          completedThisWeek,
          inProgress,
          todo,
          hasActivity: completedThisWeek.length + inProgress.length + todo.length > 0
        }
      }).filter(c => c.hasActivity || c.completedThisWeek.length + c.inProgress.length + c.todo.length >= 0)
    }

    const reportProjects = projects.map(p => {
      const categories = processCategories(p.categories)
      const subProjects = p.children.map(child => ({
        id: child.id,
        name: child.name,
        color: child.color,
        categories: processCategories(child.categories)
      }))
      return {
        id: p.id,
        name: p.name,
        color: p.color,
        parentId: p.parentId,
        categories,
        subProjects
      }
    }).filter(p => !p.parentId) // only root projects (children embedded)

    return NextResponse.json({
      period: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        activitiesCompleted: totalActivitiesCompleted,
        activitiesInProgress: totalActivitiesInProgress,
        activitiesTodo: totalActivitiesTodo,
        tasksCompletedThisWeek: totalTasksCompletedThisWeek,
        tasksOpen: totalTasksOpen
      },
      projects: reportProjects
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
