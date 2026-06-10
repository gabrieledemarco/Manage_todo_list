import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all projects with full data
    const projects = await prisma.project.findMany({
      include: {
        categories: {
          include: {
            activities: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    })

    // Calculate stats per project
    const projectStats = projects.map(project => {
      let totalTasks = 0
      let completedTasks = 0
      let overdueTasks = 0
      const now = new Date()

      project.categories.forEach(category => {
        category.activities.forEach(activity => {
          activity.tasks.forEach(task => {
            totalTasks++
            if (task.completed) {
              completedTasks++
            } else if (task.dueDate && new Date(task.dueDate) < now) {
              overdueTasks++
            }
          })
        })
      })

      return {
        id: project.id,
        name: project.name,
        color: project.color,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    })

    // Overall stats
    const allTasks = await prisma.task.findMany()
    const completedTasks = allTasks.filter(t => t.completed).length
    const overdueTasks = allTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length

    // Tasks by priority
    const tasksByPriority = {
      high: allTasks.filter(t => t.priority === 'high').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      low: allTasks.filter(t => t.priority === 'low').length
    }

    // Activities by status
    const activities = await prisma.activity.findMany()
    const activitiesByStatus = {
      todo: activities.filter(a => a.status === 'todo').length,
      in_progress: activities.filter(a => a.status === 'in_progress').length,
      done: activities.filter(a => a.status === 'done').length
    }

    // Weekly completion data (last 7 days)
    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))
      
      const completedToday = await prisma.task.count({
        where: {
          completed: true,
          updatedAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      })
      
      weeklyData.push({
        date: dayStart.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' }),
        completed: completedToday
      })
    }

    return NextResponse.json({
      projectStats,
      overall: {
        totalProjects: projects.length,
        totalTasks: allTasks.length,
        completedTasks,
        pendingTasks: allTasks.length - completedTasks,
        overdueTasks,
        completionRate: allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0
      },
      tasksByPriority,
      activitiesByStatus,
      weeklyData
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}