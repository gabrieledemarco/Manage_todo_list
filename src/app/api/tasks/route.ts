import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        activity: {
          include: {
            category: {
              include: {
                project: true
              }
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
    const { title, description, completed, dueDate, priority, activityId } = body
    
    const task = await prisma.task.create({
      data: { 
        title, 
        description, 
        completed, 
        dueDate: dueDate ? new Date(dueDate) : null,
        priority, 
        activityId 
      }
    })
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}