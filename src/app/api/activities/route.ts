import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        category: {
          include: {
            project: true
          }
        },
        tasks: true,
        dependsOn: {
          include: {
            prerequisite: {
              select: { id: true, name: true, status: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(activities)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, status, categoryId, docPath } = body

    const data: Record<string, unknown> = { name, description, status, categoryId, docPath: docPath || null }

    // Auto-set startedAt when status is in_progress
    if (status === 'in_progress') {
      data.startedAt = new Date()
    }

    const activity = await prisma.activity.create({
      data: data as Parameters<typeof prisma.activity.create>[0]['data']
    })
    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}
