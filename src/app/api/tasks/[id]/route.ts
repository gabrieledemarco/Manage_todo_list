import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({
      where: { id },
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
      }
    })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, completed, dueDate, priority, activityId, reminder, reminderDays, docPath, sequenceOrder } = body

    const data: Record<string, unknown> = {
      title,
      description,
      completed,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      priority
    }

    if (activityId !== undefined) data.activityId = activityId
    if (reminder !== undefined) data.reminder = reminder
    if (reminderDays !== undefined) data.reminderDays = reminderDays
    if (docPath !== undefined) data.docPath = docPath ?? null
    if (sequenceOrder !== undefined) data.sequenceOrder = sequenceOrder  // null clears it

    const task = await prisma.task.update({
      where: { id },
      data: data as Parameters<typeof prisma.task.update>[0]['data']
    })
    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
