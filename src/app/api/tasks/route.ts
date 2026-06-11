import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reminderFilter = searchParams.get('reminder')

    const where: Record<string, unknown> = {}
    if (reminderFilter === 'true') {
      where.reminder = true
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        activity: {
          include: {
            category: {
              include: {
                project: true
              }
            }
          }
        },
        dependsOn: {
          include: {
            prerequisite: {
              select: { id: true, title: true, completed: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, completed, dueDate, priority, activityId, reminder, reminderDays, docPath } = body

    const task = await prisma.task.create({
      data: {
        title,
        description,
        completed,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        activityId,
        reminder: reminder ?? false,
        reminderDays: reminderDays ?? 1,
        docPath: docPath || null
      }
    })
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
