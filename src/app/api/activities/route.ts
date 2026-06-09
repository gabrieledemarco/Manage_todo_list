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
        tasks: true
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
    const { name, description, status, categoryId } = body
    
    const activity = await prisma.activity.create({
      data: { name, description, status, categoryId }
    })
    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}