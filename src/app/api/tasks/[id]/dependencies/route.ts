import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { prerequisiteId } = body

    if (!prerequisiteId) {
      return NextResponse.json({ error: 'prerequisiteId is required' }, { status: 400 })
    }

    if (id === prerequisiteId) {
      return NextResponse.json({ error: 'Cannot add self as prerequisite' }, { status: 400 })
    }

    const dependency = await prisma.taskDependency.create({
      data: {
        id: uuidv4(),
        taskId: id,
        prerequisiteId
      },
      include: {
        prerequisite: {
          select: { id: true, title: true, completed: true }
        }
      }
    })
    return NextResponse.json(dependency, { status: 201 })
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Dependency already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create dependency' }, { status: 500 })
  }
}
